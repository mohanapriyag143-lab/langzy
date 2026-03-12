# Groq API Setup Guide

## 🚀 Get Your FREE Groq API Key

### Step 1: Visit Groq Console
Go to: **https://console.groq.com/**

### Step 2: Sign Up (FREE!)
- Click "Sign Up" or "Get Started"
- Use your email (no credit card needed!)
- Verify your email

### Step 3: Create API Key
1. Once logged in, go to **API Keys** section
2. Click **"Create API Key"**
3. Give it a name (e.g., "LangZy")
4. Copy the API key (looks like: `gsk_...`)

### Step 4: Add to Your Project
1. Open: `C:\Users\MOHANA\OneDrive\Desktop\CHATBOT\backend\.env`
2. Replace this line:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```
   With:
   ```
   GROQ_API_KEY=gsk_your_actual_key_here
   ```

### Step 5: Restart Backend
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

## ✅ Benefits of Groq

- ✅ **100% FREE** - No credit card required
- ✅ **Super Fast** - Fastest inference in the world!
- ✅ **6000 requests/minute** - More than enough
- ✅ **Better Tamil/Hindi support** - Multilingual model
- ✅ **No installation** - Cloud-based, works anywhere

## 🎯 What Changed

- ❌ Removed: Ollama (local, slow, needs installation)
- ✅ Added: Groq API (cloud, fast, free)
- ✅ Model: llama-3.3-70b-versatile (best for conversations)

## 📝 Quick Start

1. Get API key from: https://console.groq.com/
2. Add to `.env` file
3. Restart backend server
4. Chat in Tamil/Hindi/Spanish/etc!

**That's it!** Your AI chatbot will work perfectly! 🎉
