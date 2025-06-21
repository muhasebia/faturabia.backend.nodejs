import Customer from "../models/Customer.js";
import User from "../models/User.js";
import UserInvoices from "../models/UserInvoices.js";
import mongoose from "mongoose";



async function createCustomer(req, res) {
  try {
    const user = req.user;

    const customerData = req.body;
    const newCustomer = new Customer(customerData);
    await newCustomer.save();

    user.customers.push(newCustomer);
    await user.save();

    res.status(201).json({ message: "Customer created successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred", message: error.message });
  }
}

async function getCustomers(req, res) {
  try {
    const user = req.user;
    const totalCustomers = user.customers.length;

    // Query parametrelerini al ve default değerler ata
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Pagination hesaplamaları
    const currentPage = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (currentPage - 1) * pageLimit;

    // MongoDB aggregation pipeline oluştur
    let matchStage = {
      _id: { $in: user.customers }
    };

    // Arama filtresi ekle
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      matchStage.$or = [
        { name: searchRegex },
        { surname: searchRegex },
        { title: searchRegex },
        { partyName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { TcNumber: searchRegex },
        { partyIdentification: searchRegex },
        { city: searchRegex },
        { town: searchRegex }
      ];
    }

    // Sıralama objesi oluştur
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Müşterileri getir
    const customers = await Customer.find(matchStage)
      .sort(sortObj)
      .skip(skip)
      .limit(pageLimit)
      .exec();

    // Filtrelenmiş toplam sayıyı hesapla
    const filteredTotal = await Customer.countDocuments(matchStage);

    // Pagination bilgilerini hesapla
    const totalPages = Math.ceil(filteredTotal / pageLimit);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    const response = {
      success: true,
      data: customers,
      pagination: {
        currentPage,
        totalPages,
        pageLimit,
        totalItems: filteredTotal,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? currentPage + 1 : null,
        prevPage: hasPrevPage ? currentPage - 1 : null
      },
      filters: {
        search: search || null,
        sortBy,
        sortOrder
      },
      summary: {
        totalCustomersInAccount: totalCustomers,
        filteredResults: filteredTotal,
        showingResults: customers.length
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Müşteriler getirilirken hata:', error);
    res.status(500).json({
      success: false,
      error: "Müşteriler getirilirken bir hata oluştu.",
      message: error.message,
    });
  }
}

async function getCustomer(req, res) {
    try {
      const customerId = req.params.id;
      const user = req.user;
  
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({ message: "Geçersiz müşteri ID'si" });
      }
  
      const customer = await Customer.findOne({ _id: customerId });
  
      if (!customer) {
        return res.status(404).json({ message: "Müşteri bulunamadı" });
      }
  
      const isCustomer = user.customers.some(
        (customer) => customer._id.toString() === customerId
      );
  
      if (!isCustomer) {
        return res.status(404).json({ message: "Müşteri bulunamadı." });
      }
  
      res.status(200).json(customer);
    } catch (error) {
      res.status(500).json({
        error: "Müşteri getirilirken bir hata oluştu.",
        message: error.message,
      });
    }
  }
  

async function updateCustomer(req, res) {
    try {
      const customerId = req.params.id
      const user = req.user
     
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({ message: "Geçersiz müşteri ID'si" });
      }
      const customer = await Customer.findById(customerId)
  
      if (!customer) {
        return res.status(404).json({ error: 'Müşteri bulunamadı' })
      }
  
      const isCustomer = user.customers.find(
        (customer) => customer._id == customerId,
      )
  
      if (!isCustomer) {
        return res.status(404).json({ error: 'Müşteri bulunamadı' })
      }
  
      const customerData = {
        ...req.body,
        updatedAt: Date.now(),
      }
  
      await Customer.findByIdAndUpdate(customer._id, customerData)
  
      res.status(200).json({ message: 'Müşteri başarıyla güncellendi' })
    } catch (error) {
      res.status(500).json({
        error: 'Müşteri güncellenirken bir hata oluştu.',
        message: error.message,
      })
    }
  }

async function deleteCustomer(req, res) {

  try{
    const customerId = req.params.id;
    const user = req.user;

    const customer = await Customer.findById(customerId);

    if(!customer){
      return res.status(404).json({ message: "Müşteri bulunamadı." });
    }

    const isCustomer = user.customers.find(
      (customer) => customer._id == customerId,
    )

    if (!isCustomer) {
      return res.status(404).json({ error: 'Müşteri bulunamadı' })
    }

    await Customer.findByIdAndDelete(customer._id);
    user.customers = user.customers.filter(
      (customerId) => customerId.toString() !== customer._id.toString()
    )

    await user.save();

    res.status(200).json({ message: "Müşteri başarıyla silindi" }); 

  } catch(error) {
    res.status(500).json({
      error: 'Müşteri silinirken bir hata oluştu.',
      message: error.message,
    })
  
  }

}

async function getCustomerInvoices(req, res) {
  try {
    const { customerId } = req.params;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    const customer = await Customer.findOne({
      _id: customerId,
      _id: { $in: user.customers }
    });
    if (!customer) {
      return res.status(404).json({ message: "Müşteri bulunamadı" });
    }

    const userInvoices = await UserInvoices.findOne({ userId });
    if (!userInvoices) {
      return res.status(200).json({
        invoices: [],
        customer: customer
      });
    }

    const allInvoices = [
      ...(userInvoices.eFatura.incoming || []),
      ...(userInvoices.eFatura.outgoing || []),
      ...(userInvoices.eArchive.incoming || []),
      ...(userInvoices.eArchive.outgoing || [])
    ];

    const customerInvoices = allInvoices.filter(invoice => {
      let partyId = null;
      
      if (invoice.accountingSupplierParty?.party) {
        partyId = invoice.accountingSupplierParty.party.partyIdentification?.[0]?.id;
      }
      else if (invoice.accountingCustomerParty) {
        partyId = invoice.accountingCustomerParty.partyIdentification;
      }
      
      return partyId === customer.partyIdentification;
    });

    customerInvoices.sort((a, b) => {
      const dateA = new Date(a.issueDate || a.createDate || 0);
      const dateB = new Date(b.issueDate || b.createDate || 0);
      return dateB - dateA;
    });

    res.status(200).json({
      invoices: customerInvoices,
      customer: customer
    });

  } catch (error) {
    res.status(500).json({
      error: 'Müşteri faturaları getirilirken hata oluştu.',
      message: error.message,
    });
  }
}

async function getCustomerCount(req, res) {
  try {
    const user = req.user;
    
    // Toplam müşteri sayısı
    const totalCustomers = user.customers.length;
    
    // Arama parametresi varsa filtrelenmiş sayıyı da hesapla
    const { search = '' } = req.query;
    
    let filteredCount = totalCustomers;
    
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchStage = {
        _id: { $in: user.customers },
        $or: [
          { name: searchRegex },
          { surname: searchRegex },
          { title: searchRegex },
          { partyName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { TcNumber: searchRegex },
          { partyIdentification: searchRegex },
          { city: searchRegex },
          { town: searchRegex }
        ]
      };
      
      filteredCount = await Customer.countDocuments(matchStage);
    }

    // Favori müşteri sayısı
    const favoriteCount = await Customer.countDocuments({
      _id: { $in: user.customers },
      isFavorite: true
    });

    // Faturadan gelen müşteri sayısı
    const fromInvoiceCount = await Customer.countDocuments({
      _id: { $in: user.customers },
      isFromInvoice: true
    });

    // Manuel eklenen müşteri sayısı
    const manuallyAddedCount = totalCustomers - fromInvoiceCount;

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        filteredCount: search ? filteredCount : null,
        favoriteCustomers: favoriteCount,
        fromInvoiceCustomers: fromInvoiceCount,
        manuallyAddedCustomers: manuallyAddedCount
      },
      filters: {
        search: search || null
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Müşteri sayısı getirilirken hata:', error);
    res.status(500).json({
      success: false,
      error: "Müşteri sayısı getirilirken bir hata oluştu.",
      message: error.message,
    });
  }
}

export { createCustomer, getCustomers, getCustomer, updateCustomer, deleteCustomer, getCustomerInvoices, getCustomerCount };