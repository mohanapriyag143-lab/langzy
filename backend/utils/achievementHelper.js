const { Achievement, UserAchievement } = require('../models/Achievement');

/**
 * Checks and awards achievements based on user stats and progress
 * @param {string} userId - User's ID
 * @param {object} user - User document
 * @param {object} progress - Progress document (optional)
 * @returns {Promise<Array>} - List of newly unlocked achievements
 */
async function checkAchievements(userId, user, progress) {
    if (!user) return [];

    const accomplishments = await Achievement.find();
    const newlyUnlocked = [];

    for (const achievement of accomplishments) {
        // Check if user already has this achievement
        const existing = await UserAchievement.findOne({
            user: userId,
            achievement: achievement._id
        });

        if (!existing) {
            let unlocked = false;
            let currentValue = 0;

            switch (achievement.unlockCriteria.type) {
                case 'streak_days':
                    currentValue = user.streak || 0;
                    unlocked = currentValue >= achievement.unlockCriteria.value;
                    break;
                case 'total_xp':
                    currentValue = user.xp || 0;
                    unlocked = currentValue >= achievement.unlockCriteria.value;
                    break;
                case 'lessons_completed':
                    // Check if we have progress, otherwise use 0
                    currentValue = progress?.unlockedLessons?.length || 0;
                    unlocked = currentValue >= achievement.unlockCriteria.value;
                    break;
                case 'vocabulary_count':
                    currentValue = progress?.vocabularyMastered || 0;
                    unlocked = currentValue >= achievement.unlockCriteria.value;
                    break;
                case 'friends_count':
                    currentValue = user.friends?.length || 0;
                    unlocked = currentValue >= achievement.unlockCriteria.value;
                    break;
            }

            if (unlocked) {
                // Award achievement
                const userAchievement = new UserAchievement({
                    user: userId,
                    achievement: achievement._id,
                    progress: achievement.unlockCriteria.value
                });
                await userAchievement.save();

                // Award XP bonus
                user.xp += achievement.xpReward;
                newlyUnlocked.push(achievement);
            }
        }
    }

    if (newlyUnlocked.length > 0) {
        await user.save();
    }

    return newlyUnlocked;
}

module.exports = { checkAchievements };
