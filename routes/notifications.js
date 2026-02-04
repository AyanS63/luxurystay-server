import express from 'express';
import { getNotifications, markAsRead, deleteNotification, deleteAllNotifications } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', getNotifications);
router.put('/read', markAsRead);
router.delete('/:id', deleteNotification);
router.delete('/', deleteAllNotifications);

export default router;
