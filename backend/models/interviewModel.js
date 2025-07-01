// import mongoose from "mongoose";

// const responseSchema = new mongoose.Schema({
//   question: { type: String, required: true },
//   userAnswer: { type: String, required: true },
//   correctAnswer: { type: String, required: true },
// });

// const interviewSchema = new mongoose.Schema(
//   {
//     role: { type: String, required: true },
//     experience: { type: String, required: true },
//     jobdesc: { type: String, required: true },
//     duration: { type: String, required: true },
    
//     mockresponse: {
//       type: [responseSchema],
//       required: true,
//     },

//     score: {
//       type: Number,
//       default: 0,
//     },

//     feedback: {
//       type: String,
//     },

//     // 👤 User who created the interview
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User", // replace with your actual User model name
//       required: true,
//     },

//     // 🆔 Unique Mock ID
//     mockId: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//   },
//   {
//     timestamps: true, // adds createdAt and updatedAt automatically
//   }
// );

// export default mongoose.model("Interview", interviewSchema);



// models/Question.js
// interviewModel.js - UPDATED SCHEMA for interviewPreferences
import mongoose from 'mongoose';

const questionSchema = mongoose.Schema(
    {
        interviewId: { // To group questions by an interview session
            type: String,
            required: true,
            unique: true, // Each interview should have a unique ID for its questions
        },
        promptUsed: { // The prompt sent to Gemini
            type: String,
            required: true,
        },
        generatedQuestions: [ // This indicates an array of question/answer objects
            {
                question: { type: String, required: true },
                answer: { type: String, required: true }
            }
        ],
        // *** IMPORTANT CHANGE HERE: Specific schema for interviewPreferences ***
        interviewPreferences: {
            language: { type: String }, // Make optional if it's only for 'general' mode
            experience: { type: String, required: true },
            role: { type: String }, // Make optional if it's only for 'general' mode
            jobDescription: { type: String }, // Make optional, only for 'specific' mode
            selectedRound: { type: String, required: true },
            difficulty: { type: String, required: true },
            duration: { type: String, required: true },
        },
        // **********************************************************************
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields
    }
);

const Question = mongoose.model('Question', questionSchema);

export default Question;