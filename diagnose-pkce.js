/**
 * PKCE 診斷腳本
 * 
 * 在瀏覽器控制台執行此腳本，用於診斷 PKCE code_verifier 問題
 */

console.log('🔍 PKCE 診斷開始...\n')

// 1. 檢查 sessionStorage 是否可用
console.log('1. 檢查 sessionStorage 可用性:')
try {
  sessionStorage.setItem('test', 'value')
  const value = sessionStorage.getItem('test')
  if (value === 'value') {
    console.log('   ✅ sessionStorage 可用')
    sessionStorage.removeItem('test')
  } else {
    console.log('   ❌ sessionStorage 讀寫失敗')
  }
} catch (e) {
  console.log('   ❌ sessionStorage 不可用:', e.message)
}

// 2. 列出所有 sessionStorage 鍵
console.log('\n2. 所有 sessionStorage 鍵:')
const sessionKeys = Object.keys(sessionStorage)
console.log('   總數:', sessionKeys.length)
if (sessionKeys.length > 0) {
  sessionKeys.forEach(key => {
    const value = sessionStorage.getItem(key)
    console.log(`   - ${key}: ${value ? `${value.length} chars` : 'null'}`)
  })
} else {
  console.log('   (空)')
}

// 3. 查找 PKCE 相關鍵
console.log('\n3. PKCE 相關鍵:')
const pkceKeys = sessionKeys.filter(k => 
  k.includes('pkce') || 
  k.includes('code-verifier') || 
  k.includes('code_verifier') ||
  k.includes('auth-token')
)
if (pkceKeys.length > 0) {
  pkceKeys.forEach(key => {
    const value = sessionStorage.getItem(key)
    console.log(`   ✅ ${key}: ${value ? `${value.length} chars` : 'null'}`)
  })
} else {
  console.log('   ❌ 未找到 PKCE 相關鍵')
}

// 4. 列出所有 localStorage 鍵（對比）
console.log('\n4. 所有 localStorage 鍵（對比）:')
const localKeys = Object.keys(localStorage)
console.log('   總數:', localKeys.length)
if (localKeys.length > 0) {
  localKeys.forEach(key => {
    const value = localStorage.getItem(key)
    console.log(`   - ${key}: ${value ? `${value.length} chars` : 'null'}`)
  })
} else {
  console.log('   (空)')
}

// 5. 檢查 Supabase 項目 ID
console.log('\n5. Supabase 項目信息:')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || window.location.origin
const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]
if (projectRef) {
  console.log(`   項目 ID: ${projectRef}`)
  console.log(`   預期的 PKCE 鍵: sb-${projectRef}-pkce-code-verifier`)
  const expectedKey = `sb-${projectRef}-pkce-code-verifier`
  const exists = sessionStorage.getItem(expectedKey) !== null
  console.log(`   是否存在: ${exists ? '✅' : '❌'}`)
} else {
  console.log('   ⚠️ 無法從 URL 提取項目 ID')
}

// 6. 建議
console.log('\n📋 診斷建議:')
if (pkceKeys.length === 0) {
  console.log('   ❌ 未找到 PKCE code_verifier')
  console.log('   可能原因:')
  console.log('   1. OAuth redirect 過程中 sessionStorage 被清除')
  console.log('   2. Supabase 未正確存儲 code_verifier')
  console.log('   3. 存儲鍵格式不匹配')
  console.log('\n   建議:')
  console.log('   - 嘗試使用 localStorage（臨時方案）')
  console.log('   - 檢查 Supabase Dashboard 中的 OAuth 設置')
} else {
  console.log('   ✅ 找到 PKCE 相關鍵，但可能格式不正確')
  console.log('   建議檢查 Supabase 文檔確認正確的鍵格式')
}

console.log('\n✅ 診斷完成')


