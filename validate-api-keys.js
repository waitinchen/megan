require('dotenv').config({ path: '.env.local' });

console.log('\n🔑 API Key Validation\n');
console.log('='.repeat(60));

// Check Google API Key
const googleKey = process.env.GOOGLE_API_KEY;
console.log('\n📍 GOOGLE_API_KEY:');
if (googleKey) {
    console.log(`   Length: ${googleKey.length}`);
    console.log(`   Starts with: ${googleKey.substring(0, 10)}...`);
    console.log(`   Format: ${googleKey.startsWith('AIza') ? '✅ Valid format' : '❌ Invalid format'}`);
} else {
    console.log('   ❌ NOT SET');
}

// Check ElevenLabs API Key
const elKey = process.env.ELEVENLABS_API_KEY;
console.log('\n📍 ELEVENLABS_API_KEY:');
if (elKey) {
    console.log(`   Length: ${elKey.length}`);
    console.log(`   Starts with: ${elKey.substring(0, 10)}...`);
    console.log(`   Format: ${elKey.startsWith('sk_') ? '✅ Valid format' : '❌ Invalid format'}`);
} else {
    console.log('   ❌ NOT SET');
}

// Check ElevenLabs Voice ID
const voiceId = process.env.ELEVENLABS_VOICE_ID;
console.log('\n📍 ELEVENLABS_VOICE_ID:');
if (voiceId) {
    console.log(`   Length: ${voiceId.length}`);
    console.log(`   Value: ${voiceId}`);
} else {
    console.log('   ❌ NOT SET');
}

console.log('\n' + '='.repeat(60));

// Quick API test
async function quickTest() {
    console.log('\n🧪 Quick API Tests\n');

    // Test Gemini
    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(googleKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        console.log('Testing Gemini API...');
        const result = await model.generateContent('Hi');
        const response = await result.response;
        console.log('✅ Gemini API works!');
        console.log(`   Response: "${response.text()}"\n`);
    } catch (error) {
        console.log('❌ Gemini API failed:');
        console.log(`   ${error.message}\n`);
    }

    // Test ElevenLabs
    try {
        const { ElevenLabsClient } = require('elevenlabs');
        const client = new ElevenLabsClient({ apiKey: elKey });

        console.log('Testing ElevenLabs API...');
        const user = await client.user.get();
        console.log('✅ ElevenLabs API works!');
        console.log(`   Subscription: ${user.subscription?.tier || 'Free'}\n`);
    } catch (error) {
        console.log('❌ ElevenLabs API failed:');
        console.log(`   ${error.message}\n`);
    }
}

quickTest();
