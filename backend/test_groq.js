const axios = require('axios');
require('dotenv').config();

async function testGroq() {
    console.log('Testing Groq API Key...');
    console.log('Key:', process.env.GROQ_API_KEY ? 'Present (starts with ' + process.env.GROQ_API_KEY.substring(0, 7) + ')' : 'Missing');

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: 'Say "Active"' }],
                max_tokens: 10
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ API is working!');
        console.log('Response:', response.data.choices[0].message.content);
    } catch (error) {
        console.error('❌ API Error:', error.response ? error.response.status : error.message);
        if (error.response && error.response.data) {
            console.error('Error Details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testGroq();
