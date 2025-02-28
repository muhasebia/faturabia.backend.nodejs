import Product from '../models/Product.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

async function createProduct(req, res) {
  try {
      const user = req.user;
      const newProduct = new Product(req.body);
      await newProduct.save();
      user.products.push(newProduct._id);
      await user.save();
      res.status(201).json({ message: "Product created successfully" });
  } catch (error) {
      res.status(500).json({ error: "An error occurred", message: error.message });
  }
}

async function updateProduct(req, res) {
    try {
      const productId = req.params.id;
      const user = req.user;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Geçersiz ürün ID'si" });
      }

      const product = await Product.findById(productId)

      if (!product) {
        return res.status(404).json({ error: 'Ürün bulunamadı' })
      }

      const isProduct = user.products.find(
        (customer) => product._id == productId,
      )

      if (!isProduct) {
        return res.status(404).json({ error: 'Ürün bulunamadı' })
      }

      const productData = {
        ...req.body,
        updatedAt: Date.now(),
      }

      await Product.findByIdAndUpdate(product._id, productData);
      res.status(200).json({ message: 'Ürün başarıyla güncellendi' });
    } catch (error) {
      res.status(500).json({
        error: 'Ürün güncellenirken bir hata oluştu.',
        message: error.message,
      });
    }
}

async function deleteProduct(req, res) {
    try {
      const { productId } = req.params;
      await Product.findByIdAndDelete(productId);
  
      // Ürünü user belgesinin products alanından da sil
      const user = req.user;
      user.products = user.products.filter(id => id.toString() !== productId);
      await user.save();
  
      res.status(200).json({ message: 'Ürün başarıyla silindi.' });
    } catch (error) {
      res.status(500).json({
        error: 'Ürün silinirken bir hata oluştu.',
        message: error.message,
      });
    }
}

async function getProduct(req, res) {
    try {
      const { productId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Geçersiz ürün ID'si" });
      }

      const product = await Product.findById(productId);
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({
        error: 'Ürün getirilirken bir hata oluştu.',
        message: error.message,
      });
    }
}

async function getProducts(req, res) {
  try {
    const user = req.user;
    const count = user.products.length;

    // Sayfa numarası ve sayfa başına ürün sayısını al
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;

    const products = await User.findById(user._id).populate({
      path: 'products',
      options: {
        limit: parseInt(pageSize),
        skip,
        sort: { _id: -1 }  // Ürünleri ID'ye göre ters sıralayarak en son ekleneni başa alır
      },
    });

    const response = {
      data: products.products,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      length: count,
    };

    res.status(200).json(response);
    
  } catch (error) {
    res.status(500).json({
      error: 'Ürünler getirilirken bir hata oluştu.',
      message: error.message,
    });
  }
}


export{      
    createProduct,
    updateProduct,
    getProduct,
    getProducts,
    deleteProduct
}