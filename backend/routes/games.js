const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Game = require('../models/Game');
const User = require('../models/User');

// Get available games
router.get('/', auth, async (req, res) => {
    try {
        const games = [
            {
                id: 'word-match',
                name: 'Word Match',
                icon: '🎯',
                description: 'Match words with their translations',
                difficulty: 'Easy',
                xpReward: 10
            },
            {
                id: 'word-scramble',
                name: 'Word Scramble',
                icon: '🔤',
                description: 'Unscramble letters to form words',
                difficulty: 'Medium',
                xpReward: 15
            },
            {
                id: 'speed-cards',
                name: 'Speed Cards',
                icon: '⚡',
                description: 'Fast-paced flashcard challenge',
                difficulty: 'Medium',
                xpReward: 20
            },
            {
                id: 'memory-game',
                name: 'Memory Game',
                icon: '🧠',
                description: 'Match pairs of words and translations',
                difficulty: 'Hard',
                xpReward: 25
            },
            {
                id: 'typing-challenge',
                name: 'Typing Challenge',
                icon: '⌨️',
                description: 'Type translations as fast as you can',
                difficulty: 'Hard',
                xpReward: 30
            }
        ];

        res.json({ games });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user's game history
router.get('/history', auth, async (req, res) => {
    try {
        const { language, gameType } = req.query;
        const query = { userId: req.user.id };

        if (language) query.language = language;
        if (gameType) query.gameType = gameType;

        const games = await Game.find(query)
            .sort({ completedAt: -1 })
            .limit(50);

        res.json({ games });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get personal best scores
router.get('/personal-best', auth, async (req, res) => {
    try {
        const { language } = req.query;

        const gameTypes = ['word-match', 'word-scramble', 'speed-cards', 'memory-game', 'typing-challenge'];
        const personalBests = {};

        for (const gameType of gameTypes) {
            const bestGame = await Game.findOne({
                userId: req.user.id,
                language,
                gameType
            }).sort({ score: -1 }).limit(1);

            personalBests[gameType] = bestGame ? {
                score: bestGame.score,
                duration: bestGame.duration,
                completedAt: bestGame.completedAt
            } : null;
        }

        res.json({ personalBests });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get game leaderboard
router.get('/leaderboard/:gameType', auth, async (req, res) => {
    try {
        const { gameType } = req.params;
        const { language } = req.query;

        const leaderboard = await Game.aggregate([
            {
                $match: {
                    gameType,
                    language: language || 'Spanish'
                }
            },
            {
                $sort: { score: -1, duration: 1 }
            },
            {
                $group: {
                    _id: '$userId',
                    bestScore: { $first: '$score' },
                    bestDuration: { $first: '$duration' },
                    completedAt: { $first: '$completedAt' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    userId: '$_id',
                    username: '$user.username',
                    name: '$user.name',
                    avatar: '$user.avatar',
                    score: '$bestScore',
                    duration: '$bestDuration',
                    completedAt: 1
                }
            },
            {
                $limit: 100
            }
        ]);

        res.json({ leaderboard });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Save game result
router.post('/complete', auth, async (req, res) => {
    try {
        const { language, gameType, score, maxScore, duration } = req.body;

        // Calculate XP based on performance
        const percentage = (score / maxScore) * 100;
        let xpEarned = 0;

        if (percentage >= 90) xpEarned = 50;
        else if (percentage >= 75) xpEarned = 35;
        else if (percentage >= 50) xpEarned = 20;
        else xpEarned = 10;

        // Create game record
        const game = new Game({
            userId: req.user.id,
            language,
            gameType,
            score,
            maxScore,
            duration,
            xpEarned
        });

        await game.save();

        // Update user XP
        const user = await User.findById(req.user.id);
        user.xp += xpEarned;
        user.level = Math.floor(user.xp / 100) + 1;
        await user.save();

        res.json({
            message: 'Game completed!',
            game,
            xpEarned,
            totalXP: user.xp,
            level: user.level
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
