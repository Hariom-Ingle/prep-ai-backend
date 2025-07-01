// Starting with the entry point: server.js
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import userRoutes from './routes/userRoutes.js';


// Load environment variables from .env
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware to parse JSON
app.use(express.json());
// 👇 Middleware to parse cookies
app.use(cookieParser()); 
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend origin
  credentials: true,              // ⬅️ Required for cookies
}));


// Routes
app.use('/api/auth', authRoutes);
// app.use('/api/user', userRoutes);
app.use('/api/users',userRoutes)
app.use('/api/interview', interviewRoutes);


// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 