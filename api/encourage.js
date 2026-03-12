// Serverless function for /api/encourage
export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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
}
