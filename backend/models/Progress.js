const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    language: {
        type: String,
        required: true
    },

    // Course progress
    coursesCompleted: [{
        courseId: String,
        completedAt: Date
    }],
    lessonsCompleted: [{
        lessonId: String,
        courseId: String,
        score: Number,
        completedAt: Date
    }],
    unlockedLessons: [{
        type: String
    }],

    // Vocabulary
    vocabularyMastered: {
        type: Number,
        default: 0
    },
    vocabularyList: [{
        word: String,
        translation: String,
        strength: {
            type: String,
            enum: ['gold', 'faded', 'broken'],
            default: 'gold'
        },
        lastReviewed: Date,
        nextReview: Date,
        reviewCount: {
            type: Number,
            default: 0
        }
    }],

    // Quiz statistics
    totalQuizzes: {
        type: Number,
        default: 0
    },
    correctAnswers: {
        type: Number,
        default: 0
    },
    accuracy: {
        type: Number,
        default: 0
    },

    // XP tracking
    totalXP: {
        type: Number,
        default: 0
    },
    dailyXP: [{
        date: Date,
        xp: Number
    }],

    // Skill strength
    skillStrength: {
        reading: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        writing: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        listening: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        speaking: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    }
}, {
    timestamps: true
});

// Calculate accuracy
progressSchema.methods.calculateAccuracy = function () {
    if (this.totalQuizzes === 0) return 0;
    this.accuracy = Math.round((this.correctAnswers / this.totalQuizzes) * 100);
    return this.accuracy;
};

// Index for faster queries
progressSchema.index({ user: 1, language: 1 });

module.exports = mongoose.model('Progress', progressSchema);
