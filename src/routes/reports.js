import express from 'express';
import { getReportsData } from '../controllers/reports.js';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

// Reports data endpoint
router.get('/data', verifyToken, getReportsData);

export default router; 