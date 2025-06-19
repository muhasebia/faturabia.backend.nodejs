import NestenService from '../services/nestenService.js';
import UserInvoices from '../models/UserInvoices.js';
import User from '../models/User.js';
import { saveCustomersFromInvoices, updateCustomerInvoiceCounts } from '../services/customerService.js';

async function fetchIncomingInvoices(req, res) {
  try {
    const userId = req.userId;
    
    const user = await User.findById(userId);
    if (!user || !user.nesApiKey) {
      return res.status(400).json({ 
        error: 'NES API anahtarı bulunamadı. Lütfen önce API anahtarınızı kaydedin.' 
      });
    }

    const nestenService = new NestenService(user.nesApiKey);
    
    console.log('Gelen faturalar çekiliyor...');
    
    const invoices = await nestenService.fetchAllIncomingInvoices();
    
    if (!invoices || invoices.length === 0) {
      return res.status(200).json({ 
        message: 'Hiç gelen fatura bulunamadı.',
        count: 0
      });
    }

    let userInvoices = await UserInvoices.findOne({ userId: userId });
    if (!userInvoices) {
      userInvoices = new UserInvoices({ 
        userId: userId,
        eFatura: { incoming: [], outgoing: [], incomingDraft: [], outgoingDraft: [] },
        eArchive: { incoming: [], outgoing: [], incomingDraft: [], outgoingDraft: [] }
      });
    }

    const existingUuids = new Set(
      userInvoices.eFatura.incoming.map(inv => inv.uuid || inv.id).filter(Boolean)
    );

    let newCount = 0;
    let updatedCount = 0;

    for (const invoiceData of invoices) {
      const uuid = invoiceData.uuid || invoiceData.id;
      if (!uuid) continue;

      if (existingUuids.has(uuid)) {
        const index = userInvoices.eFatura.incoming.findIndex(inv => 
          (inv.uuid || inv.id) === uuid
        );
        if (index !== -1) {
          userInvoices.eFatura.incoming[index] = invoiceData;
          updatedCount++;
        }
      } else {
        userInvoices.eFatura.incoming.push(invoiceData);
        newCount++;
      }
    }

    userInvoices.lastFetchDate.incomingInvoices = new Date();
    
    await userInvoices.save();

    res.status(200).json({
      message: 'Gelen faturalar başarıyla işlendi.',
      type: 'incoming',
      totalFetched: invoices.length,
      newCount,
      updatedCount,
      toplamFatura: userInvoices.toplamFatura
    });

  } catch (error) {
    console.error('Gelen faturalar çekilirken hata:', error);
    res.status(500).json({
      error: 'Gelen faturalar çekilirken bir hata oluştu.',
      message: error.message
    });
  }
}

async function fetchOutgoingInvoices(req, res) {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user || !user.nesApiKey) {
      return res.status(400).json({ 
        error: 'NES API anahtarı bulunamadı. Lütfen önce API anahtarınızı kaydedin.' 
      });
    }

    const nestenService = new NestenService(user.nesApiKey);
    
    console.log('Giden faturalar çekiliyor...');
    
    const invoices = await nestenService.fetchAllOutgoingInvoices();
    
    if (!invoices || invoices.length === 0) {
      return res.status(200).json({ 
        message: 'Hiç giden fatura bulunamadı.',
        count: 0
      });
    }

    let userInvoices = await UserInvoices.findOne({ userId: userId });
    if (!userInvoices) {
      userInvoices = new UserInvoices({ 
        userId: userId,
        eFatura: { incoming: [], outgoing: [], incomingDraft: [], outgoingDraft: [] },
        eArchive: { incoming: [], outgoing: [], incomingDraft: [], outgoingDraft: [] }
      });
    }

    const existingUuids = new Set(
      userInvoices.eFatura.outgoing.map(inv => inv.uuid || inv.id).filter(Boolean)
    );

    let newCount = 0;
    let updatedCount = 0;

    for (const invoiceData of invoices) {
      const uuid = invoiceData.uuid || invoiceData.id;
      if (!uuid) continue;

      if (existingUuids.has(uuid)) {
        const index = userInvoices.eFatura.outgoing.findIndex(inv => 
          (inv.uuid || inv.id) === uuid
        );
        if (index !== -1) {
          userInvoices.eFatura.outgoing[index] = invoiceData;
          updatedCount++;
        }
      } else {
        userInvoices.eFatura.outgoing.push(invoiceData);
        newCount++;
      }
    }

    userInvoices.lastFetchDate.outgoingInvoices = new Date();
    
    await userInvoices.save();

    res.status(200).json({
      message: 'Giden faturalar başarıyla işlendi.',
      type: 'outgoing',
      totalFetched: invoices.length,
      newCount,
      updatedCount,
      toplamFatura: userInvoices.toplamFatura
    });

  } catch (error) {
    console.error('Giden faturalar çekilirken hata:', error);
    res.status(500).json({
      error: 'Giden faturalar çekilirken bir hata oluştu.',
      message: error.message
    });
  }
}

async function fetchDraftInvoices(req, res) {
  try {
    const userId = req.userId;
    
    const user = await User.findById(userId);
    if (!user || !user.nesApiKey) {
      return res.status(400).json({ 
        error: 'NES API anahtarı bulunamadı. Lütfen önce API anahtarınızı kaydedin.' 
      });
    }

    const nestenService = new NestenService(user.nesApiKey);
    
    console.log('Taslak faturalar çekiliyor...');
    
    const invoices = await nestenService.fetchAllDraftInvoices();
    
    if (!invoices || invoices.length === 0) {
      return res.status(200).json({ 
        message: 'Hiç taslak fatura bulunamadı.',
        count: 0
      });
    }

    let userInvoices = await UserInvoices.findOne({ userId: userId });
    if (!userInvoices) {
      userInvoices = new UserInvoices({ 
        userId: userId,
        eFatura: { incoming: [], outgoing: [], incomingDraft: [], outgoingDraft: [] },
        eArchive: { incoming: [], outgoing: [], incomingDraft: [], outgoingDraft: [] }
      });
    }

    const existingUuids = new Set(
      userInvoices.eFatura.outgoingDraft.map(inv => inv.uuid || inv.id).filter(Boolean)
    );

    let newCount = 0;
    let updatedCount = 0;

    for (const invoiceData of invoices) {
      const uuid = invoiceData.uuid || invoiceData.id;
      if (!uuid) continue;

      if (existingUuids.has(uuid)) {
        const index = userInvoices.eFatura.outgoingDraft.findIndex(inv => 
          (inv.uuid || inv.id) === uuid
        );
        if (index !== -1) {
          userInvoices.eFatura.outgoingDraft[index] = invoiceData;
          updatedCount++;
        }
      } else {
        userInvoices.eFatura.outgoingDraft.push(invoiceData);
        newCount++;
      }
    }

    userInvoices.lastFetchDate.draftInvoices = new Date();
    
    await userInvoices.save();

    res.status(200).json({
      message: 'Taslak faturalar başarıyla işlendi.',
      type: 'draft',
      totalFetched: invoices.length,
      newCount,
      updatedCount,
      toplamFatura: userInvoices.toplamFatura
    });

  } catch (error) {
    console.error('Taslak faturalar çekilirken hata:', error);
    res.status(500).json({
      error: 'Taslak faturalar çekilirken bir hata oluştu.',
      message: error.message
    });
  }
}

async function fetchEArchiveInvoices(req, res) {
  try {
    const userId = req.userId;
    
    const user = await User.findById(userId);
    if (!user || !user.nesApiKey) {
      return res.status(400).json({ 
        error: 'NES API anahtarı bulunamadı. Lütfen önce API anahtarınızı kaydedin.' 
      });
    }

    const nestenService = new NestenService(user.nesApiKey);
    
    console.log('e-Arşiv faturalar çekiliyor...');
    
    const invoices = await nestenService.fetchAllEArchiveInvoices();
    
    if (!invoices || invoices.length === 0) {
      return res.status(200).json({ 
        message: 'Hiç e-Arşiv fatura bulunamadı.',
        count: 0
      });
    }

    let userInvoices = await UserInvoices.findOne({ userId: userId });
    if (!userInvoices) {
      userInvoices = new UserInvoices({ 
        userId: userId,
        eFatura: { incoming: [], outgoing: [], incomingDraft: [], outgoingDraft: [] },
        eArchive: { incoming: [], outgoing: [], incomingDraft: [], outgoingDraft: [] }
      });
    }

    const existingUuids = new Set(
      userInvoices.eArchive.outgoing.map(inv => inv.uuid || inv.id).filter(Boolean)
    );

    let newCount = 0;
    let updatedCount = 0;

    for (const invoiceData of invoices) {
      const uuid = invoiceData.uuid || invoiceData.id;
      if (!uuid) continue;

      if (existingUuids.has(uuid)) {
        const index = userInvoices.eArchive.outgoing.findIndex(inv => 
          (inv.uuid || inv.id) === uuid
        );
        if (index !== -1) {
          userInvoices.eArchive.outgoing[index] = invoiceData;
          updatedCount++;
        }
      } else {
        userInvoices.eArchive.outgoing.push(invoiceData);
        newCount++;
      }
    }

    if (!userInvoices.lastFetchDate) {
      userInvoices.lastFetchDate = {};
    }
    userInvoices.lastFetchDate.eArchiveInvoices = new Date();
    
    await userInvoices.save();

    res.status(200).json({
      message: 'e-Arşiv faturalar başarıyla işlendi.',
      type: 'eArchive',
      totalFetched: invoices.length,
      newCount,
      updatedCount,
      toplamFatura: userInvoices.toplamFatura
    });

  } catch (error) {
    console.error('e-Arşiv faturalar çekilirken hata:', error);
    res.status(500).json({
      error: 'e-Arşiv faturalar çekilirken bir hata oluştu.',
      message: error.message
    });
  }
}

async function fetchEArchiveDraftInvoices(req, res) {
  try {
    const userId = req.userId;
    
    const user = await User.findById(userId);
    if (!user || !user.nesApiKey) {
      return res.status(400).json({ 
        error: 'NES API anahtarı bulunamadı. Lütfen önce API anahtarınızı kaydedin.' 
      });
    }

    const nestenService = new NestenService(user.nesApiKey);
    
    console.log('e-Arşiv taslak faturalar çekiliyor...');
    
    const invoices = await nestenService.fetchAllEArchiveDraftInvoices();
    
    if (!invoices || invoices.length === 0) {
      return res.status(200).json({ 
        message: 'Hiç e-Arşiv taslak fatura bulunamadı.',
        count: 0
      });
    }

    let userInvoices = await UserInvoices.findOne({ userId: userId });
    if (!userInvoices) {
      userInvoices = new UserInvoices({ 
        userId: userId,
        eFatura: { incoming: [], outgoing: [], incomingDraft: [], outgoingDraft: [] },
        eArchive: { incoming: [], outgoing: [], incomingDraft: [], outgoingDraft: [] }
      });
    }

    const existingUuids = new Set(
      userInvoices.eArchive.outgoingDraft.map(inv => inv.uuid || inv.id).filter(Boolean)
    );

    let newCount = 0;
    let updatedCount = 0;

    for (const invoiceData of invoices) {
      const uuid = invoiceData.uuid || invoiceData.id;
      if (!uuid) continue;

      if (existingUuids.has(uuid)) {
        const index = userInvoices.eArchive.outgoingDraft.findIndex(inv => 
          (inv.uuid || inv.id) === uuid
        );
        if (index !== -1) {
          userInvoices.eArchive.outgoingDraft[index] = invoiceData;
          updatedCount++;
        }
      } else {
        userInvoices.eArchive.outgoingDraft.push(invoiceData);
        newCount++;
      }
    }

    if (!userInvoices.lastFetchDate) {
      userInvoices.lastFetchDate = {};
    }
    userInvoices.lastFetchDate.eArchiveDraftInvoices = new Date();
    
    await userInvoices.save();

    res.status(200).json({
      message: 'e-Arşiv taslak faturalar başarıyla işlendi.',
      type: 'eArchiveDraft',
      totalFetched: invoices.length,
      newCount,
      updatedCount,
      toplamFatura: userInvoices.toplamFatura
    });

  } catch (error) {
    console.error('e-Arşiv taslak faturalar çekilirken hata:', error);
    res.status(500).json({
      error: 'e-Arşiv taslak faturalar çekilirken bir hata oluştu.',
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

        if (existingUuids.has(uuid)) {
          const index = targetArray.findIndex(inv => (inv.uuid || inv.id) === uuid);
          if (index !== -1) {
            targetArray[index] = invoiceData;
            results[type].updated++;
          }
        } else {
          targetArray.push(invoiceData);
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

    console.log(`Toplam yeni fatura sayısı: ${totalNew}`);
    if (totalNew > 0) {
      try {
        const allNewInvoices = [];
        for (const result of apiResults) {
          if (!result.error && result.data && Array.isArray(result.data)) {
            console.log(`${result.type} türünden ${result.data.length} fatura ekleniyor`);
            allNewInvoices.push(...result.data);
          }
        }
        console.log(`Toplam ${allNewInvoices.length} fatura müşteri işleme için gönderiliyor`);
        if (allNewInvoices.length > 0) {
          await saveCustomersFromInvoices(allNewInvoices, userId);
        }
      } catch (error) {
        console.error('Müşteriler kaydedilirken hata:', error.message);
      }
    } else {
      console.log('Yeni fatura olmadığı için müşteri işleme yapılmıyor');
    }

    const errors = Object.entries(results)
      .filter(([_, result]) => result.error)
      .map(([type, result]) => ({ type, error: result.error }));

    updateCustomerInvoiceCounts(userId).catch(error => {
      console.error('Müşteri fatura sayıları güncellenirken hata:', error.message);
    });

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

async function getInvoices(req, res) {
  try {
    const userId = req.userId;
    const { type, category = 'eFatura' } = req.query;
    
    const userInvoices = await UserInvoices.findOne({ userId });
    
    if (!userInvoices) {
      return res.status(200).json({
        message: 'Henüz fatura bulunamadı.',
        toplamFatura: 0,
        data: {}
      });
    }

    let responseData = {};
    
    if (type) {
      if (category === 'eFatura') {
        responseData = userInvoices.eFatura[type] || [];
      } else if (category === 'eArchive') {
        responseData = userInvoices.eArchive[type] || [];
      }
    } else {
      responseData = {
        eFatura: userInvoices.eFatura,
        eArchive: userInvoices.eArchive
      };
    }
    
    res.status(200).json({
      toplamFatura: userInvoices.toplamFatura,
      lastFetchDate: userInvoices.lastFetchDate,
      data: responseData
    });
  } catch (error) {
    console.error('Faturalar getirilirken hata:', error);
    res.status(500).json({
      error: 'Faturalar getirilirken bir hata oluştu.',
      message: error.message
    });
  }
}

async function getInvoice(req, res) {
  try {
    const userId = req.userId;
    const { uuid } = req.params;
    
    const userInvoices = await UserInvoices.findOne({ userId });
    
    if (!userInvoices) {
      return res.status(404).json({ error: 'Fatura bulunamadı.' });
    }

    const allInvoices = [
      ...userInvoices.eFatura.incoming,
      ...userInvoices.eFatura.outgoing,
      ...userInvoices.eFatura.incomingDraft,
      ...userInvoices.eFatura.outgoingDraft,
      ...userInvoices.eArchive.incoming,
      ...userInvoices.eArchive.outgoing,
      ...userInvoices.eArchive.incomingDraft,
      ...userInvoices.eArchive.outgoingDraft
    ];
    
    const invoice = allInvoices.find(inv => 
      (inv.uuid || inv.id) === uuid
    );
    
    if (!invoice) {
      return res.status(404).json({ error: 'Fatura bulunamadı.' });
    }
    
    res.status(200).json(invoice);
  } catch (error) {
    console.error('Fatura getirilirken hata:', error);
    res.status(500).json({
      error: 'Fatura getirilirken bir hata oluştu.',
      message: error.message
    });
  }
}

async function getIncomingInvoices(req, res) {
  try {
    const userId = req.userId;
    const { page = 1, limit = 50 } = req.query;
    
    const userInvoices = await UserInvoices.findOne({ userId });
    if (!userInvoices) {
      return res.status(200).json({
        invoices: [],
        totalCount: 0,
        currentPage: parseInt(page),
        totalPages: 0,
        summary: {
          count: 0,
          totalAmount: 0
        }
      });
    }

    const allIncoming = [
      ...(userInvoices.eFatura.incoming || []),
      ...(userInvoices.eArchive.incoming || [])
    ];

    const totalAmount = allIncoming.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    allIncoming.sort((a, b) => {
      const dateA = new Date(a.issueDate || a.createDate || 0);
      const dateB = new Date(b.issueDate || b.createDate || 0);
      return dateB - dateA;
    });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedInvoices = allIncoming.slice(skip, skip + parseInt(limit));
    const totalPages = Math.ceil(allIncoming.length / parseInt(limit));

    res.status(200).json({
      invoices: paginatedInvoices,
      totalCount: allIncoming.length,
      currentPage: parseInt(page),
      totalPages,
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1,
      summary: {
        count: allIncoming.length,
        totalAmount: Math.round(totalAmount * 100) / 100
      }
    });

  } catch (error) {
    console.error('Gelen faturalar getirilirken hata:', error);
    res.status(500).json({
      error: 'Gelen faturalar getirilirken hata oluştu.',
      message: error.message
    });
  }
}

async function getOutgoingInvoices(req, res) {
  try {
    const userId = req.userId;
    const { page = 1, limit = 50 } = req.query;
    
    const userInvoices = await UserInvoices.findOne({ userId });
    if (!userInvoices) {
      return res.status(200).json({
        invoices: [],
        totalCount: 0,
        currentPage: parseInt(page),
        totalPages: 0,
        summary: {
          count: 0,
          totalAmount: 0
        }
      });
    }

    const allOutgoing = [
      ...(userInvoices.eFatura.outgoing || []),
      ...(userInvoices.eArchive.outgoing || [])
    ];

    const totalAmount = allOutgoing.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    allOutgoing.sort((a, b) => {
      const dateA = new Date(a.issueDate || a.createDate || 0);
      const dateB = new Date(b.issueDate || b.createDate || 0);
      return dateB - dateA;
    });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedInvoices = allOutgoing.slice(skip, skip + parseInt(limit));
    const totalPages = Math.ceil(allOutgoing.length / parseInt(limit));

    res.status(200).json({
      invoices: paginatedInvoices,
      totalCount: allOutgoing.length,
      currentPage: parseInt(page),
      totalPages,
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1,
      summary: {
        count: allOutgoing.length,
        totalAmount: Math.round(totalAmount * 100) / 100
      }
    });

  } catch (error) {
    console.error('Giden faturalar getirilirken hata:', error);
    res.status(500).json({
      error: 'Giden faturalar getirilirken hata oluştu.',
      message: error.message
    });
  }
}

async function getDraftInvoices(req, res) {
  try {
    const userId = req.userId;
    const { page = 1, limit = 50 } = req.query;
    
    const userInvoices = await UserInvoices.findOne({ userId });
    if (!userInvoices) {
      return res.status(200).json({
        invoices: [],
        totalCount: 0,
        currentPage: parseInt(page),
        totalPages: 0,
        summary: {
          count: 0,
          totalAmount: 0
        }
      });
    }

    const allDrafts = [
      ...(userInvoices.eFatura.incomingDraft || []),
      ...(userInvoices.eFatura.outgoingDraft || []),
      ...(userInvoices.eArchive.incomingDraft || []),
      ...(userInvoices.eArchive.outgoingDraft || [])
    ];

    const totalAmount = allDrafts.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    allDrafts.sort((a, b) => {
      const dateA = new Date(a.issueDate || a.createDate || 0);
      const dateB = new Date(b.issueDate || b.createDate || 0);
      return dateB - dateA;
    });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedInvoices = allDrafts.slice(skip, skip + parseInt(limit));
    const totalPages = Math.ceil(allDrafts.length / parseInt(limit));

    res.status(200).json({
      invoices: paginatedInvoices,
      totalCount: allDrafts.length,
      currentPage: parseInt(page),
      totalPages,
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1,
      summary: {
        count: allDrafts.length,
        totalAmount: Math.round(totalAmount * 100) / 100
      }
    });

  } catch (error) {
    console.error('Taslak faturalar getirilirken hata:', error);
    res.status(500).json({
      error: 'Taslak faturalar getirilirken hata oluştu.',
      message: error.message
    });
  }
}

async function getAllInvoicesFormatted(req, res) {
  try {
    const userId = req.userId;
    const { page = 1, limit = 50 } = req.query;
    
    const userInvoices = await UserInvoices.findOne({ userId });
    if (!userInvoices) {
      return res.status(200).json({
        invoices: [],
        totalCount: 0,
        currentPage: parseInt(page),
        totalPages: 0,
        summary: {
          incoming: { count: 0, totalAmount: 0 },
          outgoing: { count: 0, totalAmount: 0 },
          drafts: { count: 0, totalAmount: 0 },
          total: { count: 0, totalAmount: 0 }
        }
      });
    }

    const incoming = [
      ...(userInvoices.eFatura.incoming || []),
      ...(userInvoices.eArchive.incoming || [])
    ];
    
    const outgoing = [
      ...(userInvoices.eFatura.outgoing || []),
      ...(userInvoices.eArchive.outgoing || [])
    ];
    
    const drafts = [
      ...(userInvoices.eFatura.incomingDraft || []),
      ...(userInvoices.eFatura.outgoingDraft || []),
      ...(userInvoices.eArchive.incomingDraft || []),
      ...(userInvoices.eArchive.outgoingDraft || [])
    ];

    const incomingAmount = incoming.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    const outgoingAmount = outgoing.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    const draftsAmount = drafts.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    const allInvoices = [...incoming, ...outgoing, ...drafts];
    const totalAmount = incomingAmount + outgoingAmount + draftsAmount;

    allInvoices.sort((a, b) => {
      const dateA = new Date(a.issueDate || a.createDate || 0);
      const dateB = new Date(b.issueDate || b.createDate || 0);
      return dateB - dateA;
    });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedInvoices = allInvoices.slice(skip, skip + parseInt(limit));
    const totalPages = Math.ceil(allInvoices.length / parseInt(limit));

    res.status(200).json({
      invoices: paginatedInvoices,
      totalCount: allInvoices.length,
      currentPage: parseInt(page),
      totalPages,
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1,
      summary: {
        incoming: { 
          count: incoming.length, 
          totalAmount: Math.round(incomingAmount * 100) / 100 
        },
        outgoing: { 
          count: outgoing.length, 
          totalAmount: Math.round(outgoingAmount * 100) / 100 
        },
        drafts: { 
          count: drafts.length, 
          totalAmount: Math.round(draftsAmount * 100) / 100 
        },
        total: { 
          count: allInvoices.length, 
          totalAmount: Math.round(totalAmount * 100) / 100 
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

async function searchInvoices(req, res) {
  try {
    const userId = req.userId;
    const { 
      startDate,      
      endDate,        
      minAmount,      
      maxAmount,      
      status,         
      search,         
      invoiceType     
    } = req.query;
    
    const userInvoices = await UserInvoices.findOne({ userId });
    if (!userInvoices) {
      return res.status(200).json({
        invoices: [],
        totalCount: 0,
        summary: {
          count: 0,
          totalAmount: 0
        }
      });
    }

    let allInvoices = [];
    
    if (!status || status === 'all') {
      allInvoices = [
        ...(userInvoices.eFatura.incoming || []).map(inv => ({...inv, type: 'incoming', source: 'efatura'})),
        ...(userInvoices.eFatura.outgoing || []).map(inv => ({...inv, type: 'outgoing', source: 'efatura'})),
        ...(userInvoices.eFatura.incomingDraft || []).map(inv => ({...inv, type: 'draft', source: 'efatura'})),
        ...(userInvoices.eFatura.outgoingDraft || []).map(inv => ({...inv, type: 'draft', source: 'efatura'})),
        ...(userInvoices.eArchive.incoming || []).map(inv => ({...inv, type: 'incoming', source: 'earchive'})),
        ...(userInvoices.eArchive.outgoing || []).map(inv => ({...inv, type: 'outgoing', source: 'earchive'})),
        ...(userInvoices.eArchive.incomingDraft || []).map(inv => ({...inv, type: 'draft', source: 'earchive'})),
        ...(userInvoices.eArchive.outgoingDraft || []).map(inv => ({...inv, type: 'draft', source: 'earchive'}))
      ];
    } else if (status === 'incoming') {
      allInvoices = [
        ...(userInvoices.eFatura.incoming || []).map(inv => ({...inv, type: 'incoming', source: 'efatura'})),
        ...(userInvoices.eArchive.incoming || []).map(inv => ({...inv, type: 'incoming', source: 'earchive'}))
      ];
    } else if (status === 'outgoing') {
      allInvoices = [
        ...(userInvoices.eFatura.outgoing || []).map(inv => ({...inv, type: 'outgoing', source: 'efatura'})),
        ...(userInvoices.eArchive.outgoing || []).map(inv => ({...inv, type: 'outgoing', source: 'earchive'}))
      ];
    } else if (status === 'draft') {
      allInvoices = [
        ...(userInvoices.eFatura.incomingDraft || []).map(inv => ({...inv, type: 'draft', source: 'efatura'})),
        ...(userInvoices.eFatura.outgoingDraft || []).map(inv => ({...inv, type: 'draft', source: 'efatura'})),
        ...(userInvoices.eArchive.incomingDraft || []).map(inv => ({...inv, type: 'draft', source: 'earchive'})),
        ...(userInvoices.eArchive.outgoingDraft || []).map(inv => ({...inv, type: 'draft', source: 'earchive'}))
      ];
    }

    if (invoiceType && invoiceType !== 'all') {
      allInvoices = allInvoices.filter(invoice => invoice.source === invoiceType);
    }

    if (startDate) {
      const start = new Date(startDate);
      allInvoices = allInvoices.filter(invoice => {
        const invoiceDate = new Date(invoice.issueDate || invoice.createDate);
        return invoiceDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      allInvoices = allInvoices.filter(invoice => {
        const invoiceDate = new Date(invoice.issueDate || invoice.createDate);
        return invoiceDate <= end;
      });
    }

    if (minAmount) {
      const min = parseFloat(minAmount);
      allInvoices = allInvoices.filter(invoice => {
        const amount = parseFloat(invoice.payableAmount || 0);
        return amount >= min;
      });
    }

    if (maxAmount) {
      const max = parseFloat(maxAmount);
      allInvoices = allInvoices.filter(invoice => {
        const amount = parseFloat(invoice.payableAmount || 0);
        return amount <= max;
      });
    }

    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      allInvoices = allInvoices.filter(invoice => {
        const documentNumber = (invoice.documentNumber || '').toLowerCase();
        const supplierName = (invoice.accountingSupplierParty?.partyName || '').toLowerCase();
        const customerName = (invoice.accountingCustomerParty?.partyName || '').toLowerCase();
        const supplierTaxNumber = (invoice.accountingSupplierParty?.partyIdentification || '').toLowerCase();
        const customerTaxNumber = (invoice.accountingCustomerParty?.partyIdentification || '').toLowerCase();
        
        return documentNumber.includes(searchTerm) ||
               supplierName.includes(searchTerm) ||
               customerName.includes(searchTerm) ||
               supplierTaxNumber.includes(searchTerm) ||
               customerTaxNumber.includes(searchTerm);
      });
    }

    const totalAmount = allInvoices.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.payableAmount || 0);
      return sum + amount;
    }, 0);

    allInvoices.sort((a, b) => {
      const dateA = new Date(a.issueDate || a.createDate || 0);
      const dateB = new Date(b.issueDate || b.createDate || 0);
      return dateB - dateA;
    });

    res.status(200).json({
      invoices: allInvoices,
      totalCount: allInvoices.length,
      summary: {
        count: allInvoices.length,
        totalAmount: Math.round(totalAmount * 100) / 100
      },
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
        status: status || 'all',
        search: search || null,
        invoiceType: invoiceType || 'all'
      }
    });

  } catch (error) {
    console.error('Fatura arama sırasında hata:', error);
    res.status(500).json({
      error: 'Fatura arama sırasında hata oluştu.',
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
  fetchIncomingInvoices, 
  fetchOutgoingInvoices, 
  fetchDraftInvoices, 
  fetchEArchiveInvoices, 
  fetchEArchiveDraftInvoices, 
  fetchAllInvoices, 
  getInvoices, 
  getInvoice,
  getIncomingInvoices,
  getOutgoingInvoices,
  getDraftInvoices,
  getAllInvoicesFormatted,
  searchInvoices,
  getUserStatistics
}; 