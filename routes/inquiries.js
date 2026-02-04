import express from 'express';
import { createInquiry, getInquiries, replyToInquiry } from '../controllers/inquiryController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', createInquiry);
router.get('/', verifyToken, checkRole(['admin', 'manager', 'receptionist']), getInquiries);
router.post('/:id/reply', verifyToken, checkRole(['admin', 'manager', 'receptionist']), replyToInquiry);

export default router;
