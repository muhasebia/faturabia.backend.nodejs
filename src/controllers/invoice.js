import NestenService from '../services/nestenService.js';
import UserInvoices from '../models/UserInvoices.js';
import User from '../models/User.js';

async function getIncomingInvoicesForStats(req, res) {
  try {
    const userId = req.userId;
    
    const userInvoices = await UserInvoices.findOne({ userId });
    if (!userInvoices) {
      return res.status(200).json({
        invoices: [],
        totalCount: 0,
        totalAmount: 0
      });
    }

    const gelenFaturalar = [
      ...(userInvoices.eFatura.incoming || []),
      ...(userInvoices.eArchive.incoming || [])
    ];

    const totalAmount = gelenFaturalar.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    gelenFaturalar.sort((a, b) => {
      const dateA = new Date(a.issueDate || a.createDate || 0);
      const dateB = new Date(b.issueDate || b.createDate || 0);
      return dateB - dateA;
    });

    res.status(200).json({
      invoices: gelenFaturalar,
      totalCount: gelenFaturalar.length,
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

async function getOutgoingInvoicesForStats(req, res) {
  try {
    const userId = req.userId;
    
    const userInvoices = await UserInvoices.findOne({ userId });
    if (!userInvoices) {
      return res.status(200).json({
        invoices: [],
        totalCount: 0,
        totalAmount: 0
      });
    }

    const gidenFaturalar = [
      ...(userInvoices.eFatura.outgoing || []),
      ...(userInvoices.eArchive.outgoing || [])
    ];

    const totalAmount = gidenFaturalar.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    gidenFaturalar.sort((a, b) => {
      const dateA = new Date(a.issueDate || a.createDate || 0);
      const dateB = new Date(b.issueDate || b.createDate || 0);
      return dateB - dateA;
    });

    res.status(200).json({
      invoices: gidenFaturalar,
      totalCount: gidenFaturalar.length,
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
    
    const results = {
      incoming: { fetched: 0, new: 0, updated: 0, error: null },
      outgoing: { fetched: 0, new: 0, updated: 0, error: null },
      drafts: { fetched: 0, new: 0, updated: 0, error: null },
      eArchive: { fetched: 0, new: 0, updated: 0, error: null },
      eArchiveDrafts: { fetched: 0, new: 0, updated: 0, error: null }
    };

    let userInvoices = await UserInvoices.findOne({ userId: userId });
    if (!userInvoices) {
      userInvoices = new UserInvoices({ 
        userId: userId,
        eFatura: { incoming: [], outgoing: [], incomingDraft: [], outgoingDraft: [] },
        eArchive: { incoming: [], outgoing: [], incomingDraft: [], outgoingDraft: [] },
        lastFetchDate: {}
      });
    }

    if (!userInvoices.lastFetchDate) {
      userInvoices.lastFetchDate = {};
    }

    const apiPromises = [
      nestenService.fetchAllIncomingInvoices({ 
        lastSyncDate: userInvoices.lastFetchDate?.incomingInvoices 
      }).then(data => ({ type: 'incoming', data })).catch(error => ({ type: 'incoming', error: error.message })),
      
      nestenService.fetchAllOutgoingInvoices({ 
        lastSyncDate: userInvoices.lastFetchDate?.outgoingInvoices 
      }).then(data => ({ type: 'outgoing', data })).catch(error => ({ type: 'outgoing', error: error.message })),
      
      nestenService.fetchAllDraftInvoices().then(data => ({ type: 'drafts', data })).catch(error => ({ type: 'drafts', error: error.message })),
      
      nestenService.fetchAllEArchiveInvoices({ 
        lastSyncDate: userInvoices.lastFetchDate?.eArchiveInvoices 
      }).then(data => ({ type: 'eArchive', data })).catch(error => ({ type: 'eArchive', error: error.message })),
      
      nestenService.fetchAllEArchiveDraftInvoices().then(data => ({ type: 'eArchiveDrafts', data })).catch(error => ({ type: 'eArchiveDrafts', error: error.message }))
    ];

    const apiResults = await Promise.all(apiPromises);

    for (const result of apiResults) {
      const { type, data, error } = result;
      
      if (error) {
        results[type].error = error;
        continue;
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        continue;
      }

      results[type].fetched = data.length;

      let targetArray, existingUuids;
      
      switch (type) {
        case 'incoming':
          targetArray = userInvoices.eFatura.incoming;
          existingUuids = new Set(targetArray.map(inv => inv.uuid || inv.id).filter(Boolean));
          userInvoices.lastFetchDate.incomingInvoices = new Date();
          break;
          
        case 'outgoing':
          targetArray = userInvoices.eFatura.outgoing;
          existingUuids = new Set(targetArray.map(inv => inv.uuid || inv.id).filter(Boolean));
          userInvoices.lastFetchDate.outgoingInvoices = new Date();
          break;
          
        case 'drafts':
          targetArray = userInvoices.eFatura.outgoingDraft;
          existingUuids = new Set(targetArray.map(inv => inv.uuid || inv.id).filter(Boolean));
          userInvoices.lastFetchDate.draftInvoices = new Date();
          break;
          
        case 'eArchive':
          targetArray = userInvoices.eArchive.outgoing;
          existingUuids = new Set(targetArray.map(inv => inv.uuid || inv.id).filter(Boolean));
          userInvoices.lastFetchDate.eArchiveInvoices = new Date();
          break;
          
        case 'eArchiveDrafts':
          targetArray = userInvoices.eArchive.outgoingDraft;
          existingUuids = new Set(targetArray.map(inv => inv.uuid || inv.id).filter(Boolean));
          userInvoices.lastFetchDate.eArchiveDraftInvoices = new Date();
          break;
      }

      for (const invoiceData of data) {
        const uuid = invoiceData.uuid || invoiceData.id;
        if (!uuid) continue;

        // NES fatura ID'sini explicit olarak ekle
        const processedInvoiceData = {
          ...invoiceData,
          nesInvoiceId: uuid // NES API'den gelen benzersiz ID
        };

        if (existingUuids.has(uuid)) {
          const index = targetArray.findIndex(inv => (inv.uuid || inv.id) === uuid);
          if (index !== -1) {
            targetArray[index] = processedInvoiceData;
            results[type].updated++;
          }
        } else {
          targetArray.push(processedInvoiceData);
          results[type].new++;
        }
      }

    }

    await userInvoices.save();

    const totalFetched = 
      results.incoming.fetched + 
      results.outgoing.fetched + 
      results.drafts.fetched + 
      results.eArchive.fetched + 
      results.eArchiveDrafts.fetched;

    const totalNew = 
      results.incoming.new + 
      results.outgoing.new + 
      results.drafts.new + 
      results.eArchive.new + 
      results.eArchiveDrafts.new;

    const totalUpdated = 
      results.incoming.updated + 
      results.outgoing.updated + 
      results.drafts.updated + 
      results.eArchive.updated + 
      results.eArchiveDrafts.updated;

    const errors = Object.entries(results)
      .filter(([_, result]) => result.error)
      .map(([type, result]) => ({ type, error: result.error }));

    res.status(200).json({
      success: true,
      message: 'Faturalar başarıyla senkronize edildi.',
      summary: {
        totalFetched,
        totalNew,
        totalUpdated,
        finalTotal: userInvoices.toplamFatura
      },
      details: results,
      errors: errors.length > 0 ? errors : undefined,
      lastFetchDate: userInvoices.lastFetchDate
    });

  } catch (error) {
    console.error('Tüm faturalar çekilirken genel hata:', error);
    res.status(500).json({
      success: false,
      error: 'Tüm faturalar çekilirken bir hata oluştu.',
      message: error.message
    });
  }
}


async function getAllInvoicesForStats(req, res) {
  try {
    const userId = req.userId;
    
    const userInvoices = await UserInvoices.findOne({ userId });
    if (!userInvoices) {
      return res.status(200).json({
        invoices: [],
        totalCount: 0,
        summary: {
          incoming: { count: 0, totalAmount: 0 },
          outgoing: { count: 0, totalAmount: 0 },
          total: { count: 0, totalAmount: 0 }
        }
      });
    }

    const gelenFaturalar = [
      ...(userInvoices.eFatura.incoming || []).map(inv => ({...inv, type: 'incoming'})),
      ...(userInvoices.eArchive.incoming || []).map(inv => ({...inv, type: 'incoming'}))
    ];

    const gidenFaturalar = [
      ...(userInvoices.eFatura.outgoing || []).map(inv => ({...inv, type: 'outgoing'})),
      ...(userInvoices.eArchive.outgoing || []).map(inv => ({...inv, type: 'outgoing'}))
    ];

    const tumFaturalar = [...gelenFaturalar, ...gidenFaturalar];

    const gelenTutar = gelenFaturalar.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    const gidenTutar = gidenFaturalar.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    const toplamTutar = gelenTutar + gidenTutar;

    tumFaturalar.sort((a, b) => {
      const dateA = new Date(a.issueDate || a.createDate || 0);
      const dateB = new Date(b.issueDate || b.createDate || 0);
      return dateB - dateA;
    });

    res.status(200).json({
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

async function getUserStatistics(req, res) {
  try {
    const userId = req.userId;
    
    const userInvoices = await UserInvoices.findOne({ userId });
    if (!userInvoices) {
      return res.status(200).json({
        message: 'Henüz fatura verisi bulunamadı.',
        statistics: {
          toplamTutar: 0,
          gelenTutar: 0,
          gidenTutar: 0,
          toplaMiktar: 0,
          karZarar: 0,
          gelenMiktar: 0,
          gidenMiktar: 0
        }
      });
    }

    // Gelen faturalar (incoming)
    const gelenFaturalar = [
      ...(userInvoices.eFatura.incoming || []),
      ...(userInvoices.eArchive.incoming || [])
    ];

    // Giden faturalar (outgoing)
    const gidenFaturalar = [
      ...(userInvoices.eFatura.outgoing || []),
      ...(userInvoices.eArchive.outgoing || [])
    ];

    // Taslak faturalar (drafts) - hesaplamalara dahil edilmeyecek
    const taslakFaturalar = [
      ...(userInvoices.eFatura.incomingDraft || []),
      ...(userInvoices.eFatura.outgoingDraft || []),
      ...(userInvoices.eArchive.incomingDraft || []),
      ...(userInvoices.eArchive.outgoingDraft || [])
    ];

    // Gelen toplam tutar
    const gelenTutar = gelenFaturalar.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    // Giden toplam tutar
    const gidenTutar = gidenFaturalar.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    // Toplam tutar (gelen + giden)
    const toplamTutar = gelenTutar + gidenTutar;

    // Kar/Zarar (gelen - giden)
    const karZarar = gelenTutar - gidenTutar;

    // Miktar sayıları
    const gelenMiktar = gelenFaturalar.length;
    const gidenMiktar = gidenFaturalar.length;
    const toplamMiktar = gelenMiktar + gidenMiktar;

    res.status(200).json({
      success: true,
      statistics: {
        toplamTutar: Math.round(toplamTutar * 100) / 100,
        gelenTutar: Math.round(gelenTutar * 100) / 100,
        gidenTutar: Math.round(gidenTutar * 100) / 100,
        karZarar: Math.round(karZarar * 100) / 100,
        toplamMiktar,
        gelenMiktar,
        gidenMiktar,
        taslakMiktar: taslakFaturalar.length
      },
      summary: {
        gelenFaturalar: {
          miktar: gelenMiktar,
          tutar: Math.round(gelenTutar * 100) / 100,
          ortalama: gelenMiktar > 0 ? Math.round((gelenTutar / gelenMiktar) * 100) / 100 : 0
        },
        gidenFaturalar: {
          miktar: gidenMiktar,
          tutar: Math.round(gidenTutar * 100) / 100,
          ortalama: gidenMiktar > 0 ? Math.round((gidenTutar / gidenMiktar) * 100) / 100 : 0
        },
        taslakFaturalar: {
          miktar: taslakFaturalar.length
        }
      },
      lastUpdated: new Date().toISOString()
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
  getIncomingInvoicesForStats,
  getOutgoingInvoicesForStats,
  getAllInvoicesForStats,
  getUserStatistics
}; 