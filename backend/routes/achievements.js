const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Achievement, UserAchievement } = require('../models/Achievement');
const User = require('../models/User');
const Progress = require('../models/Progress');
const { checkAchievements } = require('../utils/achievementHelper');

// Get all achievements with user's unlock status
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        const progress = await Progress.findOne({ user: userId }); // Get last active language progress or similar

        // Auto-check and unlock achievements when viewing the list
        await checkAchievements(userId, user, progress);

        const achievements = await Achievement.find();
        const userAchievements = await UserAchievement.find({ user: userId })
            .populate('achievement');

        const achievementsWithStatus = achievements.map(achievement => {
            const userAchievement = userAchievements.find(
                ua => ua.achievement._id.toString() === achievement._id.toString()
            );

            return {
                ...achievement.toObject(),
                unlocked: !!userAchievement,
                unlockedAt: userAchievement?.unlockedAt,
                progress: userAchievement?.progress || 0
            };
        });

        res.json({ achievements: achievementsWithStatus });
    } catch (error) {
        console.error('Get achievements error:', error);
        res.status(500).json({ error: 'Failed to get achievements' });
    }
});

// Get user's unlocked achievements
router.get('/unlocked', auth, async (req, res) => {
    try {
        const userId = req.userId;

        const userAchievements = await UserAchievement.find({ user: userId })
            .populate('achievement')
            .sort({ unlockedAt: -1 });

        res.json({ achievements: userAchievements });
    } catch (error) {
        console.error('Get unlocked achievements error:', error);
        res.status(500).json({ error: 'Failed to get unlocked achievements' });
    }
});

module.exports = router;
