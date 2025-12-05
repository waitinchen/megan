/**
 * MEGAN 記憶系統 - 自動化測試套件
 * 執行完整的 QA 測試流程
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const MEMORY_API_URL = process.env.NEXT_PUBLIC_MEMORY_URL || 'https://tone-memory-core-1.waitin-chen.workers.dev';
const TEST_USER_ID = 'qa-test-user-' + Date.now();

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    duration?: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
        await testFn();
        results.push({ name, passed: true, duration: Date.now() - startTime });
        console.log(`✅ ${name}`);
    } catch (error: any) {
        results.push({ name, passed: false, error: error.message, duration: Date.now() - startTime });
        console.log(`❌ ${name}: ${error.message}`);
    }
}

// ============================================================================
// 階段 1: 功能測試
// ============================================================================

async function functionalTests() {
    console.log('\n📋 階段 1: 功能測試');
    console.log('='.repeat(60));

    // Test 1.1.1: GET 不存在的記憶
    await runTest('GET 不存在的記憶', async () => {
        const response = await fetch(`${MEMORY_API_URL}/memory?key=nonexistent-${Date.now()}`);
        const data = await response.json();

        if (response.status !== 200) throw new Error(`Status: ${response.status}`);
        if (data.value !== null) throw new Error('Expected value to be null');
    });

    // Test 1.1.2: POST 寫入對象
    await runTest('POST 寫入對象', async () => {
        const testData = {
            key: `test:${TEST_USER_ID}:profile`,
            value: { name: '測試用戶', age: 25, occupation: '工程師' }
        };

        const response = await fetch(`${MEMORY_API_URL}/memory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });

        const data = await response.json();
        if (response.status !== 200) throw new Error(`Status: ${response.status}`);
        if (data.status !== 'saved') throw new Error('Expected status: saved');
    });

    // Test 1.1.3: GET 讀取剛寫入的數據
    await runTest('GET 讀取剛寫入的數據', async () => {
        const response = await fetch(`${MEMORY_API_URL}/memory?key=test:${TEST_USER_ID}:profile`);
        const data = await response.json();

        if (response.status !== 200) throw new Error(`Status: ${response.status}`);
        if (!data.value) throw new Error('Value is null');
        if (data.value.name !== '測試用戶') throw new Error('Data mismatch');
    });

    // Test 1.2.1: 特殊字符處理
    await runTest('特殊字符處理', async () => {
        const specialData = {
            key: `test:${TEST_USER_ID}:special`,
            value: {
                chinese: '中文測試 🎉',
                emoji: '😀😁😂',
                special: '!@#$%^&*()',
                unicode: '日本語 한글'
            }
        };

        await fetch(`${MEMORY_API_URL}/memory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(specialData)
        });

        const response = await fetch(`${MEMORY_API_URL}/memory?key=test:${TEST_USER_ID}:special`);
        const data = await response.json();

        if (data.value.chinese !== specialData.value.chinese) throw new Error('Chinese characters corrupted');
        if (data.value.emoji !== specialData.value.emoji) throw new Error('Emoji corrupted');
    });

    // Test 1.2.3: 嵌套對象測試
    await runTest('嵌套對象測試', async () => {
        const nestedData = {
            key: `test:${TEST_USER_ID}:nested`,
            value: {
                profile: {
                    basic: { name: 'Test', age: 25 },
                    preferences: {
                        topics: ['tech', 'music'],
                        settings: { theme: 'dark' }
                    }
                }
            }
        };

        await fetch(`${MEMORY_API_URL}/memory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nestedData)
        });

        const response = await fetch(`${MEMORY_API_URL}/memory?key=test:${TEST_USER_ID}:nested`);
        const data = await response.json();

        if (!data.value.profile.preferences.topics) throw new Error('Nested structure lost');
    });

    // Test 1.3.1: 缺少 key 參數
    await runTest('缺少 key 參數錯誤處理', async () => {
        const response = await fetch(`${MEMORY_API_URL}/memory`);
        const data = await response.json();

        if (response.status !== 400) throw new Error('Expected 400 Bad Request');
        if (!data.error) throw new Error('Expected error message');
    });
}

// ============================================================================
// 階段 2: 性能測試
// ============================================================================

async function performanceTests() {
    console.log('\n⚡ 階段 2: 性能測試');
    console.log('='.repeat(60));

    // Test 3.1.1: GET 響應時間
    await runTest('GET 響應時間 < 500ms', async () => {
        const start = Date.now();
        await fetch(`${MEMORY_API_URL}/memory?key=test:${TEST_USER_ID}:profile`);
        const duration = Date.now() - start;

        if (duration > 500) throw new Error(`Too slow: ${duration}ms`);
    });

    // Test 3.1.2: POST 響應時間
    await runTest('POST 響應時間 < 1s', async () => {
        const start = Date.now();
        await fetch(`${MEMORY_API_URL}/memory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                key: `test:${TEST_USER_ID}:perf`,
                value: { test: 'performance' }
            })
        });
        const duration = Date.now() - start;

        if (duration > 1000) throw new Error(`Too slow: ${duration}ms`);
    });

    // Test 3.2.1: 並發讀取測試
    await runTest('10 並發讀取', async () => {
        const promises = Array(10).fill(0).map(() =>
            fetch(`${MEMORY_API_URL}/memory?key=test:${TEST_USER_ID}:profile`)
        );

        const start = Date.now();
        const responses = await Promise.all(promises);
        const duration = Date.now() - start;

        const allSuccess = responses.every(r => r.status === 200);
        if (!allSuccess) throw new Error('Some requests failed');
        if (duration > 2000) throw new Error(`Too slow: ${duration}ms`);
    });
}

// ============================================================================
// 執行所有測試
// ============================================================================

async function runAllTests() {
    console.log('🧪 MEGAN 記憶系統 - 自動化測試套件');
    console.log('='.repeat(60));
    console.log(`測試環境: ${MEMORY_API_URL}`);
    console.log(`測試用戶: ${TEST_USER_ID}`);

    const startTime = Date.now();

    await functionalTests();
    await performanceTests();

    const totalDuration = Date.now() - startTime;

    // 生成報告
    console.log('\n' + '='.repeat(60));
    console.log('📊 測試報告');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;
    const passRate = (passed / total * 100).toFixed(1);

    console.log(`總測試案例: ${total}`);
    console.log(`✅ 通過: ${passed} (${passRate}%)`);
    console.log(`❌ 失敗: ${failed} (${(100 - parseFloat(passRate)).toFixed(1)}%)`);
    console.log(`⏱️  總耗時: ${totalDuration}ms`);

    if (failed > 0) {
        console.log('\n❌ 失敗的測試:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`  - ${r.name}: ${r.error}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    if (failed === 0) {
        console.log('🎉 所有測試通過! Memory System 運作正常!');
    } else {
        console.log('⚠️  部分測試失敗,請檢查上述錯誤');
    }
    console.log('='.repeat(60));

    // 返回退出碼
    process.exit(failed > 0 ? 1 : 0);
}

// 執行測試
runAllTests().catch(error => {
    console.error('測試執行失敗:', error);
    process.exit(1);
});
