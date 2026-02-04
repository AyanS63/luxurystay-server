import express from 'express';
import { 
  createEvent, 
  getEvents, 
  getEventById, 
  updateEventStatus, 
  deleteEvent, 
  createEventInvoice,
  createEventPaymentIntent,
  confirmEventPayment
} from '../controllers/eventController.js';
import { verifyToken as protect, checkRole } from '../middleware/authMiddleware.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Optional auth middleware for creating inquiries
const optionalAuth = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
           // Invalid token, just proceed as guest
           next();
        }
    } else {
        next();
    }
};

router.post('/', optionalAuth, createEvent);
router.get('/', protect, getEvents); // Authenticated users can view (controller filters by role)
router.get('/:id', protect, getEventById); // Access logic handled in controller
router.put('/:id/status', protect, checkRole(['admin', 'manager', 'receptionist']), updateEventStatus); // Allow staff to update status
router.delete('/:id', protect, checkRole(['admin', 'manager']), deleteEvent); // Only Admin/Manager can delete
router.post('/:id/invoice', protect, checkRole(['admin', 'manager', 'receptionist']), createEventInvoice); // Create invoice

// Payment Routes
router.post('/:id/payment-intent', protect, createEventPaymentIntent);
router.post('/:id/payment-confirm', protect, confirmEventPayment);

export default router;
