// routes/userRoutes.js

import express from 'express';
import { getUsers, isAuthticated, loginUser, logout, registerUser, resetPassword, sendResetPasswordOTP,   sendVerifyOtp, verifyEmail, verifyResetOTP } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/logout', logout);
router.post('/send-verify-otp',protect,sendVerifyOtp );
router.post('/verify-account',protect,verifyEmail );
router.post('/is-auth',protect,isAuthticated );
router.post('/send-reset-otp',sendResetPasswordOTP);
router.post('/verify-reset-otp',verifyResetOTP );
router.post('/reset-password',resetPassword );
router.get('/', protect, getUsers); // Optional: get all users (e.g., admin use)

export default router;
   