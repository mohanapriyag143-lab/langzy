const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const DifficultWord = require('../models/DifficultWord');

// Get all difficult words for a user
router.get('/', auth, async (req, res) => {
    try {
        const { language, mastered } = req.query;
        const query = { userId: req.user.id };

        if (language) query.language = language;
        if (mastered !== undefined) query.mastered = mastered === 'true';

        const words = await DifficultWord.find(query).sort({ markedAt: -1 });

        res.json({ words, count: words.length });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add a word to difficult words
router.post('/', auth, async (req, res) => {
    try {
        const { language, word, translation, context, pronunciation, notes } = req.body;

        // Check if word already exists
        let difficultWord = await DifficultWord.findOne({
            userId: req.user.id,
            language,
            word
        });

        if (difficultWord) {
            // Update existing word
            difficultWord.translation = translation || difficultWord.translation;
            difficultWord.context = context || difficultWord.context;
            difficultWord.pronunciation = pronunciation || difficultWord.pronunciation;
            difficultWord.notes = notes || difficultWord.notes;
            await difficultWord.save();

            return res.json({
                message: 'Word updated',
                word: difficultWord
            });
        }

        // Create new difficult word
        difficultWord = new DifficultWord({
            userId: req.user.id,
            language,
            word,
            translation,
            context,
            pronunciation,
            notes
        });

        await difficultWord.save();

        res.json({
            message: 'Word added to difficult words',
            word: difficultWord
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update a difficult word
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const word = await DifficultWord.findOne({
            _id: id,
            userId: req.user.id
        });

        if (!word) {
            return res.status(404).json({ message: 'Word not found' });
        }

        // Update fields
        Object.keys(updates).forEach(key => {
            word[key] = updates[key];
        });

        // If marking as mastered
        if (updates.mastered && !word.masteredAt) {
            word.masteredAt = new Date();
        }

        await word.save();

        res.json({
            message: 'Word updated',
            word
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Mark word as practiced
router.post('/:id/practice', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const word = await DifficultWord.findOne({
            _id: id,
            userId: req.user.id
        });

        if (!word) {
            return res.status(404).json({ message: 'Word not found' });
        }

        word.practiceCount += 1;
        word.lastPracticedAt = new Date();
        await word.save();

        res.json({
            message: 'Practice recorded',
            word
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a difficult word
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const word = await DifficultWord.findOneAndDelete({
            _id: id,
            userId: req.user.id
        });

        if (!word) {
            return res.status(404).json({ message: 'Word not found' });
        }

        res.json({ message: 'Word removed from difficult words' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const { language } = req.query;
        const query = { userId: req.user.id };

        if (language) query.language = language;

        const total = await DifficultWord.countDocuments(query);
        const mastered = await DifficultWord.countDocuments({ ...query, mastered: true });
        const learning = total - mastered;

        res.json({
            total,
            mastered,
            learning,
            masteryRate: total > 0 ? Math.round((mastered / total) * 100) : 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
