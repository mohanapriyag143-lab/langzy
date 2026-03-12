const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    lessonId: {
        type: String,
        required: true,
        unique: true
    },
    language: {
        type: String,
        required: true
    },
    courseId: {
        type: String,
        required: true
    },
    courseName: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    order: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },

    // Content
    vocabulary: [{
        word: String,
        translation: String,
        pronunciation: String,
        example: String
    }],

    grammar: {
        topic: String,
        explanation: String,
        examples: [String]
    },

    // Quizzes - Multiple types
    quizzes: [{
        type: {
            type: String,
            enum: ['multiple_choice', 'fill_blank', 'speaking', 'listening', 'match_pairs', 'sentence_building'],
            required: true
        },
        question: String,
        correctAnswer: String,
        options: [String], // For multiple choice and match pairs
        audioUrl: String, // For listening exercises
        hint: String
    }],

    // Rewards
    xpReward: {
        type: Number,
        default: 10
    },

    // Unlock requirements
    requiredLessons: [{
        type: String
    }]
}, {
    timestamps: true
});

// Index for faster queries
lessonSchema.index({ language: 1, courseId: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
