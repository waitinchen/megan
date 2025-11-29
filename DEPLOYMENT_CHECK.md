# 🔍 部署檢查與修復指南

## 問題：this.context.cookies(...).get is not a function

### 原因分析

雖然代碼已經修復並推送到 GitHub，但線上環境可能還在運行舊代碼。

---

## ✅ 解決方案

### 方法 1: 觸發 Railway 重新部署（推薦）

#### 步驟：

1. **前往 Railway Dashboard**
   ```
   https://railway.app/dashboard
   ```

2. **找到你的 Megan 專案**

3. **點擊專案 → Deployments**

4. **觸發重新部署**：

   **選項 A - 使用最新 commit**：
   - 點擊右上角 **"Deploy"** 按鈕
   - 選擇最新的 commit (`932ad5c` 或更新的)
   - 等待部署完成（約 2-5 分鐘）

   **選項 B - 重新部署當前版本**：
   - 找到最近的部署記錄
   - 點擊 **"Redeploy"** 按鈕
   - 等待完成

5. **驗證部署**：
   - 部署完成後，前往：https://megan.tonetown.ai/dashboard/history
   - 應該能正常載入對話列表

---

### 方法 2: 強制清除瀏覽器緩存

如果 Railway 已經部署最新版本，但仍然出錯，可能是瀏覽器緩存問題。

#### Chrome / Edge：

1. 打開開發者工具（F12）
2. 右鍵點擊瀏覽器的**重新整理按鈕**
3. 選擇 **"清除快取並強制重新整理"** (Empty Cache and Hard Reload)

或者：

1. 按 `Ctrl + Shift + Delete` 打開清除瀏覽資料
2. 選擇時間範圍：**過去 1 小時**
3. 勾選：
   - ✅ Cookie 和其他網站資料
   - ✅ 快取圖片和檔案
4. 點擊 **"清除資料"**
5. 重新載入頁面

#### Firefox：

1. 按 `Ctrl + Shift + R` 強制重新整理

---

### 方法 3: 使用無痕模式測試

1. 開啟無痕/私密瀏覽視窗
2. 前往：https://megan.tonetown.ai
3. 登入並測試功能

如果無痕模式正常，代表是瀏覽器緩存問題。

---

## 🔍 驗證部署版本

### 檢查 Railway 當前部署的 commit

1. 前往 Railway Dashboard → Deployments
2. 查看最新部署的 commit hash
3. 確認是否包含以下修復：
   - `fba59ba` - cookies API 修復
   - `932ad5c` - 或更新的版本

### 檢查代碼是否正確

最新代碼應該是：

```typescript
// ✅ 正確 (新版本)
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    // ...
}

// ❌ 錯誤 (舊版本 - 會導致錯誤)
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    // ...
}
```

---

## 📊 部署狀態檢查清單

完成以下檢查：

- [ ] GitHub 有最新的 commit (`932ad5c` 或更新)
- [ ] Railway 已經部署最新 commit
- [ ] Railway 部署狀態顯示 **"Active"** 或 **"Success"**
- [ ] 已清除瀏覽器緩存
- [ ] 已重新登入應用
- [ ] 測試 `/dashboard/history` 頁面
- [ ] 測試 `/dashboard/favorites` 頁面

---

## 🚨 如果還是失敗

### 查看 Railway 日誌

1. 前往 Railway Dashboard → Deployments
2. 點擊最新的部署
3. 查看 **"Logs"** 標籤
4. 搜尋關鍵字：
   - `cookies`
   - `Error`
   - `conversations`

### 查看瀏覽器 Console

1. 打開開發者工具（F12）
2. 切換到 **"Console"** 標籤
3. 重新載入頁面
4. 查找紅色錯誤訊息
5. 截圖並告訴我具體錯誤

### 檢查 Network 請求

1. 開發者工具 → **"Network"** 標籤
2. 重新載入頁面
3. 找到失敗的請求：`/api/conversations`
4. 點擊查看：
   - **Headers** - 確認請求 URL
   - **Response** - 查看錯誤詳情
   - **Status Code** - 應該是 500

---

## ⚡ 快速修復步驟總結

1. **確認 GitHub 有最新代碼** ✅ (已完成)
2. **觸發 Railway 重新部署** ← **現在做這個！**
3. **清除瀏覽器緩存**
4. **測試功能**

**預計需要時間**：5-10 分鐘

---

**立即前往 Railway 觸發重新部署！** 🚀
