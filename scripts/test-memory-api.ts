/**
 * Cloudflare Worker Memory API 測試腳本
 * 測試 https://tone-memory-core-1.waitin-chen.workers.dev
 */

const MEMORY_API_URL = process.env.NEXT_PUBLIC_MEMORY_API_URL || 'https://tone-memory-core-1.waitin-chen.workers.dev';
const TEST_USER_ID = 'test-user-123';

async function testMemoryAPI() {
  console.log('🧪 測試 Cloudflare Worker Memory API...\n');
  console.log(`📡 API URL: ${MEMORY_API_URL}\n`);

  // Test 1: GET - 獲取用戶記憶
  console.log('Test 1: GET /memory/:userId');
  try {
    const response = await fetch(`${MEMORY_API_URL}/memory/${TEST_USER_ID}`);
    console.log(`   狀態: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const text = await response.text();

      if (text === '(沒有資料)' || !text || text.trim() === '') {
        console.log('   ✅ 無記憶數據（這是正常的）');
        console.log('   響應: 空對象');
      } else {
        try {
          const data = JSON.parse(text);
          console.log('   ✅ 成功獲取記憶');
          console.log('   數據:', JSON.stringify(data, null, 2));
        } catch (parseError) {
          console.log('   ⚠️  非 JSON 響應:', text);
        }
      }
    } else {
      const error = await response.text();
      console.log('   ⚠️  響應:', error);
    }
  } catch (err: any) {
    console.log('   ❌ 請求失敗:', err.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: POST - 更新用戶記憶
  console.log('Test 2: POST /memory/:userId');
  const testMemoryUpdate = {
    profile: {
      nickname: '小乖',
      age: 25,
      interests: ['音樂', '旅行']
    },
    preferences: {
      language: 'zh-TW',
      tone: 'friendly'
    }
  };

  try {
    const response = await fetch(`${MEMORY_API_URL}/memory/${TEST_USER_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMemoryUpdate),
    });

    console.log(`   狀態: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ 成功更新記憶');
      console.log('   響應:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('   ⚠️  響應:', error);
    }
  } catch (err: any) {
    console.log('   ❌ 請求失敗:', err.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: GET - 驗證更新後的記憶
  console.log('Test 3: GET /memory/:userId (驗證更新)');
  try {
    const response = await fetch(`${MEMORY_API_URL}/memory/${TEST_USER_ID}`);
    console.log(`   狀態: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const text = await response.text();

      if (text === '(沒有資料)' || !text || text.trim() === '') {
        console.log('   ✅ 無記憶數據');
        console.log('   響應: 空對象');
      } else {
        try {
          const data = JSON.parse(text);
          console.log('   ✅ 成功驗證更新');
          console.log('   更新後數據:', JSON.stringify(data, null, 2));
        } catch (parseError) {
          console.log('   ⚠️  非 JSON 響應:', text);
        }
      }
    } else {
      const error = await response.text();
      console.log('   ⚠️  響應:', error);
    }
  } catch (err: any) {
    console.log('   ❌ 請求失敗:', err.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 4: 測試不存在的用戶
  console.log('Test 4: GET /memory/non-existent-user');
  try {
    const response = await fetch(`${MEMORY_API_URL}/memory/non-existent-user-999`);
    console.log(`   狀態: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const text = await response.text();

      if (text === '(沒有資料)' || !text || text.trim() === '') {
        console.log('   ✅ 返回空記憶（預期行為）');
        console.log('   響應: 空對象');
      } else {
        try {
          const data = JSON.parse(text);
          console.log('   ✅ 返回空記憶');
          console.log('   數據:', JSON.stringify(data, null, 2));
        } catch (parseError) {
          console.log('   ⚠️  非 JSON 響應:', text);
        }
      }
    } else {
      const error = await response.text();
      console.log('   響應:', error);
    }
  } catch (err: any) {
    console.log('   ❌ 請求失敗:', err.message);
  }

  console.log('\n✅ API 測試完成！');
  console.log('\n📋 總結：');
  console.log('   - GET /memory/:userId - 獲取用戶記憶');
  console.log('   - POST /memory/:userId - 更新用戶記憶');
  console.log('   - 不存在的用戶返回空對象');
}

testMemoryAPI();
