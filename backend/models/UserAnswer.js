// models/UserAnswer.js (updated - make audioPath optional)
import mongoose from 'mongoose';

const userAnswerSchema = mongoose.Schema(
    {
        interviewId: {
            type: String,
            required: true,
            ref: 'Question',
        },
        questionId: {
            type: String,
            required: false, // Make optional if you don't use it consistently
        },
        questionText: {
            type: String,
            required: true,
        },
        audioPath: { // Now optional if you're only storing text
            type: String,
            required: false, // Changed from true to false
        },
        transcript: {
            type: String,
            required: true,
        },
        feedback: {
            type: String,
            required: true,
        },
        rating: {
            type: String,
            required: true,
        },
        answeredAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const UserAnswer = mongoose.model('UserAnswer', userAnswerSchema);

export default UserAnswer;