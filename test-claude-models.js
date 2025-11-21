require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const modelsToTest = [
    'claude-3-5-sonnet-20240620',
    'claude-3-5-sonnet-latest',
    'claude-3-sonnet-20240229',
    'claude-3-opus-20240229',
    'claude-3-haiku-20240307',
];

async function testModel(modelName) {
    console.log(`\n🧪 Testing: ${modelName}`);
    try {
        const response = await anthropic.messages.create({
            model: modelName,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
        });
        console.log(`✅ SUCCESS: ${modelName}`);
        console.log(`   Response: ${response.content[0].text}`);
        return true;
    } catch (error) {
        console.log(`❌ FAILED: ${modelName}`);
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🔍 Testing Claude Models...\n');
    console.log('API Key:', process.env.ANTHROPIC_API_KEY ? 'Set ✓' : 'Missing ✗');

    for (const model of modelsToTest) {
        await testModel(model);
    }

    console.log('\n✨ Testing complete!');
}

runTests();
