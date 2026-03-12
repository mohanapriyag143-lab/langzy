const axios = require('axios');
require('dotenv').config();

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
1. **REACTION FIRST**: Before replying, identify the USER'S INTENT. If they ask a question, ANSWER it. If they greet you, GREET back.
2. **DO NOT MIRROR**: Never repeat the user's message. Provide a logical and natural follow-up response like a human would.
3. **ACT AS A PERSON**: You are NOT a translation tool. Do not just translate what the user says.
${scriptRequirement}
4. **RESPONSE FORMAT (STRICT)**: You MUST format your response exactly like this: 
   [Target Language Script] | [English Transliteration/Voice Text] | [English Translation]
   *Example*: வணக்கம் | Vanakkam | Hello
5. **KEEP IT SHORT**: Max 1-2 short sentences.
6. **STAY ENGAGED**: End your response with a short, relevant question to keep the user talking.

Remember: Be warm, be helpful, and talk like a real person!`;
};

async function testTamilChat() {
    console.log('Testing Tamil AI Chat...');
    const language = 'Tamil';
    const message = 'Vanakkam, epadi irukeenga?'; // Hello, how are you?
    const systemPrompt = getSystemPrompt(language, 'beginner', 'general', 'English');

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 100
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('--- AI Response ---');
        console.log(response.data.choices[0].message.content);
        console.log('-------------------');

        const aiResponse = response.data.choices[0].message.content;
        if (aiResponse.includes('|')) {
            console.log('✅ Response format is correct (contains |)');
            const parts = aiResponse.split('|');
            if (parts.length >= 3) {
                console.log('✅ Response has all 3 parts (Script | Transliteration | Translation)');
            } else {
                console.log('❌ Response format missing parts');
            }
        } else {
            console.log('❌ Response format is incorrect (missing |)');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testTamilChat();
