import express from 'express';
import verifyToken from '../middlewares/authMiddleware.js'
import checkUser from '../middlewares/checkUser.js'
import { register, login, updateUser } from '../Controllers/auth.js';
const router = express.Router();



router.post('/register', register);
router.post('/login', login);
router.post('/update', verifyToken, checkUser, updateUser);


export default router;
