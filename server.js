const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Messages file path
const messagesFile = path.join(__dirname, 'messages.json');

// Load existing messages or create empty array
let messages = [];
if (fs.existsSync(messagesFile)) {
    try {
        messages = JSON.parse(fs.readFileSync(messagesFile, 'utf8'));
    } catch (e) {
        console.error('Error reading messages file, starting fresh:', e);
        messages = [];
    }
}

// Get next user index
function getNextUserIndex() {
    if (messages.length === 0) return 1;
    return Math.max(...messages.map(m => m.userIndex)) + 1;
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Endpoint to get encouragement from ChatGPT
app.post('/api/encourage', async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }
    
    const { text } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'No text provided' });
    }
    
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a gentle, encouraging writing companion. The user is writing a personal reflection and has paused. Your role is NOT to suggest specific content or tell them what to write next. Instead, either:
1. Offer gentle encouragement to keep going (e.g., "Your words carry weight, keep going" or "Let the thoughts flow naturally")
2. Provide a soft guiding nudge about the writing process itself (e.g., "Take your time, there's no rush" or "Trust where your pen leads you")

Rules:
- Maximum 12 words
- Never use quotation marks in your response
- Never suggest specific topics or content to write about
- Be warm, and supportive, speak plainly and kindly
- Don't ask questions
- Text marked with ~~strikethrough~~ was crossed out by the user - acknowledge the courage it takes to write and revise`
                    },
                    {
                        role: 'user',
                        content: `Here's what I've written so far: ${text}`
                    }
                ],
                max_tokens: 50,
                temperature: 0.9
            })
        });
        
        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            res.json({ message: data.choices[0].message.content });
        } else if (data.error) {
            console.error('OpenAI API Error:', data.error);
            res.status(500).json({ error: data.error.message });
        }
    } catch (error) {
        console.error('Failed to fetch encouragement:', error);
        res.status(500).json({ error: 'Failed to get encouragement' });
    }
});

// Endpoint to submit a message
app.post('/api/submit', (req, res) => {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'No message provided' });
    }
    
    try {
        // Format date as dd/mm/yy
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const timeTag = `${day}/${month}/${year}`;
        
        const userIndex = getNextUserIndex();
        
        // Create message object
        const message = {
            userIndex: userIndex,
            content: text,
            timeTag: timeTag
        };
        
        // Add to messages array
        messages.push(message);
        
        // Save to JSON file
        fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
        
        console.log(`Message #${userIndex} saved`);
        
        res.json({ success: true, userIndex: userIndex });
    } catch (error) {
        console.error('Failed to save message:', error);
        res.status(500).json({ error: 'Failed to save message' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
