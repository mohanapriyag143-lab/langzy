const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const { Achievement } = require('./models/Achievement');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const achievements = [
    {
        achievementId: 'streak_3',
        title: 'Streak Starter',
        description: 'Maintain a 3-day learning streak',
        icon: '🔥',
        category: 'streak',
        unlockCriteria: { type: 'streak_days', value: 3 },
        xpReward: 50
    },
    {
        achievementId: 'streak_7',
        title: 'Consistent Learner',
        description: 'Maintain a 7-day learning streak',
        icon: '📅',
        category: 'streak',
        unlockCriteria: { type: 'streak_days', value: 7 },
        xpReward: 100
    },
    {
        achievementId: 'xp_100',
        title: 'Quick Learner',
        description: 'Earn your first 100 XP',
        icon: '✨',
        category: 'xp',
        unlockCriteria: { type: 'total_xp', value: 100 },
        xpReward: 50
    },
    {
        achievementId: 'xp_500',
        title: 'XP Collector',
        description: 'Earn a total of 500 XP',
        icon: '🏆',
        category: 'xp',
        unlockCriteria: { type: 'total_xp', value: 500 },
        xpReward: 150
    },
    {
        achievementId: 'lessons_1',
        title: 'First Steps',
        description: 'Complete your first lesson',
        icon: '👣',
        category: 'lessons',
        unlockCriteria: { type: 'lessons_completed', value: 1 },
        xpReward: 50
    },
    {
        achievementId: 'lessons_5',
        title: 'Polyglot in Training',
        description: 'Complete 5 different lessons',
        icon: '📚',
        category: 'lessons',
        unlockCriteria: { type: 'lessons_completed', value: 5 },
        xpReward: 100
    },
    {
        achievementId: 'vocab_10',
        title: 'Word Hunter',
        description: 'Master 10 new vocabulary words',
        icon: '🔍',
        category: 'vocabulary',
        unlockCriteria: { type: 'vocabulary_count', value: 10 },
        xpReward: 50
    },
    {
        achievementId: 'social_1',
        title: 'Social Butterfly',
        description: 'Add your first friend',
        icon: '🤝',
        category: 'social',
        unlockCriteria: { type: 'friends_count', value: 1 },
        xpReward: 50
    }
];

async function seedAchievements() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing achievements (Optional: only if you want a clean start)
        // await Achievement.deleteMany({});
        // console.log('🗑️  Existing achievements cleared');

        for (const achievementData of achievements) {
            await Achievement.findOneAndUpdate(
                { achievementId: achievementData.achievementId },
                achievementData,
                { upsert: true, new: true }
            );
        }

        console.log('✅ Achievements seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding achievements:', error);
        process.exit(1);
    }
}

seedAchievements();
