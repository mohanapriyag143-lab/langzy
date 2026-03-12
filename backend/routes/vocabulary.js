const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Progress = require('../models/Progress');

// Get vocabulary for a language
router.get('/:language', auth, async (req, res) => {
    try {
        const { language } = req.params;
        const userId = req.userId;

        // Case-insensitive match
        const langRegex = new RegExp(`^${language}$`, 'i');
        const progress = await Progress.findOne({ user: userId, language: langRegex });

        if (!progress) {
            return res.json({ vocabulary: [], totalMastered: 0 });
        }

        res.json({
            vocabulary: progress.vocabularyList || [],
            totalMastered: progress.vocabularyMastered || 0
        });
    } catch (error) {
        console.error('Get vocabulary error:', error);
        res.status(500).json({ error: 'Failed to get vocabulary' });
    }
});

// Get words due for review (spaced repetition)
router.get('/:language/review', auth, async (req, res) => {
    try {
        const { language } = req.params;
        const userId = req.userId;

        const progress = await Progress.findOne({ user: userId, language });

        if (!progress) {
            return res.json({ wordsToReview: [] });
        }

        const now = new Date();
        const wordsToReview = progress.vocabularyList.filter(
            vocab => new Date(vocab.nextReview) <= now
        );

        res.json({ wordsToReview });
    } catch (error) {
        console.error('Get review words error:', error);
        res.status(500).json({ error: 'Failed to get review words' });
    }
});

// Mark vocabulary as mastered/reviewed
router.post('/mastered', auth, async (req, res) => {
    try {
        const { language, word, correct } = req.body;
        const userId = req.userId;

        const progress = await Progress.findOne({ user: userId, language });

        if (!progress) {
            return res.status(404).json({ error: 'Progress not found' });
        }

        const vocabItem = progress.vocabularyList.find(v => v.word === word);

        if (vocabItem) {
            vocabItem.reviewCount += 1;
            vocabItem.lastReviewed = new Date();

            // Spaced repetition algorithm
            if (correct) {
                // Increase interval (1 day -> 3 days -> 7 days -> 14 days -> 30 days)
                const intervals = [1, 3, 7, 14, 30];
                const nextInterval = intervals[Math.min(vocabItem.reviewCount, intervals.length - 1)];
                vocabItem.nextReview = new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000);
                vocabItem.strength = 'gold';
            } else {
                // Reset to 1 day
                vocabItem.nextReview = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
                vocabItem.strength = 'broken';
            }

            await progress.save();

            res.json({
                message: 'Vocabulary updated',
                vocabulary: vocabItem
            });
        } else {
            res.status(404).json({ error: 'Vocabulary item not found' });
        }
    } catch (error) {
        console.error('Update vocabulary error:', error);
        res.status(500).json({ error: 'Failed to update vocabulary' });
    }
});

module.exports = router;
