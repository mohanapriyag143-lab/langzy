const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Progress = require('../models/Progress');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const { UserAchievement } = require('../models/Achievement');
const { checkAchievements } = require('../utils/achievementHelper');

// Get user's overall progress
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const progresses = await Progress.find({ user: userId });

        // Calculate aggregate stats
        const stats = {
            totalLessons: progresses.reduce((acc, p) => acc + (p.lessonsCompleted || 0), 0),
            totalVocabulary: progresses.reduce((acc, p) => acc + (p.vocabularyMastered || 0), 0)
        };

        res.json({ progresses, stats });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: 'Failed to get progress' });
    }
});

// Get progress for specific language
router.get('/:language', auth, async (req, res) => {
    try {
        const { language } = req.params;
        const userId = req.userId;

        const langRegex = new RegExp(`^${language}$`, 'i');
        let progress = await Progress.findOne({ user: userId, language: langRegex });

        if (!progress) {
            // Find all beginner lessons for this language to unlock them by default
            const beginnerLessons = await Lesson.find({ language, difficulty: 'beginner' }).sort({ order: 1 });
            const initialUnlocked = beginnerLessons.map(l => l.lessonId);

            // Create initial progress
            progress = new Progress({
                user: userId,
                language,
                unlockedLessons: initialUnlocked.length > 0 ? initialUnlocked : [`${language.toLowerCase()}_beginner_1`]
            });
            await progress.save();
        } else {
            // Ensure all beginner lessons are unlocked even for existing users
            const beginnerLessons = await Lesson.find({ language, difficulty: 'beginner' }).sort({ order: 1 });
            const beginnerIds = beginnerLessons.map(l => l.lessonId);

            let updated = false;
            beginnerIds.forEach(id => {
                if (!progress.unlockedLessons.includes(id)) {
                    progress.unlockedLessons.push(id);
                    updated = true;
                }
            });

            if (updated) {
                await progress.save();
            }
        }

        res.json({ progress });
    } catch (error) {
        console.error('Get language progress error:', error);
        res.status(500).json({ error: 'Failed to get progress' });
    }
});

// Update progress (XP, vocabulary, quiz stats)
router.post('/update', auth, async (req, res) => {
    try {
        const { language, xpEarned, vocabularyAdded, quizResults, skillType } = req.body;
        const userId = req.userId;
        const user = req.user;

        const langRegex = new RegExp(`^${language}$`, 'i');
        let progress = await Progress.findOne({ user: userId, language: langRegex });

        if (!progress) {
            const beginnerLessons = await Lesson.find({ language, difficulty: 'beginner' }).sort({ order: 1 });
            const initialUnlocked = beginnerLessons.map(l => l.lessonId);

            progress = new Progress({
                user: userId,
                language,
                unlockedLessons: initialUnlocked.length > 0 ? initialUnlocked : [`${language.toLowerCase()}_beginner_1`]
            });
        }

        // Update XP
        if (xpEarned) {
            progress.totalXP += xpEarned;
            user.xp += xpEarned;
            user.weeklyXP += xpEarned;
            user.calculateLevel();

            // Add to daily XP log
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayLog = progress.dailyXP.find(log => {
                const logDate = new Date(log.date);
                logDate.setHours(0, 0, 0, 0);
                return logDate.getTime() === today.getTime();
            });

            if (todayLog) {
                todayLog.xp += xpEarned;
            } else {
                progress.dailyXP.push({ date: today, xp: xpEarned });
            }
        }

        // Update vocabulary
        if (vocabularyAdded) {
            progress.vocabularyMastered += vocabularyAdded;
        }

        // Update quiz statistics
        if (quizResults) {
            progress.totalQuizzes += quizResults.total || 0;
            progress.correctAnswers += quizResults.correct || 0;
            progress.calculateAccuracy();
        }

        // Update skill strength
        if (skillType && ['reading', 'writing', 'listening', 'speaking'].includes(skillType)) {
            progress.skillStrength[skillType] = Math.min(
                progress.skillStrength[skillType] + 2,
                100
            );
        }

        await progress.save();
        await user.save();

        // Check for new achievements
        if (userId && user) {
            await checkAchievements(userId, user, progress);
        }

        res.json({
            message: 'Progress updated successfully',
            progress,
            user: {
                xp: user.xp,
                level: user.level,
                weeklyXP: user.weeklyXP
            }
        });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Update streak
router.put('/streak', auth, async (req, res) => {
    try {
        const user = req.user;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastActive = new Date(user.lastActiveDate);
        lastActive.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
            user.streak += 1;
        } else if (daysDiff > 1) {
            if (user.streakFreezes > 0) {
                user.streakFreezes -= 1;
            } else {
                user.streak = 1;
            }
        }

        user.lastActiveDate = new Date();
        await user.save();

        // Check for achievements immediately after streak update
        const progress = await Progress.findOne({ user: user._id }); // Fallback progress
        await checkAchievements(user._id, user, progress);

        res.json({
            message: 'Streak updated',
            streak: user.streak,
            streakFreezes: user.streakFreezes
        });
    } catch (error) {
        console.error('Update streak error:', error);
        res.status(500).json({ error: 'Failed to update streak' });
    }
});

// Achievement helper function removed as it is now in ../utils/achievementHelper.js

module.exports = router;
