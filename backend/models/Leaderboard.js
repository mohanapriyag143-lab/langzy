const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    timeframe: {
        type: String,
        enum: ['weekly', 'monthly'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    xpEarned: {
        type: Number,
        default: 0
    },
    rank: {
        type: Number,
        default: 0
    },
    leagueTier: {
        type: String,
        enum: ['Bronze', 'Silver', 'Gold', 'Diamond', 'Legendary'],
        default: 'Bronze'
    },
    promoted: {
        type: Boolean,
        default: false
    },
    demoted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for faster queries
leaderboardSchema.index({ timeframe: 1, startDate: 1, endDate: 1 });
leaderboardSchema.index({ timeframe: 1, leagueTier: 1, xpEarned: -1 });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
