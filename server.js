// Use require syntax for compatibility with current Node.js setup
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const { AzureOpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Generate system prompt from mood scores
function generateSystemPrompt(calm, confidence, impulsivity) {
    let tone = "balanced";
    if (calm < 3) tone = "soothing";
    if (impulsivity >= 4) tone = "cautious";
    if (confidence > 4) tone = "direct";

    return `
        You are a ${tone} professional financial advisor.
        To be specific, you are a personalized financial advisor that works as a bot for a hedge fund company.
        You will leverage the users mood to instruct the user on how to trade smartly and wisely. 
        Use psychological tactics to help the user make better decisions.
        Examples of what your roles look like:
        Cognitive Restructuring
        •    Socratic questioning when emotional language appears (“Why do you believe this trade is ‘sooner or later going to fail’?”).
        •    Positive-self-talk scripts and “if-then” planning (“If I feel FOMO, then I’ll review my trading plan”).
        Mindfulness & Stress Management
        •    Short guided breathing or visualization breaks on demand (“Let’s do a 2-minute box-breathing session”).
        •    Adaptive reminders when market volatility spikes.
        Always provide clear and concise responses to all of the user's questions.
        The user feels ${calm < 3 ? "anxious" : calm > 4 ? "calm" : "neutral"},
        ${confidence > 4 ? "confident" : confidence < 3 ? "uncertain" : "neutral"},
        and ${impulsivity > 4 ? "impulsive" : impulsivity < 3 ? "deliberate" : "neutral"}.
        Adapt your tone and guidance based on this emotional profile.
        Your responses should be very detailed and organized.
    `;
}

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;
const deployment = process.env.AZURE_DEPLOYMENT_NAME;
const apiVersion = "2024-04-01-preview";

const client = new AzureOpenAI({ endpoint, apiKey, deployment, apiVersion });

console.log('AZURE_OPENAI_ENDPOINT:', endpoint);
console.log('AZURE_OPENAI_KEY:', apiKey ? '[REDACTED]' : '[NOT SET]');
console.log('AZURE_DEPLOYMENT_NAME:', deployment);

// Chat endpoint with GPT-4o call
app.post('/api/chat', async (req, res) => {
    const { message, personality } = req.body;
    console.log('Received /api/chat request:', { message, personality });
    if (!message || !personality) {
        return res.status(400).json({ error: 'Missing message or personality data' });
    }

    const calm = parseInt(personality.calm);
    const confidence = parseInt(personality.confidence);
    const impulsivity = parseInt(personality.impulsive);

    const systemPrompt = generateSystemPrompt(calm, confidence, impulsivity);

    try {
        const response = await client.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            max_tokens: 4096,
            temperature: 1,
            top_p: 1,
            model: deployment
        });
        console.log('Azure OpenAI response:', response);
        res.json({ reply: response.choices[0].message.content });
    } catch (err) {
        console.error('Azure OpenAI error:', err);
        res.status(500).json({ error: 'Failed to generate response from GPT-4o' });
    }
});

app.listen(PORT, () => {
    console.log(`Finance Bot backend running on port ${PORT}`);
}); 

