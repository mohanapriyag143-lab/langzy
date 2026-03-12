const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Translate a single word with context
router.post('/word', auth, async (req, res) => {
    try {
        const { word, sourceLang, targetLang, context } = req.body;

        if (!word || !sourceLang || !targetLang) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const prompt = `You are a language learning assistant. Translate the word "${word}" from ${sourceLang} to ${targetLang}.
${context ? `Context: "${context}"` : ''}

Provide:
1. Translation: The ${targetLang} translation
2. Pronunciation: IPA notation in brackets
3. Part of Speech: (noun, verb, adjective, etc.)
4. Definition: Brief definition in ${targetLang}
5. Example: One simple example sentence using this word in ${sourceLang}
6. Example Translation: Translation of the example in ${targetLang}

Format your response as JSON:
{
  "word": "${word}",
  "translation": "translated word",
  "pronunciation": "[IPA]",
  "partOfSpeech": "noun/verb/etc",
  "definition": "definition",
  "example": "example sentence in ${sourceLang}",
  "exampleTranslation": "example in ${targetLang}"
}`;

        const response = await axios.post(
            GROQ_API_URL,
            {
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 500
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiResponse = response.data.choices[0].message.content;

        // Try to parse JSON response
        let wordData;
        try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
            wordData = JSON.parse(jsonStr);
        } catch (parseError) {
            // If parsing fails, create structured response from text
            wordData = {
                word,
                translation: aiResponse.split('\n')[0],
                pronunciation: '',
                partOfSpeech: '',
                definition: aiResponse,
                example: '',
                exampleTranslation: ''
            };
        }

        res.json(wordData);
    } catch (error) {
        console.error('Word translation error:', error);
        res.status(500).json({ error: 'Failed to translate word' });
    }
});

// Get word breakdown (etymology, prefix/suffix analysis)
router.get('/breakdown/:word', auth, async (req, res) => {
    try {
        const { word } = req.params;
        const { language } = req.query;

        if (!word || !language) {
            return res.status(400).json({ error: 'Missing word or language' });
        }

        const prompt = `Analyze the word "${word}" in ${language}. Provide:
1. Etymology: Origin and history of the word
2. Root: The root word or stem
3. Prefix: Any prefix (if applicable)
4. Suffix: Any suffix (if applicable)
5. Related Words: 3-5 related words in the same family
6. Memory Tip: A helpful mnemonic or memory trick to remember this word

Format as JSON:
{
  "word": "${word}",
  "etymology": "origin and history",
  "root": "root word",
  "prefix": "prefix or null",
  "suffix": "suffix or null",
  "relatedWords": ["word1", "word2", "word3"],
  "memoryTip": "helpful tip to remember"
}`;

        const response = await axios.post(
            GROQ_API_URL,
            {
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 600
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiResponse = response.data.choices[0].message.content;

        let breakdown;
        try {
            const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
            breakdown = JSON.parse(jsonStr);
        } catch (parseError) {
            breakdown = {
                word,
                etymology: aiResponse,
                root: word,
                prefix: null,
                suffix: null,
                relatedWords: [],
                memoryTip: ''
            };
        }

        res.json(breakdown);
    } catch (error) {
        console.error('Word breakdown error:', error);
        res.status(500).json({ error: 'Failed to get word breakdown' });
    }
});

module.exports = router;
