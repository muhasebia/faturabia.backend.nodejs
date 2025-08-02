import NestenService from '../services/nestenService.js';
import UserInvoices from '../models/UserInvoices.js';
import User from '../models/User.js';

async function fetchAllInvoices(req, res) {
  try {
    const userId = req.userId;
    
    const user = await User.findById(userId);
    if (!user || !user.nesApiKey) {
      return res.status(400).json({ 
        error: 'NES API anahtarı bulunamadı. Lütfen önce API anahtarınızı kaydedin.' 
      });
    }

    const nestenService = new NestenService(user.nesApiKey);
    
    // Sadece API'den veri çek, veritabanına kaydetme
    const apiPromises = [
      nestenService.fetchAllIncomingInvoices().then(data => ({ type: 'incoming', data })).catch(error => ({ type: 'incoming', error: error.message })),
      nestenService.fetchAllOutgoingInvoices().then(data => ({ type: 'outgoing', data })).catch(error => ({ type: 'outgoing', error: error.message })),
      nestenService.fetchAllDraftInvoices().then(data => ({ type: 'drafts', data })).catch(error => ({ type: 'drafts', error: error.message })),
      nestenService.fetchAllEArchiveInvoices().then(data => ({ type: 'eArchive', data })).catch(error => ({ type: 'eArchive', error: error.message })),
      nestenService.fetchAllEArchiveDraftInvoices().then(data => ({ type: 'eArchiveDrafts', data })).catch(error => ({ type: 'eArchiveDrafts', error: error.message }))
    ];

    const apiResults = await Promise.all(apiPromises);

    // Sadece istatistik hesapla
    let gelenFaturalar = [];
    let gidenFaturalar = [];
    let taslakFaturalar = [];
    
    for (const result of apiResults) {
      const { type, data, error } = result;
      
      if (error || !data || !Array.isArray(data)) {
        continue;
      }

      switch (type) {
        case 'incoming':
          gelenFaturalar.push(...data);
          break;
        case 'outgoing':
        case 'eArchive':
          gidenFaturalar.push(...data);
          break;
        case 'drafts':
        case 'eArchiveDrafts':
          taslakFaturalar.push(...data);
          break;
      }
    }

    // İstatistikleri hesapla
    const gelenTutar = gelenFaturalar.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    const gidenTutar = gidenFaturalar.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    const toplamTutar = gelenTutar + gidenTutar;
    const karZarar = gelenTutar - gidenTutar;

    // Sadece istatistiği kaydet
    let userInvoices = await UserInvoices.findOne({ userId: userId });
    if (!userInvoices) {
      userInvoices = new UserInvoices({ 
        userId: userId,
        eFatura: { incoming: [], outgoing: [], incomingDraft: [], outgoingDraft: [] },
        eArchive: { incoming: [], outgoing: [], incomingDraft: [], outgoingDraft: [] },
        lastFetchDate: {}
      });
    }

    // Sadece istatistiği güncelle
    userInvoices.statistics = {
      toplamTutar: Math.round(toplamTutar * 100) / 100,
      gelenTutar: Math.round(gelenTutar * 100) / 100,
      gidenTutar: Math.round(gidenTutar * 100) / 100,
      karZarar: Math.round(karZarar * 100) / 100,
      toplamMiktar: gelenFaturalar.length + gidenFaturalar.length,
      gelenMiktar: gelenFaturalar.length,
      gidenMiktar: gidenFaturalar.length,
      taslakMiktar: taslakFaturalar.length,
      lastCalculated: new Date()
    };

    await userInvoices.save();

    res.status(200).json({
      success: true,
      message: 'İstatistikler başarıyla hesaplandı ve kaydedildi.',
      statistics: userInvoices.statistics,
      summary: {
        totalProcessed: gelenFaturalar.length + gidenFaturalar.length + taslakFaturalar.length,
        incoming: gelenFaturalar.length,
        outgoing: gidenFaturalar.length,
        drafts: taslakFaturalar.length
      }
    });

  } catch (error) {
    console.error('İstatistik hesaplama sırasında hata:', error);
    res.status(500).json({
      success: false,
      error: 'İstatistik hesaplama sırasında bir hata oluştu.',
      message: error.message
    });
  }
}

async function getAllInvoicesLive(req, res) {
  try {
    const userId = req.userId;
    const { page = 1, pageSize = 100, sort = 'CreatedAt desc', ...otherParams } = req.query;
    
    const user = await User.findById(userId);
    if (!user || !user.nesApiKey) {
      return res.status(400).json({ 
        error: 'NES API anahtarı bulunamadı. Lütfen önce API anahtarınızı kaydedin.' 
      });
    }

    const nestenService = new NestenService(user.nesApiKey);
    
    // Her endpoint'ten mümkün olduğunca çok veri çek
    const apiPageSize = 99; // API'nin kabul ettiği max değer
    const params = {
      page: 1, // Her zaman 1. sayfadan başla
      pageSize: apiPageSize,
      sort,
      ...otherParams
    };

    console.log('API çağrısı parametreleri:', params);

    const [incomingInvoices, outgoingInvoices, eArchiveInvoices] = await Promise.all([
      nestenService.fetchIncomingInvoices(params).catch(() => ({ data: [] })),
      nestenService.fetchOutgoingInvoices(params).catch(() => ({ data: [] })),
      nestenService.fetchEArchiveInvoices(params).catch(() => ({ data: [] }))
    ]);

    console.log('API Responses:', {
      incoming: { dataCount: incomingInvoices.data?.length, totalCount: incomingInvoices.totalCount },
      outgoing: { dataCount: outgoingInvoices.data?.length, totalCount: outgoingInvoices.totalCount },
      eArchive: { dataCount: eArchiveInvoices.data?.length, totalCount: eArchiveInvoices.totalCount }
    });

    // Gelen faturaları
    const gelenFaturalar = (incomingInvoices.data || []).map(inv => ({...inv, type: 'incoming'}));
    
    // Giden faturaları (outgoing + eArchive)
    const outgoingMapped = (outgoingInvoices.data || []).map(inv => ({...inv, type: 'outgoing'}));
    const eArchiveMapped = (eArchiveInvoices.data || []).map(inv => ({...inv, type: 'outgoing'}));
    const gidenFaturalar = [...outgoingMapped, ...eArchiveMapped];

    // Hepsini birleştir
    const tumFaturalar = [...gelenFaturalar, ...gidenFaturalar];

    // Tarihsel sırala (yeniden eskiye)
    tumFaturalar.sort((a, b) => {
      const dateA = new Date(a.issueDate || a.createDate || 0);
      const dateB = new Date(b.issueDate || b.createDate || 0);
      return dateB - dateA;
    });

    // Manuel pagination uygula
    const startIndex = (parseInt(page) - 1) * parseInt(pageSize);
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedInvoices = tumFaturalar.slice(startIndex, endIndex);

    const gelenTutar = gelenFaturalar.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    const gidenTutar = gidenFaturalar.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    const toplamTutar = gelenTutar + gidenTutar;

    // API'den gelen gerçek toplam sayıları kullan
    const totalIncomingCount = incomingInvoices.totalCount || gelenFaturalar.length;
    const totalOutgoingCount = (outgoingInvoices.totalCount || 0) + (eArchiveInvoices.totalCount || 0);
    const totalAllCount = totalIncomingCount + totalOutgoingCount;

    res.status(200).json({
      invoices: paginatedInvoices,
      totalCount: totalAllCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalAllCount / parseInt(pageSize)),
      pageSize: parseInt(pageSize),
      summary: {
        incoming: {
          count: totalIncomingCount,
          totalAmount: Math.round(gelenTutar * 100) / 100
        },
        outgoing: {
          count: totalOutgoingCount,
          totalAmount: Math.round(gidenTutar * 100) / 100
        },
        total: {
          count: totalAllCount,
          totalAmount: Math.round(toplamTutar * 100) / 100
        }
      }
    });

  } catch (error) {
    console.error('Tüm faturalar getirilirken hata:', error);
    res.status(500).json({
      error: 'Tüm faturalar getirilirken hata oluştu.',
      message: error.message
    });
  }
}

async function getIncomingInvoicesLive(req, res) {
  try {
    const userId = req.userId;
    const { page = 1, pageSize = 100, sort = 'CreatedAt desc', ...otherParams } = req.query;
    
    const user = await User.findById(userId);
    if (!user || !user.nesApiKey) {
      return res.status(400).json({ 
        error: 'NES API anahtarı bulunamadı. Lütfen önce API anahtarınızı kaydedin.' 
      });
    }

    const nestenService = new NestenService(user.nesApiKey);
    
    // Gelen faturaları çek (sayfa bazlı)
    const response = await nestenService.fetchIncomingInvoices({ 
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      sort,
      ...otherParams 
    });
    
    if (!response || !response.data || !Array.isArray(response.data)) {
      return res.status(200).json({
        invoices: [],
        totalCount: 0,
        totalAmount: 0
      });
    }
    
    const invoices = response.data;
    const totalAmount = invoices.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    res.status(200).json({
      invoices: invoices,
      totalCount: response.totalCount || invoices.length,
      currentPage: parseInt(page),
      totalPages: response.totalPages || Math.ceil((response.totalCount || invoices.length) / parseInt(pageSize)),
      pageSize: parseInt(pageSize),
      totalAmount: Math.round(totalAmount * 100) / 100
    });

  } catch (error) {
    console.error('Gelen faturalar getirilirken hata:', error);
    res.status(500).json({
      error: 'Gelen faturalar getirilirken hata oluştu.',
      message: error.message
    });
  }
}

async function getOutgoingInvoicesLive(req, res) {
  try {
    const userId = req.userId;
    const { page = 1, pageSize = 100, sort = 'CreatedAt desc', ...otherParams } = req.query;
    
    const user = await User.findById(userId);
    if (!user || !user.nesApiKey) {
      return res.status(400).json({ 
        error: 'NES API anahtarı bulunamadı. Lütfen önce API anahtarınızı kaydedin.' 
      });
    }

    const nestenService = new NestenService(user.nesApiKey);
    
    // Giden faturaları çek (outgoing + eArchive birleştir)
    const params = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      sort,
      ...otherParams
    };

    const [outgoingResponse, eArchiveResponse] = await Promise.all([
      nestenService.fetchOutgoingInvoices(params).catch(() => ({ data: [] })),
      nestenService.fetchEArchiveInvoices(params).catch(() => ({ data: [] }))
    ]);
    
    const outgoingInvoices = outgoingResponse.data || [];
    const eArchiveInvoices = eArchiveResponse.data || [];
    
    // Birleştir ve tarihsel sırala
    const allInvoices = [...outgoingInvoices, ...eArchiveInvoices];
    
    allInvoices.sort((a, b) => {
      const dateA = new Date(a.issueDate || a.createDate || 0);
      const dateB = new Date(b.issueDate || b.createDate || 0);
      return dateB - dateA;
    });

    const totalAmount = allInvoices.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    const totalCount = (outgoingResponse.totalCount || 0) + (eArchiveResponse.totalCount || 0);

    res.status(200).json({
      invoices: allInvoices,
      totalCount: totalCount || allInvoices.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil((totalCount || allInvoices.length) / parseInt(pageSize)),
      pageSize: parseInt(pageSize),
      totalAmount: Math.round(totalAmount * 100) / 100
    });

  } catch (error) {
    console.error('Giden faturalar getirilirken hata:', error);
    res.status(500).json({
      error: 'Giden faturalar getirilirken hata oluştu.',
      message: error.message
    });
  }
}

async function getUserStatistics(req, res) {
  try {
    const userId = req.userId;
    
    const userInvoices = await UserInvoices.findOne({ userId });
    if (!userInvoices || !userInvoices.statistics) {
      return res.status(200).json({
        message: 'Henüz istatistik hesaplanmamış. Lütfen önce fetch-all çalıştırın.',
        statistics: {
          toplamTutar: 0,
          gelenTutar: 0,
          gidenTutar: 0,
          toplamMiktar: 0,
          karZarar: 0,
          gelenMiktar: 0,
          gidenMiktar: 0,
          taslakMiktar: 0
        }
      });
    }

    const stats = userInvoices.statistics;

    res.status(200).json({
      success: true,
      statistics: stats,
      summary: {
        gelenFaturalar: {
          miktar: stats.gelenMiktar,
          tutar: stats.gelenTutar,
          ortalama: stats.gelenMiktar > 0 ? Math.round((stats.gelenTutar / stats.gelenMiktar) * 100) / 100 : 0
        },
        gidenFaturalar: {
          miktar: stats.gidenMiktar,
          tutar: stats.gidenTutar,
          ortalama: stats.gidenMiktar > 0 ? Math.round((stats.gidenTutar / stats.gidenMiktar) * 100) / 100 : 0
        },
        taslakFaturalar: {
          miktar: stats.taslakMiktar
        }
      },
      lastCalculated: stats.lastCalculated
    });

  } catch (error) {
    console.error('İstatistikler getirilirken hata:', error);
    res.status(500).json({
      error: 'İstatistikler getirilirken bir hata oluştu.',
      message: error.message
    });
  }
}

async function searchAllInvoices(req, res) {
  try {
    const userId = req.userId;
    const { sort = 'CreatedAt desc', ...filterParams } = req.query;
    
    const user = await User.findById(userId);
    if (!user || !user.nesApiKey) {
      return res.status(400).json({ 
        error: 'NES API anahtarı bulunamadı. Lütfen önce API anahtarınızı kaydedin.' 
      });
    }

    const nestenService = new NestenService(user.nesApiKey);
    
    // Tüm fatura tiplerinden veri çek - pagination olmadan tüm sayfaları al
    console.log('Search parametreleri:', filterParams);

    const apiPromises = [
      nestenService.fetchAllIncomingInvoices(filterParams).then(data => ({ type: 'incoming', data })).catch(error => ({ type: 'incoming', error: error.message, data: [] })),
      nestenService.fetchAllOutgoingInvoices(filterParams).then(data => ({ type: 'outgoing', data })).catch(error => ({ type: 'outgoing', error: error.message, data: [] })),
      nestenService.fetchAllEArchiveInvoices(filterParams).then(data => ({ type: 'eArchive', data })).catch(error => ({ type: 'eArchive', error: error.message, data: [] })),
      nestenService.fetchAllDraftInvoices(filterParams).then(data => ({ type: 'drafts', data })).catch(error => ({ type: 'drafts', error: error.message, data: [] })),
      nestenService.fetchAllEArchiveDraftInvoices(filterParams).then(data => ({ type: 'eArchiveDrafts', data })).catch(error => ({ type: 'eArchiveDrafts', error: error.message, data: [] }))
    ];

    const apiResults = await Promise.all(apiPromises);

    // Tüm faturaları topla ve kategorize et
    let gelenFaturalar = [];
    let gidenFaturalar = [];
    let taslakFaturalar = [];
    
    for (const result of apiResults) {
      const { type, data, error } = result;
      
      if (error) {
        console.warn(`${type} faturalar alınırken hata:`, error);
      }
      
      if (!data || !Array.isArray(data)) {
        continue;
      }

      switch (type) {
        case 'incoming':
          gelenFaturalar.push(...data.map(inv => ({...inv, category: 'incoming'})));
          break;
        case 'outgoing':
        case 'eArchive':
          gidenFaturalar.push(...data.map(inv => ({...inv, category: 'outgoing'})));
          break;
        case 'drafts':
        case 'eArchiveDrafts':
          taslakFaturalar.push(...data.map(inv => ({...inv, category: 'draft'})));
          break;
      }
    }

    // Tüm faturaları birleştir
    const tumFaturalar = [...gelenFaturalar, ...gidenFaturalar, ...taslakFaturalar];

    // Sıralama uygula (varsayılan: tarihsel sıralama - yeniden eskiye)
    tumFaturalar.sort((a, b) => {
      if (sort.includes('CreatedAt')) {
        const dateA = new Date(a.issueDate || a.createDate || 0);
        const dateB = new Date(b.issueDate || b.createDate || 0);
        return sort.includes('desc') ? dateB - dateA : dateA - dateB;
      }
      // Diğer sıralama seçenekleri için varsayılan
      return 0;
    });

    // İstatistikleri hesapla
    const gelenTutar = gelenFaturalar.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    const gidenTutar = gidenFaturalar.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    const taslakTutar = taslakFaturalar.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    const toplamTutar = gelenTutar + gidenTutar + taslakTutar;

    res.status(200).json({
      success: true,
      invoices: tumFaturalar,
      totalCount: tumFaturalar.length,
      summary: {
        incoming: {
          count: gelenFaturalar.length,
          totalAmount: Math.round(gelenTutar * 100) / 100
        },
        outgoing: {
          count: gidenFaturalar.length,
          totalAmount: Math.round(gidenTutar * 100) / 100
        },
        drafts: {
          count: taslakFaturalar.length,
          totalAmount: Math.round(taslakTutar * 100) / 100
        },
        total: {
          count: tumFaturalar.length,
          totalAmount: Math.round(toplamTutar * 100) / 100
        }
      },
      appliedFilters: filterParams,
      sort: sort
    });

  } catch (error) {
    console.error('Fatura arama sırasında hata:', error);
    res.status(500).json({
      success: false,
      error: 'Fatura arama sırasında bir hata oluştu.',
      message: error.message
    });
  }
}

export { 
  fetchAllInvoices,
  getAllInvoicesLive,
  getIncomingInvoicesLive,
  getOutgoingInvoicesLive,
  getUserStatistics,
  searchAllInvoices
};