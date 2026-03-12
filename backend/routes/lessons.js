const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const User = require('../models/User');
const { checkAchievements } = require('../utils/achievementHelper');

// Get randomized quizzes for a language and type
router.get('/quizzes', auth, async (req, res) => {
    try {
        const { language, type } = req.query;

        // Map frontend types to backend enum
        const typeMap = {
            'multiple-choice': 'multiple_choice',
            'fill-blank': 'fill_blank',
            'matching': 'match_pairs',
            'listening': 'listening',
            'speaking': 'speaking'
        };

        const backendType = typeMap[type] || type;

        // Find lessons in this language that contain quizzes of this type
        // Never allow speaking, listening, or fill-blank types for courses
        if (backendType === 'speaking' || backendType === 'listening' || backendType === 'fill_blank') {
            return res.json({ quizzes: [] });
        }

        const lessons = await Lesson.find({
            language,
            'quizzes.type': backendType
        });

        if (lessons.length === 0) {
            return res.json({ quizzes: [] });
        }

        // Extract and flatten quizzes of the requested type
        let allQuizzes = [];
        lessons.forEach(lesson => {
            const lessonQuizzes = lesson.quizzes.filter(q => q.type === backendType);
            allQuizzes = [...allQuizzes, ...lessonQuizzes];
        });

        // Shuffle and limit to 10
        const shuffled = allQuizzes.sort(() => Math.random() - 0.5).slice(0, 10);

        res.json({ quizzes: shuffled });
    } catch (error) {
        console.error('Get quizzes error:', error);
        res.status(500).json({ error: 'Failed to get quizzes' });
    }
});

// Get courses for a language
router.get('/:language', auth, async (req, res) => {
    try {
        const { language } = req.params;
        const userId = req.userId;

        // Case-insensitive language search — handles 'ta', 'Tamil', 'tamil' etc.
        const langRegex = new RegExp(`^${language}$`, 'i');
        const lessons = await Lesson.find({ language: langRegex }).sort({ difficulty: 1, order: 1 });

        // Get user's progress
        const progress = await Progress.findOne({ user: userId, language: langRegex });

        // Default: always unlock the first beginner lesson dynamically
        const firstLesson = lessons.find(l => l.difficulty === 'beginner');
        const firstLessonId = firstLesson ? firstLesson.lessonId : 'beginner_1';
        const unlockedLessons = progress?.unlockedLessons?.length
            ? progress.unlockedLessons
            : [firstLessonId];
        const completedLessons = progress?.lessonsCompleted || [];

        // Group by difficulty
        const courses = { beginner: [], intermediate: [], advanced: [] };

        lessons.forEach(lesson => {
            const filteredQuizzes = (lesson.quizzes || []).filter(q =>
                q.type !== 'speaking' &&
                q.type !== 'listening' &&
                q.type !== 'fill_blank'
            );
            const lessonData = {
                ...lesson.toObject(),
                quizzes: filteredQuizzes,
                unlocked: unlockedLessons.includes(lesson.lessonId) || lesson.order === 1,
                completed: completedLessons.some(c => c.lessonId === lesson.lessonId)
            };
            if (courses[lesson.difficulty]) {
                courses[lesson.difficulty].push(lessonData);
            }
        });

        res.json({ courses, lessons, progress });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ error: 'Failed to get courses' });
    }
});

// Get specific lesson
router.get('/:language/:courseId/:lessonId', auth, async (req, res) => {
    try {
        const { lessonId } = req.params;

        const lesson = await Lesson.findOne({ lessonId });

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        res.json({ lesson });
    } catch (error) {
        console.error('Get lesson error:', error);
        res.status(500).json({ error: 'Failed to get lesson' });
    }
});

// Complete lesson
router.post('/complete', auth, async (req, res) => {
    try {
        const { language, lessonId, score, quizResults } = req.body;
        const userId = req.userId;
        const user = req.user;

        // Check if user has enough hearts
        if (user.hearts <= 0) {
            return res.status(400).json({
                error: 'No hearts remaining',
                heartsRefillTime: user.heartsRefillTime
            });
        }

        const langRegex = new RegExp(`^${language}$`, 'i');
        const lesson = await Lesson.findOne({ lessonId });

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        // Get or create progress
        let progress = await Progress.findOne({ user: userId, language: langRegex });
        if (!progress) {
            progress = new Progress({
                user: userId,
                language: lesson.language, // Use lesson's language for consistency
                unlockedLessons: [lessonId]
            });
        }

        // Check if already completed
        const alreadyCompleted = progress.lessonsCompleted.some(
            c => c.lessonId === lessonId
        );

        if (!alreadyCompleted) {
            // Mark as completed
            progress.lessonsCompleted.push({
                lessonId,
                courseId: lesson.courseId,
                score,
                completedAt: new Date()
            });

            // Unlock next lesson if exists
            const nextLesson = await Lesson.findOne({
                language,
                courseId: lesson.courseId,
                order: lesson.order + 1
            });

            if (nextLesson && !progress.unlockedLessons.includes(nextLesson.lessonId)) {
                progress.unlockedLessons.push(nextLesson.lessonId);
            }

            // Award XP
            const xpEarned = lesson.xpReward;
            progress.totalXP += xpEarned;
            user.xp += xpEarned;
            user.weeklyXP += xpEarned;
            user.calculateLevel();

            // Update quiz stats
            if (quizResults) {
                progress.totalQuizzes += quizResults.total || 0;
                progress.correctAnswers += quizResults.correct || 0;
                progress.calculateAccuracy();

                // Deduct hearts for wrong answers (Duolingo style)
                const mistakes = (quizResults.total || 0) - (quizResults.correct || 0);
                if (mistakes > 0) {
                    user.hearts = Math.max(0, user.hearts - mistakes);
                    if (user.hearts === 0) {
                        // Set refill time
                        user.heartsRefillTime = new Date(Date.now() + 5 * 60 * 60 * 1000);
                    }
                }
            }

            // Add vocabulary to progress
            if (lesson.vocabulary && lesson.vocabulary.length > 0) {
                lesson.vocabulary.forEach(vocab => {
                    const exists = progress.vocabularyList.some(v => v.word === vocab.word);
                    if (!exists) {
                        progress.vocabularyList.push({
                            word: vocab.word,
                            translation: vocab.translation,
                            strength: 'gold',
                            lastReviewed: new Date(),
                            nextReview: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // Review in 1 day
                        });
                    }
                });
                progress.vocabularyMastered = progress.vocabularyList.length;
            }

            await progress.save();
            await user.save();

            // Check for achievements immediately
            await checkAchievements(userId, user, progress);

            res.json({
                message: 'Lesson completed successfully',
                xpEarned,
                nextLessonUnlocked: nextLesson ? nextLesson.lessonId : null,
                progress,
                user: {
                    xp: user.xp,
                    level: user.level,
                    hearts: user.hearts,
                    heartsRefillTime: user.heartsRefillTime
                }
            });
        } else {
            res.json({
                message: 'Lesson already completed',
                progress
            });
        }
    } catch (error) {
        console.error('Complete lesson error:', error);
        res.status(500).json({ error: 'Failed to complete lesson' });
    }
});

module.exports = router;
