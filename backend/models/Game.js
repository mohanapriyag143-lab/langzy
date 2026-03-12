const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    language: {
        type: String,
        required: true,
        index: true
    },
    gameType: {
        type: String,
        required: true,
        enum: ['word-match', 'word-scramble', 'speed-cards', 'memory-game', 'typing-challenge']
    },
    score: {
        type: Number,
        required: true,
        default: 0
    },
    maxScore: {
        type: Number,
        required: true
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    xpEarned: {
        type: Number,
        default: 0
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for leaderboards
gameSchema.index({ gameType: 1, language: 1, score: -1 });
gameSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('Game', gameSchema);
