# 微信 OAuth 登入設置指南

## 📋 前置準備

### 1. 微信開放平台帳號

前往 [微信開放平台](https://open.weixin.qq.com) 註冊開發者帳號：

1. 註冊並完成開發者認證（需要企業資質）
2. 創建**網站應用**（不是公眾號或小程序）
3. 填寫應用信息：
   - 應用名稱：Megan AI
   - 應用簡介：AI 語音對話助手
   - 應用官網：https://megan.tonetown.ai
   - **授權回調域**：`megan.tonetown.ai`（重要！）

4. 提交審核並等待通過

### 2. 獲取憑證

審核通過後，在應用詳情頁獲取：

- **AppID**：應用唯一標識符
- **AppSecret**：應用密鑰（請妥善保管）

---

## 🔧 配置步驟

### 1. 添加環境變數

在 `.env.local` 文件中添加：

```bash
# WeChat OAuth (微信開放平台)
WECHAT_APPID=wx1234567890abcdef
WECHAT_SECRET=your_app_secret_here
```

### 2. 添加資料庫欄位

在 Supabase SQL Editor 執行：

```sql
-- 添加微信相關欄位到 profiles 表
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_unionid text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_openid text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_nickname text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_avatar text;

-- 創建索引提升查詢效率
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_unionid ON profiles(wechat_unionid);
```

### 3. 設置授權回調域

在微信開放平台的應用設置中：

1. 進入**應用詳情**
2. 修改**授權回調域**
3. 設置為：`megan.tonetown.ai`
4. **注意**：不需要加 `https://` 或路徑

---

## 🔄 OAuth 流程說明

### 完整流程

```
用戶點擊「使用微信登入」
    ↓
/api/auth/wechat/login
    ↓
重定向到微信授權頁面（顯示 QR Code）
    ↓
用戶掃碼授權
    ↓
微信重定向回 /api/auth/wechat/callback?code=xxx&state=MEGAN_LOGIN
    ↓
使用 code 換取 access_token
    ↓
使用 access_token 獲取用戶信息（openid, unionid, nickname, avatar）
    ↓
檢查 profiles 表是否存在該 unionid
    ↓
    ├─ 存在 → 建立 Supabase session → 重定向到主頁
    └─ 不存在 → 創建新用戶 → 建立 session → 重定向到歡迎頁
```

### API 端點

| 端點 | 用途 | 說明 |
|------|------|------|
| `GET /api/auth/wechat/login` | 發起登入 | 重定向到微信授權頁 |
| `GET /api/auth/wechat/callback` | 處理回調 | 接收 code，完成登入 |

---

## 🧪 測試步驟

### 本地測試

1. **使用 ngrok 建立 HTTPS 隧道**：

```bash
ngrok http 3000
```

2. **更新環境變數**：

```bash
NEXT_PUBLIC_SITE_URL=https://your-ngrok-url.ngrok.io
```

3. **在微信開放平台設置回調域**：

設為 `your-ngrok-url.ngrok.io`

4. **啟動開發服務器**：

```bash
npm run dev
```

5. **訪問登入頁面並測試微信登入**

### 生產環境測試

確保：
- ✅ `NEXT_PUBLIC_SITE_URL=https://megan.tonetown.ai`
- ✅ 微信回調域設為 `megan.tonetown.ai`
- ✅ HTTPS 正常運作
- ✅ 環境變數已部署到 Railway

---

## 🐛 常見問題

### 1. "redirect_uri 參數錯誤"

**原因**：授權回調域設置不正確

**解決**：
1. 檢查微信開放平台的授權回調域
2. 確保與 `NEXT_PUBLIC_SITE_URL` 的域名一致
3. 不要包含 `https://` 或路徑

### 2. "appid 參數錯誤"

**原因**：WECHAT_APPID 未配置或錯誤

**解決**：
1. 檢查 `.env.local` 中的 `WECHAT_APPID`
2. 確認是網站應用的 AppID（以 `wx` 開頭）

### 3. "code 已被使用"

**原因**：授權 code 只能使用一次

**解決**：
1. 重新發起授權流程
2. 每次測試都需要重新掃碼

### 4. 本地測試無法掃碼

**原因**：微信要求 HTTPS

**解決**：
1. 使用 ngrok 或其他隧道工具
2. 或直接在生產環境測試

---

## 🔒 安全注意事項

1. **AppSecret 保密**：
   - ❌ 不要提交到 Git
   - ✅ 使用環境變數
   - ✅ 在 Railway 等平台設置 Secret

2. **State 參數驗證**：
   - 防止 CSRF 攻擊
   - 當前使用固定值 `MEGAN_LOGIN`
   - 生產環境建議使用隨機值並存儲在 session

3. **UnionID vs OpenID**：
   - UnionID：同一微信開放平台下的唯一 ID（推薦）
   - OpenID：單個應用下的唯一 ID
   - 優先使用 UnionID 作為用戶標識

---

## 📚 參考文檔

- [微信開放平台網站應用開發](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html)
- [微信 OAuth 2.0 文檔](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html)
- [授權後接口調用](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Authorized_Interface_Calling_UnionID.html)

---

**配置完成後，微信登入功能即可正常使用！** 🎉
