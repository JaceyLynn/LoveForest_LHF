// Serverless function for /api/submit — persists messages to MongoDB
const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI environment variable is not set');
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('lhf_forest');
    cachedClient = client;
    cachedDb = db;
    return { client, db };
}

module.exports = async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text } = req.body;

    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'No message provided' });
    }

    try {
        const { db } = await connectToDatabase();
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
        console.error('Failed to save message:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to save message', detail: error.message });
    }
}
