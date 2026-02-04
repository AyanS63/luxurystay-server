import express from 'express';
import { createTask, getTasks, updateTask, deleteCompletedTasks, deleteTask } from '../controllers/taskController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', checkRole(['admin', 'manager', 'receptionist', 'housekeeping', 'guest', 'hotel_staff']), createTask);
router.get('/', checkRole(['admin', 'manager', 'receptionist', 'housekeeping', 'hotel_staff']), getTasks);
router.put('/:id', checkRole(['admin', 'manager', 'housekeeping', 'receptionist', 'hotel_staff']), updateTask);
router.delete('/completed', checkRole(['admin', 'manager', 'receptionist']), deleteCompletedTasks);
router.delete('/:id', checkRole(['admin', 'manager', 'receptionist']), deleteTask);

export default router;
