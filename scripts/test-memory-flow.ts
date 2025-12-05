/**
 * Memory Flow Test Script
 * 測試 MEGAN 記憶模組的完整數據流
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { getUserMemories, saveUserMemoryByCategory } from '../app/lib/memory/memory-service-v5';

const TEST_USER_ID = 'test-user-123';

async function testMemoryFlow() {
    console.log('🧪 開始測試記憶模組數據流...\n');

    // Test 1: 檢查 Cloudflare KV 連接
    console.log('Test 1: 檢查 Cloudflare KV 連接');
    console.log('='.repeat(50));

    try {
        const memories = await getUserMemories(TEST_USER_ID);
        console.log('✅ KV 連接成功');
        console.log('📦 現有記憶:', JSON.stringify(memories, null, 2));
    } catch (error: any) {
        console.error('❌ KV 連接失敗:', error.message);
        return;
    }

    console.log('\n');

    // Test 2: 寫入測試記憶
    console.log('Test 2: 寫入測試記憶');
    console.log('='.repeat(50));

    const testProfile = {
        personality_summary: '測試用戶 - 友善、好奇',
        emotion_patterns: '通常保持積極樂觀',
        estimated_age: 25,
        estimated_gender: '男性',
        estimated_occupation: '軟體工程師',
    };

    try {
        const saved = await saveUserMemoryByCategory(TEST_USER_ID, 'profile', testProfile);
        if (saved) {
            console.log('✅ 記憶寫入成功');
            console.log('📝 寫入內容:', JSON.stringify(testProfile, null, 2));
        } else {
            console.error('❌ 記憶寫入失敗');
        }
    } catch (error: any) {
        console.error('❌ 寫入錯誤:', error.message);
    }

    console.log('\n');

    // Test 3: 讀取並驗證
    console.log('Test 3: 讀取並驗證記憶');
    console.log('='.repeat(50));

    try {
        const updatedMemories = await getUserMemories(TEST_USER_ID);
        console.log('✅ 記憶讀取成功');
        console.log('📦 更新後的記憶:', JSON.stringify(updatedMemories, null, 2));

        // 驗證數據
        if (updatedMemories.profile?.personality_summary === testProfile.personality_summary) {
            console.log('✅ 數據驗證通過');
        } else {
            console.error('❌ 數據驗證失敗 - 內容不匹配');
        }
    } catch (error: any) {
        console.error('❌ 讀取錯誤:', error.message);
    }

    console.log('\n');
    console.log('🎉 測試完成！');
}

// 執行測試
testMemoryFlow().catch(console.error);
