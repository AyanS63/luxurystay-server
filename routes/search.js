import express from 'express';
import { searchAll } from '../controllers/searchController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, searchAll);

export default router;
