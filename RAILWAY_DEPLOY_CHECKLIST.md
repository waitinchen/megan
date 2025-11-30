# 🚂 Railway 部署檢查清單

## 當前狀態

從日誌來看，服務已經啟動：
```
✓ Ready in 748ms
Next.js 16.0.3
```

**⚠️ 但是：** 這個構建可能是舊的，需要確認是否包含最新的 cookies 修復。

## ✅ 確認步驟

### Step 1: 確認最新代碼已推送

檢查最後一次推送是否包含修復：
- ✅ `app/api/favorites/route.ts` - 使用 `createRouteHandlerClient({ cookies: () => cookieStore })`
- ✅ `app/api/conversations/route.ts` - 使用 `createRouteHandlerClient({ cookies: () => cookieStore })`
- ✅ `middleware.ts` - 已刪除

### Step 2: 強制重新構建

#### 方法 A: 透過 Railway Dashboard（推薦）

1. **進入 Railway Dashboard**
   - 登入 https://railway.app
   - 選擇你的專案

2. **清除構建緩存**
   - 點擊服務
   - 進入 **Settings** 標籤
   - 找到 **Build** 區塊
   - 點擊 **"Clear Build Cache"** 或 **"Purge Build Cache"**

3. **重新部署**
   - 回到 **Deployments** 標籤
   - 點擊 **"Deploy"** 或 **"Redeploy"**
   - 選擇 **"Deploy Latest Commit"**

#### 方法 B: 透過 Git 觸發（如果已連接）

```bash
# 創建一個空提交來觸發重新部署
git commit --allow-empty -m "trigger: force rebuild to apply cookies fix"
git push origin main
```

### Step 3: 監控部署日誌

重新部署時，檢查日誌是否顯示：
```
✓ Compiled successfully
✓ Starting...
✓ Ready in XXXms
```

**不應該看到：**
- ❌ `middleware.ts` 相關的警告
- ❌ `this.context.cookies` 錯誤
- ❌ 舊的構建緩存

### Step 4: 驗證修復

部署完成後（通常 2-5 分鐘），測試：

1. **訪問生產環境**
   - 打開 https://megan.tonetown.ai
   - 打開 DevTools → Console

2. **檢查錯誤**
   - ✅ **不應該看到** `this.context.cookies(...).get is not a function`
   - ✅ **不應該看到** 500 錯誤（如果是已登錄狀態）

3. **測試功能**
   - 訪問 `/dashboard/favorites` - 應該能正常載入
   - 訪問 `/dashboard/history` - 應該能正常載入
   - 嘗試收藏一條訊息 - 應該成功

## 🔍 如果問題仍然存在

### 檢查 1: 確認構建時間

在 Railway Dashboard 查看：
- **Deployments** 標籤
- 檢查最新的部署時間
- 確認時間是在你推送最新修復之後

### 檢查 2: 查看構建日誌

在 Railway Dashboard：
- 進入最新部署
- 查看 **Build Logs**
- 確認構建成功，沒有錯誤

### 檢查 3: 檢查環境變數

確認 Railway 環境變數正確設置：
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 檢查 4: 強制重新安裝依賴

如果上述方法都不行，可能需要：

1. **在 Railway 中添加構建命令**
   - Settings → Build
   - Build Command: `rm -rf .next node_modules && npm install && npm run build`
   - Start Command: `npm start`

2. **重新部署**

## 📋 Railway 專用提示

### 清除緩存的正確位置

Railway 的構建緩存位置：
- **Settings** → **Build** → **Build Cache**
- 點擊 **"Clear"** 或 **"Purge"**

### 觸發重新部署的方法

1. **手動觸發**
   - Deployments → Deploy → Deploy Latest Commit

2. **透過 Git Push**
   - 推送任何新提交會自動觸發

3. **透過空提交**
   ```bash
   git commit --allow-empty -m "trigger rebuild"
   git push
   ```

## ✅ 成功標誌

修復成功後，你應該看到：

1. **控制台無錯誤**
   - ✅ 沒有 `this.context.cookies(...).get is not a function`
   - ✅ 沒有 500 Internal Server Error（如果是已登錄狀態）

2. **API 正常回應**
   - ✅ GET /api/favorites → 200 OK
   - ✅ GET /api/conversations → 200 OK
   - ✅ POST /api/favorites → 200 OK 或 409（如果已收藏）

3. **功能正常**
   - ✅ Favorites 頁面能載入收藏列表
   - ✅ Conversations 頁面能載入對話歷史
   - ✅ 收藏功能正常工作

---

**重要提醒**：部署後需要等待 2-5 分鐘讓構建完成，然後再測試。

