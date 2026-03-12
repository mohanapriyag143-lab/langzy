const mongoose = require('mongoose');

const dailyChallengeSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    },
    challengeType: {
        type: String,
        enum: ['complete_lessons', 'earn_xp', 'perfect_quizzes', 'practice_minutes', 'vocabulary_words'],
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
    targetValue: {
        type: Number,
        required: true
    },
    bonusXP: {
        type: Number,
        default: 100
    },
    icon: {
        type: String,
        default: '🎯'
    }
}, {
    timestamps: true
});

const userChallengeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    challenge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DailyChallenge',
        required: true
    },
    progress: {
        type: Number,
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
    }
});

userChallengeSchema.index({ user: 1, challenge: 1 });

const DailyChallenge = mongoose.model('DailyChallenge', dailyChallengeSchema);
const UserChallenge = mongoose.model('UserChallenge', userChallengeSchema);

module.exports = { DailyChallenge, UserChallenge };
