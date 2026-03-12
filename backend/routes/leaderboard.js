const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');

// Get global leaderboard
router.get('/global/:timeframe', auth, async (req, res) => {
    try {
        const { timeframe } = req.params; // weekly or monthly

        // Get current timeframe dates
        const now = new Date();
        let startDate, endDate;

        if (timeframe === 'weekly') {
            // Get start of week (Monday)
            const dayOfWeek = now.getDay();
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            startDate = new Date(now.setDate(diff));
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        } else {
            // Get start of month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        // Get top users by weekly XP
        const topUsers = await User.find()
            .select('name avatar weeklyXP leagueTier streak level')
            .sort({ weeklyXP: -1 })
            .limit(50);

        const leaderboard = topUsers.map((user, index) => ({
            rank: index + 1,
            user: {
                id: user._id,
                name: user.name,
                avatar: user.avatar,
                leagueTier: user.leagueTier
            },
            xp: user.weeklyXP
        }));

        // Find current user's rank
        const userRank = leaderboard.findIndex(entry => entry.user.id.toString() === req.userId.toString()) + 1;

        res.json({ leaderboard, startDate, endDate, userRank: userRank || null });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Failed to get leaderboard' });
    }
});

// Get friend leaderboard
router.get('/friends', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).populate('friends', 'name avatar weeklyXP leagueTier streak level');

        // Include current user and friends
        const participants = [
            {
                user: {
                    id: user._id,
                    name: user.name + ' (You)',
                    avatar: user.avatar,
                    leagueTier: user.leagueTier
                },
                xp: user.weeklyXP
            },
            ...user.friends.map(friend => ({
                user: {
                    id: friend._id,
                    name: friend.name,
                    avatar: friend.avatar,
                    leagueTier: friend.leagueTier
                },
                xp: friend.weeklyXP
            }))
        ];

        // Sort by XP
        participants.sort((a, b) => b.xp - a.xp);

        // Add ranks
        const leaderboard = participants.map((p, index) => ({
            rank: index + 1,
            ...p
        }));

        // Find current user's rank
        const userRank = leaderboard.findIndex(entry => entry.user.id.toString() === userId.toString()) + 1;

        res.json({ leaderboard, userRank });
    } catch (error) {
        console.error('Get friend leaderboard error:', error);
        res.status(500).json({ error: 'Failed to get friend leaderboard' });
    }
});

// Get league-specific leaderboard
router.get('/league/:tier', auth, async (req, res) => {
    try {
        const { tier } = req.params;

        const users = await User.find({ leagueTier: tier })
            .select('name avatar weeklyXP leagueTier streak level')
            .sort({ weeklyXP: -1 })
            .limit(50);

        const leaderboard = users.map((user, index) => ({
            rank: index + 1,
            user: {
                id: user._id,
                name: user.name,
                avatar: user.avatar,
                leagueTier: user.leagueTier
            },
            xp: user.weeklyXP
        }));

        res.json({ leaderboard, tier });
    } catch (error) {
        console.error('Get league leaderboard error:', error);
        res.status(500).json({ error: 'Failed to get league leaderboard' });
    }
});

module.exports = router;
