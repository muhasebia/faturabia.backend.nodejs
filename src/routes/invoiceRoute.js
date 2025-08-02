import express from 'express';
import verifyToken from '../middlewares/authMiddleware.js';
import checkUser from '../middlewares/checkUser.js';
import { fetchAllInvoices, getAllInvoicesLive, getIncomingInvoicesLive, getOutgoingInvoicesLive, getUserStatistics } from '../controllers/invoice.js';

const router = express.Router();

// TÜM FATURALARI ÇEK VE İSTATİSTİK HESAPLA - Sadece istatistik hesaplama için
router.post('/fetch-all', verifyToken, checkUser, fetchAllInvoices);

// Gelen faturaları canlı olarak getir
router.get('/incoming', verifyToken, checkUser, getIncomingInvoicesLive);

// Giden faturaları canlı olarak getir
router.get('/outgoing', verifyToken, checkUser, getOutgoingInvoicesLive);

// Tüm faturaları canlı olarak getir (gelen + giden) - Tarihsel sıralı
router.get('/all', verifyToken, checkUser, getAllInvoicesLive);

// İstatistikler - Hesaplanmış istatistikleri getir
router.get('/statistics', verifyToken, checkUser, getUserStatistics);

export default router; 