// controllers/interviewController.js - (No significant changes needed for interviewPreferences handling)
import { model, generationConfig, safetySetting } from '../config/geminiConfig.js';
import Question from '../models/interviewModel.js';
import { v4 as uuidv4 } from 'uuid';
import UserAnswer from '../models/UserAnswer.js';
export const generateAndSaveQuestions = async (req, res) => {
    const { language, experience, role, jobDescription, selectedRound, difficulty, duration, interviewId } = req.body;

    // --- Basic Validation ---
    // (Keep your existing validation as it correctly checks for required fields based on your app's logic)
    // if (!language && !role) {
    //     return res.status(400).json({ message: "Language/Technology or Job Role is required." });
    // }
    // if (!experience) {
    //     return res.status(400).json({ message: "Experience is required." });
    // }
    // if (!selectedRound) {
    //     return res.status(400).json({ message: "Interview round is required." });
    // }
    // if (!difficulty) {
    //     return res.status(400).json({ message: "Difficulty level is required." });
    // }
    // if (!duration) {
    //     return res.status(400).json({ message: "Interview duration is required." });
    // }

    console.log("language" + language, experience, role, "jd", jobDescription, selectedRound, difficulty, duration, interviewId)
    // --- Determine Number of Questions ---
    const durationMinutes = parseInt(duration.split(' ')[0]);
    let numQuestions;

    switch (durationMinutes) {
        case 5:
            numQuestions = 3;
            break;
        case 15:
            numQuestions = 7;
            break;
        case 30:
            numQuestions = 12;
            break;
        default:
            numQuestions = 5;
            break;
    }

    if (jobDescription) {
        var prompt = `Job Position : ${role}, Job description :${jobDescription}, years of exprience  ${experience}, Depends on this information  please give me ${numQuestions} interview  question with Anserd in json fromate, Given Question and Answerd  as field in json 
    .`;
    } else {

        var prompt = `Job Position : ${language}, years of exprience  ${experience}, Depends on this information  please give me ${numQuestions} interview  question with Anserd in json fromate, Given Question and Answerd  as field in json 
    .`;
    }



    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig,
            safetySettings: safetySetting,
        });

        const generatedText = result.response.text();

        let parsedQuestions;
        try {
            const jsonString = generatedText.replace(/```json\n|```/g, '').trim();
            parsedQuestions = JSON.parse(jsonString);

            // Safety net: Map keys to lowercase if Gemini still returns capitalized ones
            parsedQuestions = parsedQuestions.map(item => {
                const newItem = {};
                newItem.question = item.question || item.Question;
                newItem.answer = item.answer || item.Answer;

                if (newItem.question === undefined || newItem.answer === undefined) {
                    throw new Error('Missing "question" or "answer" field after key mapping.');
                }
                return newItem;
            });

            // Basic validation
            if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0 || !parsedQuestions.every(q => typeof q.question === 'string' && typeof q.answer === 'string')) {
                throw new Error('Parsed JSON is not in the expected array of objects format with "question" and "answer" string fields.');
            }

        } catch (parseError) {
            console.error('Error parsing or validating Gemini response JSON:', parseError);
            console.error('Raw Gemini Response:', generatedText);
            return res.status(500).json({
                message: 'Failed to process generated questions. Gemini did not return expected JSON format or content.',
                error: parseError.message,
                rawResponse: generatedText
            });
        }

        const finalInterviewId = interviewId || uuidv4();

        // --- Store the generated questions and preferences in the database ---
        const newQuestionEntry = await Question.create({
            interviewId: finalInterviewId,
            promptUsed: prompt,
            generatedQuestions: parsedQuestions,
            // Pass the destructured preferences object directly. Mongoose will validate it.
            interviewPreferences: {
                language,
                experience,
                role,
                jobDescription,
                selectedRound,
                difficulty,
                duration
            },
        });

        res.status(201).json({
            message: 'Questions generated and saved successfully!',
            interviewId: finalInterviewId,
            generatedQuestions: parsedQuestions,
            dbId: newQuestionEntry._id,
        });

    } catch (error) {
        console.error('Error in generateAndSaveQuestions:', error);
        res.status(500).json({
            message: 'Failed to generate or save questions due to an internal server error.',
            error: error.message,
        });
    }
};
// You might add other controllers here, e.g., to fetch questions by interviewId
// export const getQuestionsByInterviewId = async (req, res) => { /* ... */ };


export const getQuestionsByInterviewId = async (req, res) => {
    try {
        const { interviewId } = req.params;
        const interviewData = await Question.findOne({ interviewId });

        if (!interviewData) {
            return res.status(404).json({ message: 'Interview not found.' });
        }

        // --- IMPORTANT: generatedQuestions is now an array of objects directly from DB ---
        // No need for JSON.parse if your schema is correctly defined as [ { question: String, answer: String } ]
        const questions = interviewData.generatedQuestions;

        // You might want to remove the 'answer' field if you don't want to expose it to the frontend
        // during the actual interview practice. This depends on your practice flow.
        // For example:
        const questionsForFrontend = questions.map(q => ({ question: q.question }));


        res.status(200).json({
            message: 'Questions fetched successfully',
            interviewPreferences: interviewData.interviewPreferences,
            questions: questionsForFrontend, // Send questions without the answers
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Failed to fetch questions.', error: error.message });
    }
};

export const recordUserAnswerText = async (req, res) => {
    const { interviewId, questionText, transcript } = req.body;
    console.log("Received request to record audio answer!");
    if (!interviewId || !questionText || !transcript) {
        return res.status(400).json({ message: 'Missing interview ID, question text, or transcript.' });
    }

    try {
        // --- 1. Get Feedback & Rating from Gemini ---
        const feedbackPrompt = `As an interview expert, analyze the following user answer to the question "${questionText}".
        User's transcribed answer: "${transcript}".

        Provide constructive feedback on the answer's content, clarity, relevance, and communication.
        Also, give a rating for the answer on a scale of "Poor", "Fair", "Good", "Very Good", "Excellent".

        Format your response as a JSON object with 'feedback' and 'rating' fields.
        Example:
        {
          "feedback": "The candidate provided a relevant example, but could elaborate more on the impact. The explanation was clear but lacked depth in technical specifics.",
          "rating": "Good"
        }
        `;

        const geminiFeedbackResult = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: feedbackPrompt }] }],
            generationConfig: {
                ...generationConfig,
                responseMimeType: 'application/json' // Request JSON output for feedback
            },
            safetySettings: safetySetting,
        });

        let geminiResponseText = geminiFeedbackResult.response.text();
        let feedbackData;
        try {
            // Trim and parse, similar to how you handle main questions
            const jsonString = geminiResponseText.replace(/```json\n|```/g, '').trim();
            feedbackData = JSON.parse(jsonString);
            // Basic validation for feedbackData structure
            if (typeof feedbackData.feedback !== 'string' || typeof feedbackData.rating !== 'string') {
                throw new Error('Gemini feedback JSON is not in expected format (feedback and rating strings).');
            }
        } catch (parseError) {
            console.error("Failed to parse Gemini feedback JSON:", parseError);
            feedbackData = {
                feedback: "Could not parse AI feedback. Raw response: " + geminiResponseText,
                rating: "N/A"
            };
        }

        const { feedback, rating } = feedbackData;

        // --- 2. Store User Answer in Database ---
        const newUserAnswer = await UserAnswer.create({
            interviewId,
            questionText,
            // Ensure audioPath is optional or removed from UserAnswer schema if not using
            audioPath: null, // Set to null as we're focusing on text transcript here
            transcript,
            feedback,
            rating,
        });

        res.status(201).json({
            message: 'Answer evaluated and saved successfully!',
            userAnswer: newUserAnswer,
        });

    } catch (error) {
        console.error('Error processing user text answer:', error);
        res.status(500).json({ message: 'Failed to process user answer.', error: error.message });
    }
};


export const getFeedback = async (req, res) => {


    try {
        const { interviewId } = req.params;
        // Find all answers related to this interview ID
        const feedback = await UserAnswer.find({ interviewId: interviewId }).sort({ answeredAt: 1 });

        if (!feedback || feedback.length === 0) {
            return res.status(404).json({ message: 'No feedback found for this interview ID.' });
        } 

        res.status(200).json(feedback);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ message: 'Server error while fetching feedback.', error: error.message });
    }
}