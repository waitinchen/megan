# Google OAuth 401 錯誤診斷指南

## 錯誤現象
```
POST https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/token?grant_type=pkce 401 (Unauthorized)
```

## 已確認正確的配置 ✅

### 1. Google Cloud Console
- ✅ Client ID: `115527910236-7dgqethh6btbkh61fmnpqbikfb37oav1.apps.googleusercontent.com`
- ✅ Client Secret: `GOCSPXyRiDqKWRMEvf5iDg0gwRjoM1mOVP`
- ✅ 已授權的 JavaScript 來源:
  - `https://megan.tonetown.ai`
  - `https://tqummhyhohacbkmpsgae.supabase.co`
- ✅ 已授權的重新導向 URI:
  - `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback`

### 2. Railway 環境變數 (11個)
- ✅ ELEVENLABS_API_KEY
- ✅ ELEVENLABS_MODEL_ID
- ✅ ELEVENLABS_VOICE_ID
- ✅ GOOGLE_API_KEY
- ✅ NEXT_PUBLIC_MEMORY_API_URL
- ✅ NEXT_PUBLIC_SITE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXTAUTH_SECRET
- ✅ NEXTAUTH_URL
- ✅ SUPABASE_SERVICE_ROLE_KEY

## 待檢查項目 ❓

### 3. Supabase Authentication 設定

#### 需要檢查的頁面：
**Authentication → URL Configuration**

應該設定為：
```
Site URL: https://megan.tonetown.ai
Redirect URLs: https://megan.tonetown.ai/**
```

#### 需要檢查的頁面：
**Authentication → Providers → Google**

應該確認：
- ✅ Enable Sign in with Google: ON
- ✅ Client ID: `115527910236-7dgqethh6btbkh61fmnpqbikfb37oav1.apps.googleusercontent.com`
- ✅ Client Secret: `GOCSPXyRiDqKWRMEvf5iDg0gwRjoM1mOVP`
- ❓ Skip nonce checks: 可能需要打開
- ❓ Authorized Client IDs: 可能需要留空

## 可能的原因

1. **Supabase Site URL 配置錯誤**
   - Site URL 應該是 `https://megan.tonetown.ai`
   - Redirect URLs 應該包含 `https://megan.tonetown.ai/**`

2. **Google OAuth 設定未生效**
   - 需要等待 5-10 分鐘讓 Google 的設定生效

3. **Supabase Provider 設定問題**
   - Client ID 或 Secret 可能複製錯誤（有多餘空格）
   - Skip nonce checks 需要開啟

4. **PKCE Flow 問題**
   - 可能需要在 Supabase 中啟用特定的 PKCE 設定

## 解決步驟

### Step 1: 檢查 Supabase URL Configuration
1. 進入 Supabase Dashboard
2. Authentication → URL Configuration
3. 確認：
   - Site URL = `https://megan.tonetown.ai`
   - Redirect URLs 包含 `https://megan.tonetown.ai/**`
4. 截圖保存

### Step 2: 檢查 Google Provider 設定
1. Authentication → Providers → Google
2. 重新輸入 Client ID 和 Secret（避免複製時有空格）
3. 檢查 "Skip nonce checks" 選項
4. 截圖保存

### Step 3: 清除並重試
1. 清除瀏覽器 Cookies 和 Cache
2. 使用無痕模式訪問 https://megan.tonetown.ai
3. 點擊「使用 Google 登入」
4. 檢查 Console 錯誤訊息

### Step 4: 如果還是失敗
可能需要：
- 重新創建 Google OAuth Client
- 檢查 Supabase 的 Auth Logs
- 查看 Railway 的部署日誌

## 參考資料
- [Supabase Google OAuth 官方文檔](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 文檔](https://developers.google.com/identity/protocols/oauth2)
