/**
 * 生產環境修復驗證腳本
 * 用於驗證 Railway 部署後 cookies 錯誤是否已修復
 */

const PRODUCTION_URL = 'https://megan.tonetown.ai';

// 顏色輸出
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

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`  ${title}`, 'blue');
  log(`${'='.repeat(60)}\n`, 'blue');
}

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${PRODUCTION_URL}${endpoint}`, options);
    const data = await response.json().catch(() => ({ error: 'Failed to parse JSON' }));

    return {
      status: response.status,
      ok: response.ok,
      data,
      hasCookiesError: JSON.stringify(data).includes('cookies') && 
                       JSON.stringify(data).includes('get is not a function'),
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
      hasCookiesError: false,
    };
  }
}

async function verifyHealthCheck() {
  logSection('健康檢查');
  
  const result = await testAPI('/api/health');
  
  if (result.ok) {
    logSuccess(`健康檢查通過: ${JSON.stringify(result.data)}`);
    return true;
  } else {
    logError(`健康檢查失敗: ${result.status}`);
    return false;
  }
}

async function verifyFavoritesAPI() {
  logSection('Favorites API 驗證');
  
  // 測試 GET
  logInfo('測試 GET /api/favorites...');
  const getResult = await testAPI('/api/favorites', 'GET');
  
  if (getResult.hasCookiesError) {
    logError('❌ 發現 cookies 錯誤！');
    logError(`錯誤詳情: ${JSON.stringify(getResult.data)}`);
    return false;
  }
  
  if (getResult.status === 401) {
    logWarning('返回 401 Unauthorized（未登錄，這是正常的）');
    logSuccess('✅ 沒有 cookies 錯誤');
  } else if (getResult.status === 500) {
    logError(`返回 500 Internal Server Error`);
    logError(`錯誤: ${JSON.stringify(getResult.data)}`);
    return false;
  } else if (getResult.ok) {
    logSuccess(`✅ GET 請求成功: ${getResult.status}`);
  } else {
    logWarning(`返回 ${getResult.status}（可能是正常的）`);
  }
  
  // 測試 POST
  logInfo('測試 POST /api/favorites...');
  const postResult = await testAPI('/api/favorites', 'POST', {
    type: 'text',
    content: 'Test content',
  });
  
  if (postResult.hasCookiesError) {
    logError('❌ 發現 cookies 錯誤！');
    return false;
  }
  
  if (postResult.status === 401) {
    logWarning('返回 401 Unauthorized（未登錄，這是正常的）');
  } else if (postResult.status === 500) {
    logError(`返回 500 Internal Server Error`);
    return false;
  }
  
  return true;
}

async function verifyConversationsAPI() {
  logSection('Conversations API 驗證');
  
  logInfo('測試 GET /api/conversations...');
  const result = await testAPI('/api/conversations', 'GET');
  
  if (result.hasCookiesError) {
    logError('❌ 發現 cookies 錯誤！');
    logError(`錯誤詳情: ${JSON.stringify(result.data)}`);
    return false;
  }
  
  if (result.status === 401) {
    logWarning('返回 401 Unauthorized（未登錄，這是正常的）');
    logSuccess('✅ 沒有 cookies 錯誤');
  } else if (result.status === 500) {
    logError(`返回 500 Internal Server Error`);
    logError(`錯誤: ${JSON.stringify(result.data)}`);
    return false;
  } else if (result.ok) {
    logSuccess(`✅ GET 請求成功: ${result.status}`);
  }
  
  return true;
}

async function verifyUserAPI() {
  logSection('User API 驗證');
  
  logInfo('測試 GET /api/user...');
  const result = await testAPI('/api/user', 'GET');
  
  if (result.hasCookiesError) {
    logError('❌ 發現 cookies 錯誤！');
    logError(`錯誤詳情: ${JSON.stringify(result.data)}`);
    return false;
  }
  
  if (result.status === 401) {
    logWarning('返回 401 Unauthorized（未登錄，這是正常的）');
    logSuccess('✅ 沒有 cookies 錯誤');
  } else if (result.status === 500) {
    logError(`返回 500 Internal Server Error`);
    logError(`錯誤: ${JSON.stringify(result.data)}`);
    return false;
  } else if (result.ok) {
    logSuccess(`✅ GET 請求成功: ${result.status}`);
  }
  
  return true;
}

async function runVerification() {
  log('\n🚀 開始驗證生產環境修復...\n', 'blue');
  log(`測試目標: ${PRODUCTION_URL}\n`, 'cyan');
  
  const results = {
    healthCheck: false,
    favorites: false,
    conversations: false,
    user: false,
  };
  
  // 執行所有測試
  results.healthCheck = await verifyHealthCheck();
  results.favorites = await verifyFavoritesAPI();
  results.conversations = await verifyConversationsAPI();
  results.user = await verifyUserAPI();
  
  // 總結
  logSection('驗證結果總結');
  
  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    logSuccess('🎉 所有驗證通過！');
    logSuccess('✅ Cookies 錯誤已修復');
    logSuccess('✅ API 正常運行');
  } else {
    logError('❌ 部分驗證失敗');
    logError('請檢查上述錯誤訊息');
  }
  
  log('\n📊 詳細結果:', 'cyan');
  Object.entries(results).forEach(([key, value]) => {
    if (value) {
      logSuccess(`  ${key}: 通過`);
    } else {
      logError(`  ${key}: 失敗`);
    }
  });
  
  log('\n✨ 驗證完成！\n', 'blue');
  
  return allPassed;
}

// 運行驗證
runVerification()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    logError(`\n💥 驗證過程出錯: ${error.message}`);
    console.error(error);
    process.exit(1);
  });






