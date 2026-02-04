import express from 'express';
import { createBill, getBillByBooking, addItemToBill, processPayment, getAllBills } from '../controllers/billingController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', checkRole(['admin', 'manager', 'receptionist']), createBill);
router.get('/', getAllBills);
router.get('/booking/:bookingId', getBillByBooking);
router.post('/:id/items', checkRole(['admin', 'manager', 'receptionist']), addItemToBill);
router.post('/:id/pay', checkRole(['admin', 'manager', 'receptionist']), processPayment);

export default router;
