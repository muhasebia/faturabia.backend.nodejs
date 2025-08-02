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
    
    // Tüm endpoint'lere ayrı ayrı istek at
    const params = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      sort,
      ...otherParams
    };

    const [incomingInvoices, outgoingInvoices, eArchiveInvoices] = await Promise.all([
      nestenService.fetchAllIncomingInvoices(otherParams).catch(() => []),
      nestenService.fetchAllOutgoingInvoices(otherParams).catch(() => []),
      nestenService.fetchAllEArchiveInvoices(otherParams).catch(() => [])
    ]);

    // Gelen faturaları
    const gelenFaturalar = (incomingInvoices || []).map(inv => ({...inv, type: 'incoming'}));
    
    // Giden faturaları (outgoing + eArchive)
    const outgoingMapped = (outgoingInvoices || []).map(inv => ({...inv, type: 'outgoing'}));
    const eArchiveMapped = (eArchiveInvoices || []).map(inv => ({...inv, type: 'outgoing'}));
    const gidenFaturalar = [...outgoingMapped, ...eArchiveMapped];

    // Hepsini birleştir
    const tumFaturalar = [...gelenFaturalar, ...gidenFaturalar];

    // Tarihsel sırala (yeniden eskiye)
    tumFaturalar.sort((a, b) => {
      const dateA = new Date(a.issueDate || a.createDate || 0);
      const dateB = new Date(b.issueDate || b.createDate || 0);
      return dateB - dateA;
    });

    const gelenTutar = gelenFaturalar.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    const gidenTutar = gidenFaturalar.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    const toplamTutar = gelenTutar + gidenTutar;

    res.status(200).json({
      invoices: tumFaturalar,
      totalCount: tumFaturalar.length,
      currentPage: parseInt(page),
      summary: {
        incoming: {
          count: gelenFaturalar.length,
          totalAmount: Math.round(gelenTutar * 100) / 100
        },
        outgoing: {
          count: gidenFaturalar.length,
          totalAmount: Math.round(gidenTutar * 100) / 100
        },
        total: {
          count: tumFaturalar.length,
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
    
    // TÜM gelen faturaları çek
    const invoices = await nestenService.fetchAllIncomingInvoices({ 
      sort,
      ...otherParams 
    });
    
    if (!invoices || !Array.isArray(invoices)) {
      return res.status(200).json({
        invoices: [],
        totalCount: 0,
        totalAmount: 0
      });
    }
    
    const totalAmount = invoices.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    res.status(200).json({
      invoices: invoices,
      totalCount: invoices.length,
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

    const [outgoingInvoices, eArchiveInvoices] = await Promise.all([
      nestenService.fetchAllOutgoingInvoices(otherParams).catch(() => []),
      nestenService.fetchAllEArchiveInvoices(otherParams).catch(() => [])
    ]);
    
    // Birleştir ve tarihsel sırala
    const allInvoices = [...(outgoingInvoices || []), ...(eArchiveInvoices || [])];
    
    allInvoices.sort((a, b) => {
      const dateA = new Date(a.issueDate || a.createDate || 0);
      const dateB = new Date(b.issueDate || b.createDate || 0);
      return dateB - dateA;
    });

    const totalAmount = allInvoices.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    res.status(200).json({
      invoices: allInvoices,
      totalCount: allInvoices.length,
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

export { 
  fetchAllInvoices,
  getAllInvoicesLive,
  getIncomingInvoicesLive,
  getOutgoingInvoicesLive,
  getUserStatistics
};