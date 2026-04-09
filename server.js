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

// Start server immediately; connect to MongoDB if URI is configured
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

if (mongoUri) {
    connectMongo().catch(err => {
        console.error('Failed to connect to MongoDB:', err);
    });
} else {
    console.warn('MONGODB_URI not set — API routes will be unavailable, but static files are served.');
}
