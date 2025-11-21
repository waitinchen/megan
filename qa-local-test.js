/**
 * Local QA Test Script
 * Tests all major functionalities of the Megan Fox AI application
 */

require('dotenv').config({ path: '.env.local' });

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60));
}

function logTest(name, passed, details = '') {
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${icon} ${name}`, color);
    if (details) {
        console.log(`   ${details}`);
    }
}

// Test 1: Environment Variables
async function testEnvironmentVariables() {
    logSection('TEST 1: Environment Variables');

    const requiredVars = [
        'GOOGLE_API_KEY',
        'ELEVENLABS_API_KEY',
        'ELEVENLABS_VOICE_ID',
    ];

    let allPresent = true;
    for (const varName of requiredVars) {
        const present = !!process.env[varName];
        logTest(varName, present, present ? '✓ Set' : '✗ Missing');
        if (!present) allPresent = false;
    }

    return allPresent;
}

// Test 2: Google Gemini API
async function testGeminiAPI() {
    logSection('TEST 2: Google Gemini API');

    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        log('Testing Gemini 2.0 Flash...', 'yellow');
        const result = await model.generateContent('Say "Hello" in one word');
        const response = await result.response;
        const text = response.text();

        logTest('Gemini API Connection', true, `Response: "${text}"`);
        return true;
    } catch (error) {
        logTest('Gemini API Connection', false, `Error: ${error.message}`);
        return false;
    }
}

// Test 3: ElevenLabs API
async function testElevenLabsAPI() {
    logSection('TEST 3: ElevenLabs API');

    try {
        const { ElevenLabsClient } = require('elevenlabs');
        const client = new ElevenLabsClient({
            apiKey: process.env.ELEVENLABS_API_KEY,
        });

        log('Testing ElevenLabs connection...', 'yellow');
        const user = await client.user.get();

        logTest('ElevenLabs API Connection', true, `User: ${user.subscription?.tier || 'Free'}`);
        return true;
    } catch (error) {
        logTest('ElevenLabs API Connection', false, `Error: ${error.message}`);
        return false;
    }
}

// Test 4: LLM Service
async function testLLMService() {
    logSection('TEST 4: LLM Service (generateResponse)');

    try {
        const { generateResponse } = require('./app/lib/soul/llm-service.ts');

        log('Testing LLM response generation...', 'yellow');
        const messages = [
            { role: 'user', content: '你好' }
        ];

        const result = await generateResponse(messages, 'test');

        const hasText = result.text && result.text.length > 0;
        const hasEmotionTags = Array.isArray(result.emotionTags);

        logTest('LLM Response Generated', hasText, `Text length: ${result.text?.length || 0}`);
        logTest('Emotion Tags Detected', hasEmotionTags, `Tags: ${result.emotionTags?.join(', ') || 'none'}`);

        // Check for V3 tags that should NOT be in the text
        const hasAsteriskTags = /\*[^*]+\*/.test(result.text);
        const hasBracketTags = /\[[^\]]+\]/.test(result.text);

        logTest('No Asterisk Tags (*...*))', !hasAsteriskTags, hasAsteriskTags ? '⚠️ Found tags!' : '✓ Clean');
        logTest('No Bracket Tags ([...])', !hasBracketTags, hasBracketTags ? '⚠️ Found tags!' : '✓ Clean');

        return hasText && hasEmotionTags;
    } catch (error) {
        logTest('LLM Service', false, `Error: ${error.message}`);
        return false;
    }
}

// Test 5: Audio Tag Stripping
async function testAudioTagStripping() {
    logSection('TEST 5: Audio Tag Stripping');

    const testCases = [
        {
            input: '*whispers softly* Hello there [pause] how are you?',
            expected: 'Hello there how are you?',
        },
        {
            input: 'Normal text without tags',
            expected: 'Normal text without tags',
        },
        {
            input: '*laughs* [whisper] This is a test *giggles* [pause]',
            expected: 'This is a test',
        },
    ];

    // Simulate the stripAudioTags function
    function stripAudioTags(text) {
        return text
            .replace(/\*[^*]+\*/g, '')
            .replace(/\[[^\]]+\]/g, '')
            .trim();
    }

    let allPassed = true;
    for (const testCase of testCases) {
        const result = stripAudioTags(testCase.input);
        const passed = result === testCase.expected;
        logTest(
            `Strip: "${testCase.input.substring(0, 30)}..."`,
            passed,
            passed ? `✓ "${result}"` : `✗ Got "${result}", expected "${testCase.expected}"`
        );
        if (!passed) allPassed = false;
    }

    return allPassed;
}

// Test 6: Health Check Endpoint
async function testHealthEndpoint() {
    logSection('TEST 6: Health Check Endpoint');

    try {
        log('Testing /api/health endpoint...', 'yellow');
        const response = await fetch('http://localhost:3000/api/health');
        const data = await response.json();

        logTest('Health Endpoint Accessible', response.ok, `Status: ${response.status}`);
        logTest('ElevenLabs Status', data.elevenlabs === 'ok', `Result: ${data.elevenlabs}`);
        logTest('LLM Status', data.llm === 'ok', `Result: ${data.llm}`);

        return response.ok;
    } catch (error) {
        logTest('Health Endpoint', false, `Error: ${error.message}`);
        log('⚠️  Make sure dev server is running on port 3000', 'yellow');
        return false;
    }
}

// Main test runner
async function runAllTests() {
    log('\n🧪 Starting Local QA Tests for Megan Fox AI\n', 'blue');

    const results = {
        envVars: await testEnvironmentVariables(),
        gemini: await testGeminiAPI(),
        elevenlabs: await testElevenLabsAPI(),
        llmService: await testLLMService(),
        tagStripping: await testAudioTagStripping(),
        healthEndpoint: await testHealthEndpoint(),
    };

    // Summary
    logSection('TEST SUMMARY');
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r).length;
    const failedTests = totalTests - passedTests;

    log(`Total Tests: ${totalTests}`, 'cyan');
    log(`Passed: ${passedTests}`, 'green');
    log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');

    if (failedTests === 0) {
        log('\n🎉 All tests passed! Application is ready.', 'green');
    } else {
        log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
    }

    console.log('\n');
}

// Run tests
runAllTests().catch(error => {
    log(`\n💥 Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
