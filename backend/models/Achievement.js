const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    achievementId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        default: '🏆'
    },
    category: {
        type: String,
        enum: ['streak', 'xp', 'lessons', 'vocabulary', 'social', 'special'],
        required: true
    },
    unlockCriteria: {
        type: {
            type: String,
            enum: ['streak_days', 'total_xp', 'lessons_completed', 'vocabulary_count', 'perfect_scores', 'friends_count'],
            required: true
        },
        value: {
            type: Number,
            required: true
        }
    },
    xpReward: {
        type: Number,
        default: 50
    }
}, {
    timestamps: true
});

const userAchievementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    achievement: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement',
        required: true
    },
    unlockedAt: {
        type: Date,
        default: Date.now
    },
    progress: {
        type: Number,
        default: 0
    }
});

userAchievementSchema.index({ user: 1, achievement: 1 });

const Achievement = mongoose.model('Achievement', achievementSchema);
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);

module.exports = { Achievement, UserAchievement };
