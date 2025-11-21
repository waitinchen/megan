require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const SYSTEM_PROMPT = "You are a helpful assistant.";

async function testModel(modelName) {
    console.log(`\n📡 Testing Model: ${modelName}`);
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
    });

    try {
        console.log("👉 Sending message: 'Hello' (using generateContent)");
        const result = await model.generateContent("Hello");
        const response = await result.response;

        console.log("✅ Response Status:", response.promptFeedback ? response.promptFeedback : "No prompt feedback");

        if (response.candidates && response.candidates.length > 0) {
            console.log("🏁 Finish Reason:", response.candidates[0].finishReason);
            console.log("🛡️ Safety Ratings:", JSON.stringify(response.candidates[0].safetyRatings, null, 2));
            // console.log("📦 Raw Content:", JSON.stringify(response.candidates[0].content, null, 2));
        } else {
            console.log("⚠️ No candidates returned.");
        }

        try {
            console.log("📝 Response Text:", response.text());
        } catch (e) {
            console.log("❌ Could not get text:", e.message);
        }

    } catch (error) {
        console.error(`💥 Error testing ${modelName}:`, error.message);
    }
}

async function runTests() {
    await testModel('gemini-pro-latest');
    await testModel('gemini-1.5-flash');
}

runTests();
