const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Send friend request
router.post('/add', auth, async (req, res) => {
    try {
        const { friendEmail } = req.body;
        const userId = req.userId;
        const user = req.user;

        if (user.email === friendEmail) {
            return res.status(400).json({ error: 'Cannot add yourself as friend' });
        }

        const friend = await User.findOne({ email: friendEmail });

        if (!friend) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already friends
        if (user.friends.includes(friend._id)) {
            return res.status(400).json({ error: 'Already friends' });
        }

        // Check if request already exists
        const existingRequest = friend.friendRequests.find(
            req => req.from.toString() === userId.toString() && req.status === 'pending'
        );

        if (existingRequest) {
            return res.status(400).json({ error: 'Friend request already sent' });
        }

        // Add friend request
        friend.friendRequests.push({
            from: userId,
            status: 'pending'
        });

        await friend.save();

        res.json({ message: 'Friend request sent' });
    } catch (error) {
        console.error('Send friend request error:', error);
        res.status(500).json({ error: 'Failed to send friend request' });
    }
});

// Accept friend request
router.post('/accept/:requestId', auth, async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.userId;
        const user = req.user;

        const request = user.friendRequests.id(requestId);

        if (!request || request.status !== 'pending') {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        const friend = await User.findById(request.from);

        if (!friend) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Add to friends list
        user.friends.push(friend._id);
        friend.friends.push(userId);

        // Update request status
        request.status = 'accepted';

        await user.save();
        await friend.save();

        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error('Accept friend request error:', error);
        res.status(500).json({ error: 'Failed to accept friend request' });
    }
});

// Get friends list
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId)
            .populate('friends', 'name email avatar xp level streak weeklyXP leagueTier');

        res.json({ friends: user.friends });
    } catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({ error: 'Failed to get friends' });
    }
});

// Get friend requests
router.get('/requests', auth, async (req, res) => {
    try {
        const user = req.user;

        const pendingRequests = user.friendRequests.filter(req => req.status === 'pending');

        // Populate friend details
        await User.populate(pendingRequests, {
            path: 'from',
            select: 'name email avatar xp level'
        });

        res.json({ requests: pendingRequests });
    } catch (error) {
        console.error('Get friend requests error:', error);
        res.status(500).json({ error: 'Failed to get friend requests' });
    }
});

// Remove friend
router.delete('/:friendId', auth, async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.userId;
        const user = req.user;

        const friend = await User.findById(friendId);

        if (!friend) {
            return res.status(404).json({ error: 'Friend not found' });
        }

        // Remove from both sides
        user.friends = user.friends.filter(id => id.toString() !== friendId);
        friend.friends = friend.friends.filter(id => id.toString() !== userId.toString());

        await user.save();
        await friend.save();

        res.json({ message: 'Friend removed' });
    } catch (error) {
        console.error('Remove friend error:', error);
        res.status(500).json({ error: 'Failed to remove friend' });
    }
});

module.exports = router;
