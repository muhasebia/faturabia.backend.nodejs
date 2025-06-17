import express from 'express';
import { getDashboardData, getApiStatus } from '../controllers/dashboard.js';
import verifyToken from '../middlewares/authMiddleware.js';

const router = express.Router();

// Dashboard data endpoint
router.get('/data', verifyToken, getDashboardData);

// API status endpoint
router.get('/api-status', verifyToken, getApiStatus);

export default router; 