/**
 * API 调试脚本
 * 用于测试和诊断 API 端点问题
 * 
 * 使用方法：
 * node debug-api.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// 颜色输出
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

async function testHealthCheck() {
  logInfo('\n📊 Testing Health Check API...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    if (response.ok) {
      logSuccess(`Health check passed: ${JSON.stringify(data)}`);
      return true;
    } else {
      logError(`Health check failed: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    logError(`Health check error: ${error.message}`);
    return false;
  }
}

async function testFavoritesAPI() {
  logInfo('\n📊 Testing Favorites API...');
  
  // Test GET
  try {
    logInfo('  Testing GET /api/favorites...');
    const getResponse = await fetch(`${BASE_URL}/api/favorites`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const getData = await getResponse.json();
    
    if (getResponse.ok) {
      logSuccess(`GET /api/favorites: ${getResponse.status} OK`);
      logInfo(`  Response: ${JSON.stringify(getData).substring(0, 100)}...`);
    } else {
      logError(`GET /api/favorites: ${getResponse.status} ${getResponse.statusText}`);
      logError(`  Error: ${JSON.stringify(getData)}`);
      
      // 检查是否是 cookies 错误
      if (getData.message?.includes('cookies') || getData.message?.includes('get is not a function')) {
        logWarning('  ⚠️  This looks like a cookies API error!');
        logWarning('  Check if the code uses the correct cookies() API.');
      }
    }
  } catch (error) {
    logError(`GET /api/favorites error: ${error.message}`);
  }
  
  // Test POST (需要认证，可能会失败)
  try {
    logInfo('  Testing POST /api/favorites...');
    const postResponse = await fetch(`${BASE_URL}/api/favorites`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'text',
        content: 'Test favorite content',
      }),
    });
    
    const postData = await postResponse.json();
    
    if (postResponse.ok) {
      logSuccess(`POST /api/favorites: ${postResponse.status} OK`);
    } else {
      logWarning(`POST /api/favorites: ${postResponse.status} ${postResponse.statusText}`);
      logInfo(`  Response: ${JSON.stringify(postData)}`);
      
      if (postResponse.status === 401) {
        logWarning('  ⚠️  Unauthorized - This is expected if not logged in');
      } else if (postData.message?.includes('cookies')) {
        logError('  ❌ Cookies API error detected!');
      }
    }
  } catch (error) {
    logError(`POST /api/favorites error: ${error.message}`);
  }
}

async function testConversationsAPI() {
  logInfo('\n📊 Testing Conversations API...');
  
  try {
    logInfo('  Testing GET /api/conversations...');
    const response = await fetch(`${BASE_URL}/api/conversations`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      logSuccess(`GET /api/conversations: ${response.status} OK`);
    } else {
      logError(`GET /api/conversations: ${response.status} ${response.statusText}`);
      logError(`  Error: ${JSON.stringify(data)}`);
      
      if (data.message?.includes('cookies')) {
        logWarning('  ⚠️  Cookies API error detected!');
      }
    }
  } catch (error) {
    logError(`GET /api/conversations error: ${error.message}`);
  }
}

async function testUserAPI() {
  logInfo('\n📊 Testing User API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/user`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      logSuccess(`GET /api/user: ${response.status} OK`);
      logInfo(`  User ID: ${data.user?.id || 'N/A'}`);
    } else {
      logWarning(`GET /api/user: ${response.status} ${response.statusText}`);
      if (response.status === 401) {
        logWarning('  ⚠️  Unauthorized - This is expected if not logged in');
      } else {
        logError(`  Error: ${JSON.stringify(data)}`);
      }
    }
  } catch (error) {
    logError(`GET /api/user error: ${error.message}`);
  }
}

async function checkEnvironment() {
  logInfo('\n🔍 Checking Environment...');
  
  logInfo(`  Base URL: ${BASE_URL}`);
  logInfo(`  Node Version: ${process.version}`);
  
  // 检查环境变量
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  
  logInfo('  Environment Variables:');
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      logSuccess(`    ${varName}: Set (${value.substring(0, 20)}...)`);
    } else {
      logError(`    ${varName}: Not set`);
    }
  });
}

async function runAllTests() {
  log('\n🚀 Starting API Debug Tests...\n', 'blue');
  log(`Testing against: ${BASE_URL}\n`, 'cyan');
  
  await checkEnvironment();
  await testHealthCheck();
  await testFavoritesAPI();
  await testConversationsAPI();
  await testUserAPI();
  
  log('\n✨ Tests completed!\n', 'blue');
  logInfo('Note: Some tests may fail if you are not authenticated.');
  logInfo('This is normal. The important thing is to check for cookies API errors.');
}

// 运行测试
runAllTests().catch(error => {
  logError(`\n💥 Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});






