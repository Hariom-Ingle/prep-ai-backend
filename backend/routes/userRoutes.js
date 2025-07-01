import express from 'express';
import { getUserData } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected route to get user data
router.get('/data', protect, getUserData);

export default router;
