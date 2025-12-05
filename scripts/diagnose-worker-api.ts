/**
 * 診斷 Cloudflare Worker API 響應
 */

const MEMORY_API_URL = 'https://tone-memory-core-1.waitin-chen.workers.dev';

async function diagnoseAPI() {
    console.log('🔍 診斷 Cloudflare Worker API...\n');

    // Test 1: GET 不存在的 key
    console.log('Test 1: GET 不存在的 key');
    console.log('='.repeat(50));
    try {
        const response = await fetch(`${MEMORY_API_URL}/memory?key=nonexistent-test-key`);
        const contentType = response.headers.get('content-type');
        const text = await response.text();

        console.log('Status:', response.status);
        console.log('Content-Type:', contentType);
        console.log('Raw Response:', text);

        try {
            const json = JSON.parse(text);
            console.log('✅ JSON 解析成功:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('❌ JSON 解析失敗:', e.message);
        }
    } catch (error) {
        console.error('❌ 請求失敗:', error);
    }

    console.log('\n');

    // Test 2: POST 寫入數據
    console.log('Test 2: POST 寫入測試數據');
    console.log('='.repeat(50));
    const testData = {
        key: 'test:diagnostic:profile',
        value: {
            name: '測試用戶',
            age: 25
        }
    };

    try {
        const response = await fetch(`${MEMORY_API_URL}/memory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });

        const contentType = response.headers.get('content-type');
        const text = await response.text();

        console.log('Status:', response.status);
        console.log('Content-Type:', contentType);
        console.log('Raw Response:', text);

        try {
            const json = JSON.parse(text);
            console.log('✅ JSON 解析成功:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('❌ JSON 解析失敗:', e.message);
        }
    } catch (error) {
        console.error('❌ 請求失敗:', error);
    }

    console.log('\n');

    // Test 3: GET 剛寫入的數據
    console.log('Test 3: GET 剛寫入的數據');
    console.log('='.repeat(50));
    try {
        const response = await fetch(`${MEMORY_API_URL}/memory?key=test:diagnostic:profile`);
        const contentType = response.headers.get('content-type');
        const text = await response.text();

        console.log('Status:', response.status);
        console.log('Content-Type:', contentType);
        console.log('Raw Response:', text);

        try {
            const json = JSON.parse(text);
            console.log('✅ JSON 解析成功:', JSON.stringify(json, null, 2));
            console.log('Value type:', typeof json.value);
            console.log('Value:', json.value);
        } catch (e) {
            console.log('❌ JSON 解析失敗:', e.message);
        }
    } catch (error) {
        console.error('❌ 請求失敗:', error);
    }

    console.log('\n🎉 診斷完成!');
}

diagnoseAPI().catch(console.error);
