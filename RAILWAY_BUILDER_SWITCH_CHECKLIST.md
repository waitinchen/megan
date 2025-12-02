# ✅ Railway Builder 切換檢查清單

## 📋 執行前準備

- [ ] 確認代碼已推送到 Git（包含所有修復）
- [ ] 確認本地測試通過（`npm run build` 成功）
- [ ] 準備好 Railway Dashboard 訪問權限

---

## 🛠️ Step A - 第一次切換（切換到 Dockerfile）

### 操作步驟

- [ ] 1. 登入 Railway Dashboard
- [ ] 2. 選擇項目 `megan`
- [ ] 3. 進入 **Settings** → **Build**
- [ ] 4. 找到 **Builder** 選項
- [ ] 5. 將 Builder 從 `Railpack (Default)` 改為 `Dockerfile`
- [ ] 6. 點擊 **Save**
- [ ] 7. 進入 **Deployments** 標籤頁
- [ ] 8. 等待部署完成（狀態顯示 ✅ Active）

### 記錄資訊

- [ ] 部署 ID: `_________________`
- [ ] 部署開始時間: `_________________`
- [ ] 部署完成時間: `_________________`
- [ ] Build Logs 截圖/複製: `[貼上關鍵 logs]`
- [ ] Runtime Logs 截圖/複製: `[貼上關鍵 logs]`

---

## 🛠️ Step B - 第二次切回（切回 Railpack）

### 操作步驟

- [ ] 1. 確認第一次部署已完成
- [ ] 2. 再次進入 **Settings** → **Build**
- [ ] 3. 將 Builder 從 `Dockerfile` 改回 `Railpack (Default)`
- [ ] 4. 點擊 **Save**
- [ ] 5. 進入 **Deployments** 標籤頁
- [ ] 6. 等待部署完成（狀態顯示 ✅ Active）

### 記錄資訊

- [ ] 部署 ID: `_________________`
- [ ] 部署開始時間: `_________________`
- [ ] 部署完成時間: `_________________`
- [ ] Build Logs 截圖/複製: `[貼上關鍵 logs]`
- [ ] Runtime Logs 截圖/複製: `[貼上關鍵 logs]`

---

## 🔍 驗證步驟

### 1. 檢查日誌

- [ ] 確認 Build Logs 中沒有使用舊 cache
- [ ] 確認 Runtime Logs 中沒有 `cookies(...).get is not a function` 錯誤
- [ ] 確認應用正常啟動

### 2. 測試 API

- [ ] 運行驗證腳本：`node verify-production-fix.js`
- [ ] 或手動測試：
  - [ ] GET `/api/favorites` - 狀態碼: `_____` (應該是 200 或 401，不應該是 500)
  - [ ] GET `/api/conversations` - 狀態碼: `_____` (應該是 200 或 401，不應該是 500)
  - [ ] GET `/api/user` - 狀態碼: `_____` (應該是 200 或 401，不應該是 500)

### 3. 檢查瀏覽器控制台

- [ ] 訪問 https://megan.tonetown.ai
- [ ] 打開瀏覽器 DevTools (F12)
- [ ] 檢查 Console 標籤
- [ ] 確認沒有 `cookies(...).get is not a function` 錯誤
- [ ] 檢查 Network 標籤中的 API 請求狀態

---

## ✅ 成功標準

- [ ] ❌ **不再出現** `this.context.cookies(...).get is not a function` 錯誤
- [ ] ✅ API 返回正確狀態碼（200 或 401，不是 500）
- [ ] ✅ 應用正常運行
- [ ] ✅ Runtime logs 中沒有 cookies 錯誤
- [ ] ✅ 瀏覽器控制台沒有 cookies 錯誤

---

## 📝 完成後提交

完成所有步驟後，請提供：

1. **兩次部署的日誌**（Build Logs 和 Runtime Logs）
2. **驗證腳本結果**（運行 `node verify-production-fix.js` 的輸出）
3. **瀏覽器控制台截圖**（如果仍有錯誤）
4. **API 測試結果**

---

## 🚨 如果問題仍然存在

- [ ] 檢查代碼是否已推送到 Git
- [ ] 確認環境變數設置正確
- [ ] 檢查 Railway 部署日誌中的其他錯誤
- [ ] 考慮完全刪除服務並重新創建（最後手段）

---

**執行日期**: `_________________`
**執行人員**: `_________________`
**完成狀態**: `[ ] 進行中  [ ] 已完成  [ ] 遇到問題`






