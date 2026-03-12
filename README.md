# 🌍 LangZy - AI Language Learning Chatbot

A comprehensive Duolingo-style language learning platform with AI-powered conversational practice, gamification, and support for 20+ languages.

## ✨ Features

### 🎯 Core Features
- **20+ Languages**: Spanish, French, German, Italian, Portuguese, Dutch, Swedish, Norwegian, Danish, Polish, Russian, Greek, Turkish, Tamil, Hindi, Japanese, Chinese, Korean, Thai, Vietnamese, Indonesian, Arabic, English
- **AI Conversational Practice**: Natural conversations with Ollama AI in your target language
- **Voice Chat**: Speech-to-text and text-to-speech for realistic spoken practice
- **Scenario-Based Learning**: Restaurant, travel, shopping, business, and casual conversations

### 🎮 Gamification
- **XP & Levels**: Earn XP for activities, level up from 1-100
- **Hearts System**: 5 hearts, lose them on mistakes (Duolingo-style)
- **Streaks**: Daily practice streaks with freeze protection
- **Achievements**: 50+ badges to unlock
- **Leaderboards**: Weekly/monthly global and friend rankings
- **League System**: Bronze, Silver, Gold, Diamond, Legendary tiers
- **Daily Challenges**: Special tasks with bonus XP rewards

### 📚 Learning Features
- **Structured Courses**: Beginner, Intermediate, Advanced levels
- **Multi-Type Quizzes**: Multiple choice, fill-in-blanks, speaking, listening, match pairs
- **Vocabulary Building**: Flashcards with spaced repetition algorithm
- **Grammar Tips**: Contextual explanations during exercises
- **Progress Tracking**: Detailed statistics per language
- **Adaptive Difficulty**: AI adjusts based on your performance

### 👥 Social Features
- **Friends System**: Add friends and compare progress
- **Friend Leaderboards**: Compete with your friends
- **Activity Feed**: See what your friends are learning

## 🚀 Tech Stack

### Backend
- **Node.js** + **Express**: RESTful API server
- **MongoDB**: Database for users, progress, courses
- **Ollama**: Local AI for language conversations
- **JWT**: Authentication and authorization
- **bcryptjs**: Password hashing

### Frontend
- **Vanilla HTML/CSS/JS**: No framework needed
- **Modern Dark Theme**: Duolingo-inspired design with purple/blue gradients
- **Responsive**: Works on desktop, tablet, and mobile
- **Voice API**: Web Speech API for voice features

## 📋 Prerequisites

Before running this application, ensure you have:

1. **Node.js** (v16 or higher)
   ```bash
   node --version
   ```

2. **MongoDB** (Local or Cloud)
   - Local: [Download MongoDB](https://www.mongodb.com/try/download/community)
   - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

3. **Ollama** (for AI chat)
   ```bash
   # Install Ollama from https://ollama.ai
   # Pull a model (llama2 recommended)
   ollama pull llama2
   
   # Start Ollama server
   ollama serve
   ```

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/langzy
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
OLLAMA_API_URL=http://localhost:11434
```

**Important**: Change `JWT_SECRET` to a secure random string in production!

### 3. Start MongoDB

If using local MongoDB:
```bash
# Start MongoDB service
mongod
```

If using MongoDB Atlas, update `MONGODB_URI` with your connection string.

### 4. Start Ollama

```bash
# In a separate terminal
ollama serve
```

### 5. Start Backend Server

```bash
cd backend
npm start
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
📚 API available at http://localhost:5000/api
🔧 Ollama URL: http://localhost:11434
```

### 6. Open Frontend

Open `public/index.html` in your browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server public -p 8000
```

Then visit: `http://localhost:8000`

## 📱 Usage

### 1. Create Account
- Open the app and click "Sign up"
- Enter your name, email, password
- Select your native language
- Click "Create Account"

### 2. Choose Language
- Select from 20+ available languages
- Languages are organized by region (European, Asian, Other)
- Use search to find specific languages

### 3. Start Learning
- **AI Chat**: Practice conversations with difficulty levels (beginner/intermediate/advanced)
- **Scenarios**: Choose specific situations (restaurant, travel, shopping, etc.)
- **Voice**: Click 🎤 to use voice input, AI responses can auto-speak
- **Courses**: Complete structured lessons with quizzes
- **Vocabulary**: Learn and review words with spaced repetition

### 4. Track Progress
- View your XP, level, and streak
- Monitor hearts (refill every 5 hours or daily)
- Check achievements and leaderboards
- Complete daily challenges for bonus XP

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### AI Chat
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/history` - Get conversation history
- `DELETE /api/chat/clear` - Clear history
- `POST /api/chat/scenario` - Start scenario conversation

### Progress
- `GET /api/progress` - Get all progress
- `GET /api/progress/:language` - Get language progress
- `POST /api/progress/update` - Update progress

### Lessons & Courses
- `GET /api/lessons/:language` - Get courses
- `GET /api/lessons/:language/:courseId/:lessonId` - Get lesson
- `POST /api/lessons/complete` - Complete lesson

### Gamification
- `GET /api/achievements` - Get achievements
- `GET /api/leaderboard/global/:timeframe` - Global leaderboard
- `GET /api/leaderboard/friends` - Friend leaderboard
- `GET /api/challenges/daily` - Get daily challenge

### Social
- `POST /api/friends/add` - Send friend request
- `POST /api/friends/accept/:requestId` - Accept request
- `GET /api/friends` - Get friends list

## 🔧 Troubleshooting

### Ollama not responding
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve
```

### MongoDB connection failed
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

### Hearts not refilling
Hearts refill automatically after 5 hours when depleted. Check `user.heartsRefillTime` in the database.

### AI responds in English instead of target language
The AI system prompt explicitly instructs to reply only in the target language. If this happens:
- Check that the language is correctly set
- Try using a different Ollama model (e.g., `ollama pull mistral`)
- Increase the difficulty level for more natural responses

## 🎨 Customization

### Add New Languages
1. Add language to `public/app.js` in `LANGUAGES` object
2. Add language-specific prompts in `backend/routes/chat.js`

### Create Custom Achievements
1. Add achievement to database:
```javascript
const achievement = new Achievement({
  achievementId: 'custom_id',
  title: 'Achievement Title',
  description: 'Description',
  category: 'streak',
  unlockCriteria: { type: 'streak_days', value: 7 },
  xpReward: 100
});
```

### Modify Gamification
- Edit XP rewards in lesson completion routes
- Adjust hearts loss in `backend/routes/lessons.js`
- Modify streak logic in `backend/routes/auth.js`

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes!

## 🙏 Credits

- **Ollama**: Local AI inference
- **MongoDB**: Database
- **Express**: Web framework
- Inspired by **Duolingo**'s gamification design

## 🤝 Contributing

Contributions welcome! Feel free to:
- Add new languages
- Create more lesson content
- Improve AI prompts
- Add new quiz types
- Enhance UI/UX

---

**Happy Learning! 🎓🌍**

Built with ❤️ using AI-powered language learning
