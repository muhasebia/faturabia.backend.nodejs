import express from 'express';
import verifyToken from '../middlewares/authMiddleware.js';
import checkUser from '../middlewares/checkUser.js';
import { fetchIncomingInvoices, fetchOutgoingInvoices, fetchDraftInvoices, fetchEArchiveInvoices, fetchEArchiveDraftInvoices, fetchAllInvoices, getInvoices, getInvoice, getIncomingInvoices, getOutgoingInvoices, getDraftInvoices, getAllInvoicesFormatted, searchInvoices, getUserStatistics } from '../controllers/invoice.js';

const router = express.Router();

// TÜM FATURALARI TEK SEFERDE ÇEK - Kullanıcı kayıt olduğunda kullan
router.post('/fetch-all', verifyToken, checkUser, fetchAllInvoices);

// Gelen faturaları Nesten API'sinden çek ve kaydet
router.post('/fetch-incoming', verifyToken, checkUser, fetchIncomingInvoices);

// Giden faturaları Nesten API'sinden çek ve kaydet
router.post('/fetch-outgoing', verifyToken, checkUser, fetchOutgoingInvoices);

// Taslak faturaları Nesten API'sinden çek ve kaydet
router.post('/fetch-drafts', verifyToken, checkUser, fetchDraftInvoices);

// e-Arşiv faturaları Nesten API'sinden çek ve kaydet
router.post('/fetch-earchive', verifyToken, checkUser, fetchEArchiveInvoices);

// e-Arşiv taslak faturaları Nesten API'sinden çek ve kaydet
router.post('/fetch-earchive-drafts', verifyToken, checkUser, fetchEArchiveDraftInvoices);

// Kaydedilmiş faturaları listele 
// ?type=incoming|outgoing|incomingDraft|outgoingDraft
// ?category=eFatura|eArchive
router.get('/', verifyToken, checkUser, getInvoices);

// YENİ API'LER - Fatura türlerine göre listeleme
// Gelen faturaları getir (e-Fatura + e-Arşiv)
router.get('/list/incoming', verifyToken, checkUser, getIncomingInvoices);

// Giden faturaları getir (e-Fatura + e-Arşiv)
router.get('/list/outgoing', verifyToken, checkUser, getOutgoingInvoices);

// Tüm taslakları getir (e-Fatura + e-Arşiv)
router.get('/list/drafts', verifyToken, checkUser, getDraftInvoices);

// Tüm faturaları getir (hepsi bir arada)
router.get('/list/all', verifyToken, checkUser, getAllInvoicesFormatted);

// İstatistikler - Toplam tutar, gelen/giden tutarlar ve kar/zarar
router.get('/statistics', verifyToken, checkUser, getUserStatistics);

// Fatura arama ve filtreleme (pagination yok, tüm sonuçlar)
router.get('/search', verifyToken, checkUser, searchInvoices);

// Belirli bir faturayı UUID ile getir (bu route en sonda olmalı)
router.get('/:uuid', verifyToken, checkUser, getInvoice);

export default router; 