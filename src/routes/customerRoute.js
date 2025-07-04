import express from 'express';
import verifyToken from '../middlewares/authMiddleware.js'
import checkUser from '../middlewares/checkUser.js'
import {createCustomer, updateCustomer, getCustomer, getCustomers, deleteCustomer, getCustomerInvoices, getCustomerCount } from '../controllers/customers.js';

const router = express.Router();

router.post('/', verifyToken, checkUser, createCustomer);
router.get('/', verifyToken, checkUser, getCustomers);
router.get('/count', verifyToken, checkUser, getCustomerCount);
router.get('/:id', verifyToken, checkUser, getCustomer);
router.patch('/updateCustomer/:id', verifyToken, checkUser, updateCustomer);
router.delete('/deleteCustomer/:id', verifyToken, checkUser, deleteCustomer);

// Müşterinin faturalarını getir
router.get('/:customerId/invoices', verifyToken, getCustomerInvoices);

export default router;
