// Serverless function for /api/messages — fetches all messages from MongoDB
const { connectToDatabase } = require('./lib/mongodb');

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
