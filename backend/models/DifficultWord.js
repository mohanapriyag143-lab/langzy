const mongoose = require('mongoose');

const difficultWordSchema = new mongoose.Schema({
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
    word: {
        type: String,
        required: true
    },
    translation: {
        type: String,
        required: true
    },
    context: {
        type: String, // Sentence or context where the word was encountered
        default: ''
    },
    pronunciation: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    markedAt: {
        type: Date,
        default: Date.now
    },
    mastered: {
        type: Boolean,
        default: false
    },
    masteredAt: {
        type: Date
    },
    practiceCount: {
        type: Number,
        default: 0
    },
    lastPracticedAt: {
        type: Date
    }
}, { timestamps: true });

// Compound index to prevent duplicates
difficultWordSchema.index({ userId: 1, language: 1, word: 1 }, { unique: true });
difficultWordSchema.index({ userId: 1, language: 1, mastered: 1 });

module.exports = mongoose.model('DifficultWord', difficultWordSchema);
