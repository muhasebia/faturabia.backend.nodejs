import express from 'express';
import verifyToken from '../middlewares/authMiddleware.js'
import checkUser from '../middlewares/checkUser.js'
import { register, login, updateUser, updateNESApiKey, getUser } from '../controllers/auth.js';
const router = express.Router();



router.post('/register', register);
router.post('/login', login);
router.get('/getUser', verifyToken, checkUser, getUser);
router.post('/update', verifyToken, checkUser, updateUser);
router.put('/updateNesApiKey', verifyToken, checkUser, updateNESApiKey);


export default router;