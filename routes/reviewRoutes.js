import express from 'express';
import { createReview, getRoomReviews, updateReview, deleteReview } from '../controllers/reviewController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to read reviews
router.get('/room/:roomId', getRoomReviews);

// Protected route to write reviews
router.post('/', verifyToken, createReview);
router.put('/:id', verifyToken, updateReview);
router.delete('/:id', verifyToken, deleteReview);

export default router;
