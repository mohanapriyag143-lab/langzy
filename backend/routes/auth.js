const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Progress = require('../models/Progress');
const auth = require('../middleware/auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Get Public Config
router.get('/config', (req, res) => {
    res.json({
        googleClientId: process.env.GOOGLE_CLIENT_ID || ''
    });
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, nativeLanguage } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password,
            nativeLanguage: nativeLanguage || 'English',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            streak: 1, // Start with day 1 streak
            lastActiveDate: new Date()
        });

        await user.save();

        // Create JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                xp: user.xp,
                level: user.level,
                hearts: user.hearts,
                streak: user.streak,
                leagueTier: user.leagueTier
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last active date and streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastActive = new Date(user.lastActiveDate);
        lastActive.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
            // Consecutive day - increment streak
            user.streak += 1;
        } else if (daysDiff > 1) {
            // Streak broken
            if (user.streakFreezes > 0) {
                user.streakFreezes -= 1;
            } else {
                user.streak = 1; // Reset to 1 (today counts as day 1)
            }
        } else if (daysDiff === 0 && user.streak === 0) {
            // First login ever or same day login with 0 streak
            user.streak = 1;
        }
        // If daysDiff === 0 and streak > 0, same day, no change

        user.lastActiveDate = new Date();
        user.refillHearts();

        // Fix: convert currentLanguage from object to string if needed
        if (user.currentLanguage && typeof user.currentLanguage === 'object') {
            user.currentLanguage = user.currentLanguage.code || user.currentLanguage.name || null;
        }

        await user.save();

        // Create JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                xp: user.xp,
                level: user.level,
                hearts: user.hearts,
                heartsRefillTime: user.heartsRefillTime,
                streak: user.streak,
                streakFreezes: user.streakFreezes,
                leagueTier: user.leagueTier,
                weeklyXP: user.weeklyXP,
                nativeLanguage: user.nativeLanguage,
                learningLanguages: user.learningLanguages,
                currentLanguage: user.currentLanguage
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Social Login (Google/Microsoft)
router.post('/social', async (req, res) => {
    try {
        const { provider, credential } = req.body;
        let email, name, avatar;

        if (provider === 'google') {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();
            email = payload.email;
            name = payload.name;
            avatar = payload.picture;
        } else if (provider === 'demo' || provider === 'demo_ms') {
            // Demo mode for testing without real credentials
            const demoName = req.body.name || (provider === 'demo' ? 'Demo Google Learner' : 'Demo Microsoft Learner');
            email = req.body.email || (provider === 'demo' ? 'demo_google@langzy.test' : 'demo_ms@langzy.test');
            name = demoName;
            avatar = req.body.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
        } else if (provider === 'microsoft') {
            // Simplified Microsoft logic (Placeholder for real MSAL verification)
            // Real implementation would require verifying the token with Microsoft JWKS
            return res.status(501).json({ error: 'Microsoft login not yet fully implemented' });
        } else {
            return res.status(400).json({ error: 'Invalid provider' });
        }

        // Find or create user
        let user = await User.findOne({ email });

        if (!user) {
            // Create new social user
            user = new User({
                name,
                email,
                avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
                socialProvider: provider,
                streak: 1,
                lastActiveDate: new Date(),
                password: Math.random().toString(36).slice(-12) // Random password for social users
            });
            await user.save();
        } else {
            // Update last active/streak for existing user
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lastActive = new Date(user.lastActiveDate);
            lastActive.setHours(0, 0, 0, 0);

            if (Math.floor((today - lastActive) / (1000 * 60 * 60 * 24)) === 1) {
                user.streak += 1;
            }
            user.lastActiveDate = new Date();
            user.refillHearts();

            // Fix: convert currentLanguage from object to string if needed
            if (user.currentLanguage && typeof user.currentLanguage === 'object') {
                user.currentLanguage = user.currentLanguage.code || user.currentLanguage.name || null;
            }

            await user.save();
        }

        // Create JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        res.json({
            message: 'Social login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                xp: user.xp,
                level: user.level,
                hearts: user.hearts,
                streak: user.streak,
                leagueTier: user.leagueTier,
                nativeLanguage: user.nativeLanguage,
                currentLanguage: user.currentLanguage
            }
        });
    } catch (error) {
        console.error('Social login error FULL:', error.message);
        console.error('Error name:', error.name);
        console.error('Error stack:', error.stack?.substring(0, 500));
        res.status(500).json({ error: error.message || 'Social login failed' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = req.user;

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                xp: user.xp,
                level: user.level,
                hearts: user.hearts,
                heartsRefillTime: user.heartsRefillTime,
                streak: user.streak,
                streakFreezes: user.streakFreezes,
                leagueTier: user.leagueTier,
                weeklyXP: user.weeklyXP,
                nativeLanguage: user.nativeLanguage,
                learningLanguages: user.learningLanguages,
                currentLanguage: user.currentLanguage,
                friends: user.friends
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, avatar, nativeLanguage, currentLanguage } = req.body;
        const user = req.user;

        if (name) user.name = name;
        if (avatar) user.avatar = avatar;
        if (nativeLanguage) user.nativeLanguage = nativeLanguage;
        if (currentLanguage) {
            user.currentLanguage = currentLanguage;

            // Add to learning languages if not already there
            if (!user.learningLanguages.includes(currentLanguage)) {
                user.learningLanguages.push(currentLanguage);

                // Create initial progress entry for this language
                const progress = new Progress({
                    user: user._id,
                    language: currentLanguage,
                    unlockedLessons: ['beginner_1_1'] // Unlock first lesson
                });
                await progress.save();
            }
        }

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                avatar: user.avatar,
                nativeLanguage: user.nativeLanguage,
                currentLanguage: user.currentLanguage,
                learningLanguages: user.learningLanguages
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Delete account (PERMANENT)
router.delete('/delete', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = req.user;

        // Delete all user-related data
        // 1. Delete all progress records
        await Progress.deleteMany({ user: userId });

        // 2. Delete all conversations
        const Conversation = require('../models/Conversation');
        await Conversation.deleteMany({ user: userId });

        // 3. Remove user from friends' friend lists
        const FriendRequest = require('../models/FriendRequest');
        await User.updateMany(
            { friends: userId },
            { $pull: { friends: userId } }
        );

        // 4. Delete all friend requests (sent and received)
        await FriendRequest.deleteMany({
            $or: [{ from: userId }, { to: userId }]
        });

        // 5. Delete vocabulary records
        const Vocabulary = require('../models/Vocabulary');
        await Vocabulary.deleteMany({ user: userId });

        // 6. Finally, delete the user account
        await User.findByIdAndDelete(userId);

        console.log(`Account deleted: ${user.email} (${user.name})`);

        res.json({
            message: 'Account deleted successfully',
            deletedUser: {
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;
