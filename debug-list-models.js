
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY is missing");
    process.exit(1);
}

async function listModels() {
    console.log("📡 Listing available Gemini models...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("💥 Error listing models:", JSON.stringify(data.error, null, 2));
            return;
        }

        if (data.models) {
            console.log("✅ Available Models (Filtered):");
            data.models.forEach(m => {
                if (m.name.includes('1.5') || m.name.includes('pro')) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("⚠️ No models found in response:", data);
        }
    } catch (error) {
        console.error("💥 Fetch failed:", error.message);
    }
}

listModels();
