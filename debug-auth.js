
require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

console.log("🔍 Checking Environment Variables...");
if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY is missing in .env.local");
    process.exit(1);
} else {
    console.log("✅ ANTHROPIC_API_KEY found (starts with: " + process.env.ANTHROPIC_API_KEY.substring(0, 7) + "...)");
}

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

async function testConnection() {
    console.log("📡 Testing Anthropic API Connection...");
    try {
        const message = await anthropic.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hello' }],
        });
        console.log("✅ Connection Successful!");
        console.log("📝 Response:", message.content[0].text);
    } catch (error) {
        console.error("💥 Connection Failed:", error.message);
        if (error.status === 401) {
            console.error("🔑 Error 401: Invalid API Key. Please check your key.");
        }
    }
}

testConnection();
