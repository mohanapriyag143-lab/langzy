const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Progress = require('../models/Progress');

// Language-specific system prompts for conversational AI
const getSystemPrompt = (language, difficulty, scenario, nativeLanguage) => {
    const scenarioContext = {
        general: `You are a friendly, enthusiastic language tutor who loves helping people learn ${language}. You're patient, encouraging, and make learning fun.`,
        restaurant: `You are a cheerful waiter/waitress at a local restaurant. You're helping a customer order food in ${language}. Be friendly and helpful, just like a real server would be.`,
        travel: `You are a friendly local guide who loves showing tourists around. You're helping someone navigate and explore in ${language}. Be warm and welcoming.`,
        shopping: `You are a helpful shop assistant who enjoys helping customers. You're assisting someone shopping in ${language}. Be polite and attentive.`,
        business: `You are a professional colleague having a business conversation in ${language}. Be respectful and professional, but still friendly.`,
        dating: `You are someone the user just met and is having a casual, friendly conversation with in ${language}. Be natural and engaging.`
    };

    const difficultyLevel = {
        beginner: 'Use very simple, everyday words. Keep sentences short and clear. Speak like you would to a friend who is just starting to learn.',
        intermediate: 'Use natural, everyday language. Mix simple and moderate vocabulary. Speak like you would in a normal conversation.',
        advanced: 'Use native-level vocabulary with idioms and expressions. Speak like you would with a fluent friend.'
    };

    let scriptRequirement = '';
    if (language === 'Tamil') {
        scriptRequirement = `
        - **TAMIL CONVERSATIONAL IDENTITY**: 
          - You are a native Tamil speaker. Use a mix of formal (for respectful greetings) and colloquial (for natural chat).
          - If the user says "Saptiyaa" (Have you eaten?), respond naturally like "சாப்பிட்டேன்" (Saappittaen) or "சாப்டேன்" (Sapten). 
          - Correct example: "சாப்பிட்டேன், நீங்க சாப்பிட்டீங்களா? | Saappittaen, neenga saappitteengala? | I ate, have you eaten?"
          - If the user says "Vanakkam", respond with "வணக்கம்! நலமா? | Vanakkam! Nalama? | Hello! How are you?".
          - If the user says "Nandri", respond with "பரவாயில்லை" (Paravaillai) or "மகிழ்ச்சி" (Magizhchi).
          - Use "என்ன சாப்பிட்டீங்க?" (Enna saappitteenga?) or "என்ன பண்றீங்க?" (Enna panreenga?) for natural small talk.
        - **SCRIPT REQUIREMENTS**:
          - ALWAYS provide responses in this order: [Tamil Script] | [English Transliteration] | [English Translation].
          - You MUST use correct Tamil spelling without any typos.
        `;
    }

    return `${scenarioContext[scenario] || scenarioContext.general} ${difficultyLevel[difficulty] || difficultyLevel.beginner}

CRITICAL CONVERSATIONAL RULES:
1. **TRANSLATE FIRST**: Whatever the user says in ANY language, FIRST translate it into ${language}. Show the translation clearly.
2. **REACTION NEXT**: After translating, respond naturally in ${language} like a real person would.
3. **EMOTIONAL MESSAGES**: If the user says "I love you", "I like you", "you're great" etc., respond warmly and naturally. NEVER say "நன்றி/Nandri/Thank you" as a response to emotional compliments — it sounds wrong.
4. **ACT AS A PERSON**: Be natural and conversational, not robotic.
${scriptRequirement}
5. **RESPONSE FORMAT (STRICT)**: You MUST format EVERY response exactly like this:
   📝 Translation: [What the user said, translated into ${language} script] | [Transliteration] | [English meaning]
   💬 Reply: [Your natural conversational reply in ${language}] | [Transliteration] | [English meaning]
6. **KEEP IT SHORT**: Max 1-2 short sentences per section.
7. **STAY ENGAGED**: End your reply with a short, relevant question to keep the user talking.

Remember: Always translate what the user says, then have a real conversation!`;
};


// Send message to AI
router.post('/message', auth, async (req, res) => {
    try {
        const { message, language, difficulty, scenario } = req.body;
        const userId = req.userId;
        const user = req.user;

        if (!message || !language) {
            return res.status(400).json({ error: 'Message and language are required' });
        }

        // Find or create active conversation
        let conversation = await Conversation.findOne({
            user: userId,
            language,
            isActive: true,
            scenario: scenario || 'general'
        });

        if (!conversation) {
            conversation = new Conversation({
                user: userId,
                language,
                difficulty: difficulty || 'beginner',
                scenario: scenario || 'general',
                messages: []
            });
        }

        // Add user message
        conversation.messages.push({
            role: 'user',
            content: message
        });

        // Get system prompt
        const systemPrompt = getSystemPrompt(
            language,
            difficulty || conversation.difficulty,
            scenario || conversation.scenario,
            user.nativeLanguage
        );

        // Prepare messages for Ollama
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversation.messages.slice(-10).map(m => ({ // Last 10 messages for context
                role: m.role,
                content: m.content
            }))
        ];

        // Call Groq API (faster and more reliable than Ollama)
        try {
            const groqResponse = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: 'llama-3.3-70b-versatile', // Fast multilingual model
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 500
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30 second timeout
                }
            );

            const aiMessage = groqResponse.data.choices[0].message.content;

            // Add AI response to conversation
            conversation.messages.push({
                role: 'assistant',
                content: aiMessage
            });

            await conversation.save();

            // Update progress - speaking skill
            let progress = await Progress.findOne({ user: userId, language });
            if (progress) {
                progress.skillStrength.speaking = Math.min(
                    progress.skillStrength.speaking + 1,
                    100
                );
                await progress.save();
            }

            // Award XP to user
            const xpAward = 5;
            user.xp += xpAward;
            user.calculateLevel();
            await user.save();

            res.json({
                message: aiMessage,
                conversationId: conversation._id
            });

        } catch (groqError) {
            console.error('Groq API error:', groqError.message);

            // Fallback response if Groq API is not available
            const fallbackMessage = language === 'Spanish' ? '¡Hola! Lo siento, estoy teniendo problemas técnicos.' :
                language === 'French' ? 'Bonjour! Désolé, j\'ai des problèmes techniques.' :
                    language === 'German' ? 'Hallo! Entschuldigung, ich habe technische Probleme.' :
                        language === 'Tamil' ? 'வணக்கம்! மன்னிக்கவும், எனக்கு தொழில்நுட்ப சிக்கல் உள்ளது.' :
                            language === 'Hindi' ? 'नमस्ते! क्षमा करें, मुझे तकनीकी समस्या है।' :
                                language === 'Japanese' ? 'こんにちは！すみません、技術的な問題があります。' :
                                    'Hello! Sorry, I\'m having technical difficulties. Please check your Groq API key.';

            res.json({
                message: fallbackMessage,
                error: 'Groq API unavailable. Please check your API key in .env file.',
                conversationId: conversation._id
            });
        }

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get conversation history
router.get('/history', auth, async (req, res) => {
    try {
        const { language, scenario } = req.query;
        const userId = req.userId;

        const query = {
            user: userId,
            isActive: true
        };

        if (language) query.language = language;
        if (scenario) query.scenario = scenario;

        const conversation = await Conversation.findOne(query)
            .sort({ updatedAt: -1 });

        res.json({
            conversation: conversation || null,
            messages: conversation?.messages || []
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Failed to get conversation history' });
    }
});

// Clear conversation history
router.delete('/clear', auth, async (req, res) => {
    try {
        const { language, scenario } = req.query;
        const userId = req.userId;

        await Conversation.updateMany(
            {
                user: userId,
                language,
                scenario: scenario || 'general',
                isActive: true
            },
            {
                isActive: false
            }
        );

        res.json({ message: 'Conversation history cleared' });
    } catch (error) {
        console.error('Clear history error:', error);
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

// Start scenario conversation
router.post('/scenario', auth, async (req, res) => {
    try {
        const { language, scenario, difficulty } = req.body;
        const userId = req.userId;

        if (!language || !scenario) {
            return res.status(400).json({ error: 'Language and scenario are required' });
        }

        // Deactivate previous conversations
        await Conversation.updateMany(
            { user: userId, language, isActive: true },
            { isActive: false }
        );

        // Create new scenario conversation
        const conversation = new Conversation({
            user: userId,
            language,
            difficulty: difficulty || 'beginner',
            scenario,
            messages: []
        });

        await conversation.save();

        // Get greeting based on scenario
        const greetings = {
            restaurant: {
                Spanish: '¡Bienvenido! ¿Qué te gustaría pedir hoy?',
                French: 'Bienvenue! Que souhaitez-vous commander?',
                German: 'Willkommen! Was möchten Sie heute bestellen?',
                Tamil: 'வரவேற்கிறோம்! இன்று என்ன ஆர்டர் செய்ய விரும்புகிறீர்கள்? | Varaverkirom! Indru enna order seyya virumbugirirkal? | Welcome! What would you like to order today?',
                Hindi: 'स्वागत है! आज आप क्या ऑर्डर करना चाहेंगे?'
            },
            travel: {
                Spanish: '¡Hola! ¿Cómo puedo ayudarte hoy?',
                French: 'Bonjour! Comment puis-je vous aider?',
                German: 'Hallo! Wie kann ich Ihnen helfen?',
                Tamil: 'வணக்கம்! இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்? | Vanakkam! Indru naan ungalukku eppadi udhava mudiyum? | Hello! How can I help you today?',
                Hindi: 'नमस्ते! मैं आज आपकी कैसे मदद कर सकता हूँ?'
            },
            shopping: {
                Tamil: 'வணக்கம்! உங்களுக்கு என்ன வேண்டும்? | Vanakkam! Ungalukku enna vendum? | Hello! What do you need?',
            },
            directions: {
                Tamil: 'வணக்கம்! உங்களுக்கு வழி தெரிய வேண்டுமா? | Vanakkam! Ungalukku vazhi theriya venduma? | Hello! Do you need help with directions?',
            },
            hotel: {
                Tamil: 'வணக்கம்! விடுதியில் அறை முன்பதிவு செய்ய வேண்டுமா? | Vanakkam! Vidudhiyil arai munpadhivu seyya venduma? | Hello! Would you like to book a room in the hotel?',
            },
            airport: {
                Tamil: 'வணக்கம்! உங்கள் பயணம் எங்கே? | Vanakkam! Ungal payanam engae? | Hello! Where is your journey to?',
            },
            doctor: {
                Tamil: 'வணக்கம்! உங்களுக்கு என்ன உடம்பு சரியில்லை? | Vanakkam! Ungalukku enna udambu sariyillai? | Hello! What is wrong with your health?',
            },
            social_gathering: {
                Tamil: 'வணக்கம்! உங்களை இங்கே பார்த்ததில் மகிழ்ச்சி. | Vanakkam! Ungalai ingae paarthadhil magizhchi. | Hello! Happy to see you here.',
            },
            phone_call: {
                Tamil: 'ஹலோ! யார் பேசுகிறீர்கள்? | Hello! Yaar pesugireergal? | Hello! Who is speaking?',
            },
            business: {
                Tamil: 'வணக்கம்! உங்களை சந்திப்பதில் மகிழ்ச்சி. | Vanakkam! Ungalai sandhippadhil magizhchi. | Hello! Nice to meet you.',
            },
            dating: {
                Tamil: 'வணக்கம்! நலமா? | Vanakkam! Nalama? | Hello! How are you?',
            }
        };

        const greeting = greetings[scenario]?.[language] || 'Hello! Let\'s practice!';

        res.json({
            message: 'Scenario started',
            conversationId: conversation._id,
            greeting
        });
    } catch (error) {
        console.error('Start scenario error:', error);
        res.status(500).json({ error: 'Failed to start scenario' });
    }
});

module.exports = router;
