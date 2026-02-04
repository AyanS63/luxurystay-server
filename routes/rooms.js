import express from 'express';
import { getRooms, getRoom, createRoom, updateRoom, deleteRoom } from '../controllers/roomController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public request to see rooms
router.get('/', getRooms);
router.get('/:id', getRoom);

// Protected Routes (Admin/Manager)
router.post('/', verifyToken, checkRole(['admin', 'manager']), createRoom);
router.put('/:id', verifyToken, checkRole(['admin', 'manager', 'receptionist']), updateRoom); // Receptionist can update status
router.delete('/:id', verifyToken, checkRole(['admin', 'manager']), deleteRoom);

export default router;
