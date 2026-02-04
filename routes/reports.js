import express from 'express';
import { getDashboardStats } from '../controllers/reportController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.use(checkRole(['admin', 'manager']));

router.get('/dashboard', getDashboardStats);

export default router;
