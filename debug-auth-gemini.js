
require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log("🔍 Checking Environment Variables...");
if (!process.env.GOOGLE_API_KEY) {
    console.error("❌ GOOGLE_API_KEY is missing in .env.local");
    process.exit(1);
} else {
    console.log("✅ GOOGLE_API_KEY found (starts with: " + process.env.GOOGLE_API_KEY.substring(0, 7) + "...)");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function testConnection() {
    console.log("📡 Testing Google Gemini API Connection...");

    const candidates = [
        "gemini-1.5-flash",
        "gemini-pro-latest",
        "gemini-2.5-pro",
        "models/gemini-2.5-pro",
        "gemini-1.5-flash" // Keep just in case
    ];

    for (const modelName of candidates) {
        console.log(`👉 Trying model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`✅ SUCCESS: ${modelName} works!`);
            console.log("📝 Response:", result.response.text());
            return; // Stop after first success
        } catch (error) {
            console.error(`❌ ${modelName} failed:`, error.message);
        }
    }
    console.error("💥 All models failed.");
}

testConnection();
