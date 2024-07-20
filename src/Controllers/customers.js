import Customer from "../Models/Customer.js";
import User from "../Models/User.js";
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
    const count = user.customers.length;

    const { page = 1, pageSize = count } = req.query;
    const skip = (page - 1) * pageSize;

    const customers = await User.findById(user._id).populate({
      path: "customers",
      options: {
        limit: parseInt(pageSize),
        skip: parseInt(skip),
      },
    });

    const response = {
      data: customers.customers,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      length: count,
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      error: "Müşteriler getirilirken bir hata oluştu.",
      message: error.message,
    });
  }
}

async function getCustomer(req, res) {
    try {
      const customerId = req.params.id;
      const user = req.user;
  
      // customerId'nin geçerli bir ObjectId olup olmadığını kontrol et
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({ message: "Geçersiz müşteri ID'si" });
      }
  
      const customer = await Customer.findOne({ _id: customerId });
  
      if (!customer) {
        return res.status(404).json({ message: "Müşteri bulunamadı" });
      }
  
      // userın customers listesinde müşteri var mı diye kontrol et
      const isCustomer = user.customers.some(
        (customer) => customer._id.toString() === customerId
      );
  
      if (!isCustomer) {
        // Müşteri bulunamadı veya kullanıcıya ait değil
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
        // Müşteri bulunamadı veya kullanıcıya ait değil
        return res.status(404).json({ error: 'Müşteri bulunamadı' })
      }
  
      // Müşteri bilgilerini güncelle
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
      // Müşteri bulunamadı veya kullanıcıya ait değil
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


export { createCustomer, getCustomers, getCustomer, updateCustomer, deleteCustomer };


//that was quiet