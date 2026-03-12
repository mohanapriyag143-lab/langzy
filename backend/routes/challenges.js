const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { DailyChallenge, UserChallenge } = require('../models/DailyChallenge');
const User = require('../models/User');

// Get today's daily challenge
router.get('/daily', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let challenge = await DailyChallenge.findOne({ date: today });

        // If no challenge for today, create one
        if (!challenge) {
            const challenges = [
                {
                    challengeType: 'earn_xp',
                    title: 'XP Master',
                    description: 'Earn 50 XP today',
                    targetValue: 50,
                    bonusXP: 100,
                    icon: '⭐'
                },
                {
                    challengeType: 'complete_lessons',
                    title: 'Lesson Streak',
                    description: 'Complete 3 lessons today',
                    targetValue: 3,
                    bonusXP: 150,
                    icon: '📚'
                },
                {
                    challengeType: 'perfect_quizzes',
                    title: 'Perfect Score',
                    description: 'Get 5 perfect quiz scores',
                    targetValue: 5,
                    bonusXP: 200,
                    icon: '🎯'
                },
                {
                    challengeType: 'vocabulary_words',
                    title: 'Word Wizard',
                    description: 'Master 10 new vocabulary words',
                    targetValue: 10,
                    bonusXP: 120,
                    icon: '📖'
                }
            ];

            // Random challenge
            const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];

            challenge = new DailyChallenge({
                date: today,
                ...randomChallenge
            });

            await challenge.save();
        }

        // Get user's progress on this challenge
        let userChallenge = await UserChallenge.findOne({
            user: userId,
            challenge: challenge._id
        });

        if (!userChallenge) {
            userChallenge = new UserChallenge({
                user: userId,
                challenge: challenge._id
            });
            await userChallenge.save();
        }

        res.json({
            challenge: {
                ...challenge.toObject(),
                progress: userChallenge.progress,
                completed: userChallenge.completed,
                completedAt: userChallenge.completedAt
            }
        });
    } catch (error) {
        console.error('Get daily challenge error:', error);
        res.status(500).json({ error: 'Failed to get daily challenge' });
    }
});

// Complete challenge
router.post('/complete', auth, async (req, res) => {
    try {
        const { challengeId, progress } = req.body;
        const userId = req.userId;
        const user = req.user;

        const challenge = await DailyChallenge.findById(challengeId);

        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        let userChallenge = await UserChallenge.findOne({
            user: userId,
            challenge: challengeId
        });

        if (!userChallenge) {
            userChallenge = new UserChallenge({
                user: userId,
                challenge: challengeId
            });
        }

        if (!userChallenge.completed) {
            userChallenge.progress = progress;

            if (progress >= challenge.targetValue) {
                userChallenge.completed = true;
                userChallenge.completedAt = new Date();

                // Award bonus XP
                user.xp += challenge.bonusXP;
                user.weeklyXP += challenge.bonusXP;
                user.calculateLevel();
                await user.save();

                await userChallenge.save();

                res.json({
                    message: 'Challenge completed!',
                    bonusXP: challenge.bonusXP,
                    userChallenge
                });
            } else {
                await userChallenge.save();

                res.json({
                    message: 'Progress updated',
                    userChallenge
                });
            }
        } else {
            res.json({
                message: 'Challenge already completed',
                userChallenge
            });
        }
    } catch (error) {
        console.error('Complete challenge error:', error);
        res.status(500).json({ error: 'Failed to complete challenge' });
    }
});

// Get challenge history
router.get('/history', auth, async (req, res) => {
    try {
        const userId = req.userId;

        const userChallenges = await UserChallenge.find({ user: userId, completed: true })
            .populate('challenge')
            .sort({ completedAt: -1 })
            .limit(30);

        res.json({ challenges: userChallenges });
    } catch (error) {
        console.error('Get challenge history error:', error);
        res.status(500).json({ error: 'Failed to get challenge history' });
    }
});

module.exports = router;
