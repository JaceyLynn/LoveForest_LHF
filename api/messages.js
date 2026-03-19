// Serverless function for /api/messages — fetches all messages from MongoDB
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
    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { db } = await connectToDatabase();
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
}
