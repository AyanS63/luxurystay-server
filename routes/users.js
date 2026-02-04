import express from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';

const router = express.Router();

// Ideally, we should add middleware to check if the requester is an admin
// For now, we'll keep it open or assume the client handles basic protection
// TODO: Add authMiddleware and checkRole('admin')

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
