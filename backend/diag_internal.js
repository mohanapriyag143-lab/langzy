const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load models and helper
const User = require('./models/User');
const Progress = require('./models/Progress');
const { Achievement, UserAchievement } = require('./models/Achievement');
const { checkAchievements } = require('./utils/achievementHelper');

dotenv.config();

async function diagnose() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not found in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Look for any user that might be the current one
        const user = await User.findOne().sort({ updatedAt: -1 });
        if (!user) {
            console.log('No user found');
            process.exit(1);
        }

        console.log(`Diagnosing for user: ${user.name} (${user.email})`);
        console.log(`Current streak in User model: ${user.streak}`);
        console.log(`Current XP in User model: ${user.xp}`);

        const progress = await Progress.findOne({ user: user._id });
        console.log(`Progress document exists: ${!!progress}`);
        if (progress) {
            console.log(`Vocabulary Mastered: ${progress.vocabularyMastered}`);
            console.log(`Unlocked Lessons Count: ${progress.unlockedLessons?.length}`);
        }

        console.log('--- Checking Achievements for this User ---');
        // We simulate the check
        const newlyUnlocked = await checkAchievements(user._id, user, progress);
        console.log(`Newly unlocked in this run: ${newlyUnlocked.length}`);
        newlyUnlocked.forEach(a => console.log(`- Unlocked: ${a.title}`));

        const currentUnlocks = await UserAchievement.find({ user: user._id }).populate('achievement');
        console.log(`All Unlocked Achievements (persistent): ${currentUnlocks.length}`);
        currentUnlocks.forEach(ua => console.log(`- ${ua.achievement?.title || 'Unknown title'}`));

        process.exit(0);
    } catch (err) {
        console.error('Diagnosis Error:', err);
        process.exit(1);
    }
}

diagnose();
