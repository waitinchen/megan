require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Dummy model to get client? No, need to use model manager if available, or just try-catch.
        // Actually SDK doesn't have listModels on client directly in some versions.
        // Let's try to use the API directly via fetch if SDK fails, but SDK should have it.
        // Checking SDK docs... usually it's not exposed easily in the high-level client.
        // But we can try a known valid model 'gemini-1.5-flash' and see if it works.

        console.log("Testing gemini-1.5-flash...");
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await modelFlash.generateContent("Hello");
        console.log("gemini-1.5-flash works!", await result.response.text());

    } catch (error) {
        console.error("Error:", error.message);
    }
}

listModels();
