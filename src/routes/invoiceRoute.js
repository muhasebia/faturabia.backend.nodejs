import express from 'express';
import verifyToken from '../middlewares/authMiddleware.js';
import checkUser from '../middlewares/checkUser.js';
import { fetchAllInvoices, getIncomingInvoicesForStats, getOutgoingInvoicesForStats, getAllInvoicesForStats, getUserStatistics } from '../controllers/invoice.js';

const router = express.Router();

// TÜM FATURALARI TEK SEFERDE ÇEK - İstatistik hesaplama için
router.post('/fetch-all', verifyToken, checkUser, fetchAllInvoices);

// Gelen faturaları getir - İstatistik için
router.get('/incoming', verifyToken, checkUser, getIncomingInvoicesForStats);

// Giden faturaları getir - İstatistik için  
router.get('/outgoing', verifyToken, checkUser, getOutgoingInvoicesForStats);

// Tüm faturaları getir (gelen + giden) - Tarihsel sıralı
router.get('/all', verifyToken, checkUser, getAllInvoicesForStats);

// İstatistikler - Toplam tutar, gelen/giden tutarlar ve kar/zarar
router.get('/statistics', verifyToken, checkUser, getUserStatistics);

export default router; 