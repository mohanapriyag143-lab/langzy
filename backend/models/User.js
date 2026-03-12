const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
  },
  // Learning preferences
  nativeLanguage: {
    type: String,
    default: 'English'
  },
  learningLanguages: [{
    type: String
  }],
  currentLanguage: {
    type: String,
    default: null
  },

  // Gamification
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 100
  },
  hearts: {
    type: Number,
    default: 5,
    min: 0,
    max: 5
  },
  heartsRefillTime: {
    type: Date,
    default: null
  },

  // Streaks
  streak: {
    type: Number,
    default: 0
  },
  streakFreezes: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date,
    default: Date.now
  },

  // League system
  leagueTier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Diamond', 'Legendary'],
    default: 'Bronze'
  },
  weeklyXP: {
    type: Number,
    default: 0
  },

  // Social
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  socialProvider: {
    type: String,
    enum: ['google', 'microsoft', 'demo', 'demo_ms', null],
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Calculate level from XP
userSchema.methods.calculateLevel = function () {
  // Simple formula: level = floor(XP / 100) + 1, max 100
  const newLevel = Math.min(Math.floor(this.xp / 100) + 1, 100);
  this.level = newLevel;
  return newLevel;
};

// Refill hearts if needed
userSchema.methods.refillHearts = function () {
  const now = new Date();

  if (this.hearts < 5) {
    if (!this.heartsRefillTime) {
      // Set refill time to 5 hours from now
      this.heartsRefillTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    } else if (now >= this.heartsRefillTime) {
      // Refill hearts
      this.hearts = 5;
      this.heartsRefillTime = null;
    }
  }

  return this.hearts;
};

module.exports = mongoose.model('User', userSchema);
