import Invoice from '../models/Invoice.js';
import mongoose from 'mongoose';
import User from '../models/User.js';

async function createInvoice(req, res) {
  try {
    const user = req.user;
    
    const invoiceData = req.body;
    const newInvoice = new Invoice(invoiceData);
    await newInvoice.save();

    user.invoices.push(newInvoice);
    await user.save();

    res.status(201).json({ message: "Fatura başarıyla oluşturuldu" });
  } catch (error) {
    res.status(500).json({ error: "An error occurred", message: error.message });
  }
}

async function getInvoice(req, res) {
    try {
      const { invoiceId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
        return res.status(400).json({ message: "Geçersiz fatura ID'si" });
      }

      const invoice = await Invoice.findById(invoiceId);
      res.status(200).json(invoice);
    } catch (error) {
      res.status(500).json({
        error: 'fatura getirilirken bir hata oluştu.',
        message: error.message,
      });
    }
}

async function getInvoices(req, res) {
    try {
      const user = req.user;
      const count = user.invoices.length;
  
      // Sayfa numarası ve sayfa başına ürün sayısını al
      const { page = 1, pageSize = 10 } = req.query;
      const skip = (page - 1) * pageSize;
  
      const invoices = await User.findById(user._id).populate({
        path: 'invoices',
        options: {
          limit: parseInt(pageSize),
          skip,
          sort: { _id: -1 }  // Ürünleri ID'ye göre ters sıralayarak en son ekleneni başa alır
        },
      });
  
      const response = {
        data: invoices.invoices,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        length: count,
      };
  
      res.status(200).json(response);
      
    } catch (error) {
      res.status(500).json({
        error: 'faturalar getirilirken bir hata oluştu.',
        message: error.message,
      });
    }
  }

  export { createInvoice, getInvoice, getInvoices };