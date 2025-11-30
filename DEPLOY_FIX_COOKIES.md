# 🚀 修復部署環境的 Cookies 錯誤

## 問題診斷

**錯誤訊息**：`this.context.cookies(...).get is not a function`

**發生位置**：生產環境 `https://megan.tonetown.ai`

**影響的 API**：
- GET /api/favorites
- POST /api/favorites
- GET /api/conversations
- POST /api/conversations

## 🔍 根本原因

雖然本地代碼已經修復，但**生產環境可能還在運行舊的構建**，導致：
1. 舊的 middleware.ts 仍然在運行
2. 或者使用了舊版本的 cookies API
3. 構建緩存沒有清除

## ✅ 修復步驟

### Step 1: 確認代碼已更新

本地代碼已經正確更新為：
```typescript
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

const cookieStore = cookies();
const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
```

### Step 2: 清除構建緩存並重新部署

#### 如果使用 Railway：

1. **清除部署緩存**
   - 進入 Railway Dashboard
   - 選擇你的服務
   - 找到 "Settings" → "Build"
   - 點擊 "Clear Build Cache"
   - 或者刪除並重新創建服務

2. **強制重新構建**
   - 在 Railway Dashboard 中
   - 點擊 "Redeploy" 或 "Deploy"
   - 選擇 "Deploy Latest Commit"

#### 如果使用 Vercel：

1. **清除構建緩存**
   ```bash
   vercel --prod --force
   ```

2. **或透過 Dashboard**
   - Settings → General
   - 點擊 "Clear Build Cache"
   - 重新部署

#### 如果使用其他平台：

- 刪除 `.next` 目錄後重新構建
- 清除所有構建緩存
- 強制重新構建（不使用緩存）

### Step 3: 驗證修復

部署完成後，檢查：

1. **檢查控制台**
   - 打開 DevTools → Console
   - 重新載入頁面
   - 確認不再出現 `this.context.cookies(...).get is not a function`

2. **測試 API**
   ```bash
   # 測試 favorites API
   curl -X GET https://megan.tonetown.ai/api/favorites \
     -H "Cookie: your-session-cookie"
   
   # 應該返回 200 OK，而不是 500
   ```

3. **檢查日誌**
   - 查看部署平台的日誌
   - 確認沒有 cookies 相關錯誤

## 🔧 如果問題仍然存在

### 檢查 1: 確認 middleware.ts 已刪除

確認生產環境的構建不包含 `middleware.ts`：
```bash
# 本地檢查
ls middleware.ts
# 應該返回：No such file or directory
```

### 檢查 2: 確認環境變數

確保生產環境有正確的環境變數：
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 檢查 3: 確認依賴版本

確認 `package.json` 中的版本正確：
```json
{
  "dependencies": {
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/supabase-js": "^2.86.0",
    "next": "16.0.3"
  }
}
```

### 檢查 4: 強制重新安裝依賴

在部署平台執行：
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📋 部署檢查清單

- [ ] 代碼已推送到 main 分支
- [ ] 本地測試通過（沒有 cookies 錯誤）
- [ ] 清除構建緩存
- [ ] 重新部署
- [ ] 驗證生產環境 API 正常
- [ ] 檢查控制台無錯誤
- [ ] 測試 favorites 和 conversations 功能

## 🎯 預期結果

修復後應該：
- ✅ 所有 API 返回 200 OK（如果已登錄）
- ✅ 控制台無 cookies 錯誤
- ✅ Favorites 和 Conversations 功能正常
- ✅ Session 驗證正常工作

---

**如果按照以上步驟操作後問題仍然存在，請提供：**
1. 部署平台的日誌
2. 瀏覽器控制台的完整錯誤訊息
3. Network 面板中的 API 請求詳細資訊

