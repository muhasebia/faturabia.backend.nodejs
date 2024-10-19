import express from 'express';
import verifyToken from '../middlewares/authMiddleware.js'
import checkUser from '../middlewares/checkUser.js'
import {createProduct, updateProduct, getProduct, getProducts, deleteProduct } from '../controllers/product.js';

const router = express.Router();

router.post('/', verifyToken, checkUser, createProduct);
router.get('/', verifyToken, checkUser, getProducts);
router.get('/:productId', verifyToken, checkUser, getProduct);
router.patch('/:id', verifyToken, checkUser, updateProduct);
router.delete('/:productId', verifyToken, checkUser, deleteProduct)

export default router