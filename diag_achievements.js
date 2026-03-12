const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Set up relative paths
const backendDir = path.join(__dirname, 'backend');
const User = require(path.join(backendDir, 'models', 'User'));
const Progress = require(path.join(backendDir, 'models', 'Progress'));
const { Achievement, UserAchievement } = require(path.join(backendDir, 'models', 'Achievement'));
const { checkAchievements } = require(path.join(backendDir, 'utils', 'achievementHelper'));

dotenv.config({ path: path.join(backendDir, '.env') });

async function diagnose() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not found in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const user = await User.findOne().sort({ createdAt: -1 });
        if (!user) {
            console.log('No user found');
            process.exit(1);
        }

        console.log(`Diagnosing for user: ${user.name} (${user.email})`);
        console.log(`Current streak: ${user.streak}`);
        console.log(`Current XP: ${user.xp}`);

        const progress = await Progress.findOne({ user: user._id });
        console.log(`Progress found: ${!!progress}`);

        console.log('--- Running checkAchievements ---');
        const newlyUnlocked = await checkAchievements(user._id, user, progress);
        console.log(`Newly unlocked count: ${newlyUnlocked.length}`);
        newlyUnlocked.forEach(a => console.log(`Unlocked now: ${a.title}`));

        const allUserAchievements = await UserAchievement.find({ user: user._id }).populate('achievement');
        console.log(`Total achievements unlocked in DB: ${allUserAchievements.length}`);
        allUserAchievements.forEach(ua => console.log(`- ${ua.achievement.title}`));

        process.exit(0);
    } catch (err) {
        console.error('Error during diagnosis:', err);
        process.exit(1);
    }
}

diagnose();
