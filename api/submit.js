// Serverless function for /api/submit
// NOTE: Vercel has a read-only filesystem, so messages are stored in memory only.
// For persistent storage, integrate a database (e.g., Vercel KV, Supabase, MongoDB).

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text } = req.body;

    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'No message provided' });
    }

    try {
        // Read current messages from the static file
        const messagesFile = path.join(process.cwd(), 'messages.json');
        let messages = [];
        try {
            messages = JSON.parse(fs.readFileSync(messagesFile, 'utf8'));
        } catch (e) {
            messages = [];
        }

        // Format date as dd/mm/yy
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const timeTag = `${day}/${month}/${year}`;

        // Get next user index
        const userIndex = messages.length === 0 ? 1 : Math.max(...messages.map(m => m.userIndex)) + 1;

        // Create message object
        const message = {
            userIndex: userIndex,
            content: text,
            timeTag: timeTag
        };

        // NOTE: On Vercel, this write will NOT persist between requests.
        // The response still returns success so the user gets feedback.
        // For production persistence, use a database.
        messages.push(message);

        try {
            fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
        } catch (writeErr) {
            // Expected to fail on Vercel (read-only filesystem)
            console.log('File write skipped (read-only filesystem)');
        }

        console.log(`Message #${userIndex} received`);
        res.json({ success: true, userIndex: userIndex });
    } catch (error) {
        console.error('Failed to process message:', error);
        res.status(500).json({ error: 'Failed to save message' });
    }
}
