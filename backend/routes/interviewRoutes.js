// routes/interviewRoutes.js
import express from 'express';
import {
    generateAndSaveQuestions,
    getFeedback,
    getQuestionsByInterviewId,
    recordUserAnswerText, // New import
} from '../controllers/interviewController.js';
const router = express.Router();

router.post('/generate-questions', generateAndSaveQuestions);
router.get('/questions/:interviewId', getQuestionsByInterviewId);
router.get('/feedback/:interviewId', getFeedback);
router.post('/record-answer-text', recordUserAnswerText); // New route for text-only answers

export default router;