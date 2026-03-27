const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// MongoDB connection
const mongoUri = process.env.MONGODB_URI;
let db;

async function connectMongo() {
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db('lhf_forest');
    console.log('Connected to MongoDB');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
app.post('/api/submit', async (req, res) => {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'No message provided' });
    }
    
    try {
        const collection = db.collection('messages');

        // Format date as dd/mm/yy
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const timeTag = `${day}/${month}/${year}`;
        
        // Get next user index
        const lastMessage = await collection.findOne({}, { sort: { userIndex: -1 } });
        const userIndex = lastMessage ? lastMessage.userIndex + 1 : 1;
        
        // Create and insert message
        const message = {
            userIndex,
            content: text,
            timeTag,
            createdAt: new Date()
        };
        
        await collection.insertOne(message);
        
        console.log(`Message #${userIndex} saved to MongoDB`);
        
        res.json({ success: true, userIndex });
    } catch (error) {
        console.error('Failed to save message:', error);
        res.status(500).json({ error: 'Failed to save message' });
    }
});

// Endpoint to get all messages
app.get('/api/messages', async (req, res) => {
    try {
        const collection = db.collection('messages');
        const messages = await collection
            .find({}, { projection: { _id: 0, userIndex: 1, content: 1, timeTag: 1 } })
            .sort({ userIndex: 1 })
            .toArray();
        res.json(messages);
    } catch (error) {
        console.error('Failed to fetch messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

connectMongo().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});
