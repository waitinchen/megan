// Native fetch is available in Node.js 18+

async function runQA() {
    console.log("🧪 Starting QA Test...");

    const payload = {
        messages: [
            { role: "user", content: "老爸回來了！我好想你！" } // Trigger 'excited'/'warm'/'flirty'
        ],
        userIdentity: "dad"
    };

    try {
        console.log("📤 Sending request to http://localhost:3000/api/chat...");
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log("📥 Response received!");

        // 1. Verify Text
        if (data.text && data.text.length > 0) {
            console.log("✅ Text generated:", data.text.substring(0, 50) + "...");
        } else {
            console.error("❌ Text missing!");
        }

        // 2. Verify Emotion Tags
        if (data.emotionTags && Array.isArray(data.emotionTags)) {
            console.log("✅ Emotion Tags detected:", data.emotionTags);
            if (data.emotionTags.includes('warm') || data.emotionTags.includes('excited') || data.emotionTags.includes('flirty')) {
                console.log("   (Logic Check: Emotion matches input context)");
            }
        } else {
            console.error("❌ Emotion Tags missing or invalid format!");
        }

        // 3. Verify Audio
        if (data.audio && typeof data.audio === 'string' && data.audio.length > 1000) {
            console.log("✅ Audio generated (Base64 length):", data.audio.length);
        } else {
            console.error("❌ Audio missing or too short!");
        }

        console.log("🎉 QA Test Completed!");

    } catch (error) {
        console.error("💥 QA Test Failed:", error);
    }
}

runQA();
