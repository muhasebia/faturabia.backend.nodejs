import express from 'express';
import verifyToken from '../middlewares/authMiddleware.js'
import checkUser from '../middlewares/checkUser.js'
import { register, login, updateUser, updateNESApiKey, getUser, forgotPassword, resetPassword, validateResetToken, changePassword } from '../controllers/auth.js';
const router = express.Router();



router.post('/register', register);
router.post('/login', login);
router.get('/getUser', verifyToken, checkUser, getUser);
router.post('/update', verifyToken, checkUser, updateUser);
router.post('/change-password', verifyToken, checkUser, changePassword);
router.put('/updateNesApiKey', verifyToken, checkUser, updateNESApiKey);

// Şifre sıfırlama route'ları
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/validate-reset-token/:token', validateResetToken);

export default router;