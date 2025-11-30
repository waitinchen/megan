# 🔍 API 健康檢查系統使用指南

## 🎯 功能說明

已建立一個直觀的健康檢查系統，可以快速檢查所有 API 和 Key 值的狀態。

---

## 📍 如何使用

### 方法 1: 訪問健康檢查頁面（推薦）

1. **啟動開發伺服器**（如果還沒啟動）：
   ```bash
   npm run dev
   ```

2. **訪問健康檢查頁面**：
   ```
   http://localhost:3000/health
   ```

3. **查看狀態**：
   - 頁面會自動顯示所有 API 和 Key 的健康狀態
   - 每 30 秒自動刷新
   - 也可以點擊「重新檢查」按鈕手動刷新

### 方法 2: 直接調用 API

**API 端點**：
```
GET /api/health-check
```

**範例**：
```bash
curl http://localhost:3000/api/health-check
```

或瀏覽器直接訪問：
```
http://localhost:3000/api/health-check
```

---

## ✅ 檢查項目

健康檢查系統會自動檢查以下項目：

### 1. Supabase
- ✅ 環境變數是否設定
- ✅ API Key 是否有效
- ✅ 連線是否正常

### 2. Google OAuth
- ✅ Supabase 設定狀態
- ⚠️ 需要手動確認 Dashboard 設定

### 3. ElevenLabs
- ✅ API Key 是否設定
- ✅ API 連線是否正常

### 4. Google Gemini
- ✅ API Key 是否設定
- ✅ API 連線是否正常

### 5. 環境變數
- ✅ 檢查所有必要的環境變數
- ✅ 顯示已設定和未設定的變數清單

---

## 🎨 狀態說明

### 狀態圖示

- 🟢 **正常 (ok)**: 綠色勾選圖示
- 🔴 **錯誤 (error)**: 紅色 X 圖示
- 🟡 **警告 (warning)**: 黃色警告圖示
- ⚪ **未知 (unknown)**: 灰色圖示

### 狀態顏色

- **正常**: 綠色背景
- **錯誤**: 紅色背景
- **警告**: 黃色背景
- **未知**: 灰色背景

---

## 📊 頁面功能

### 自動刷新
- 頁面會每 30 秒自動刷新狀態
- 無需手動重新載入頁面

### 手動刷新
- 點擊右上角的「重新檢查」按鈕
- 立即更新所有狀態

### 快速連結
- 每個服務卡片都有快速連結
- 可以快速前往對應的 Dashboard 設定頁面

---

## 🔧 API 回應格式

API 會返回 JSON 格式的結果：

```json
{
  "timestamp": "2025-11-27T10:00:00.000Z",
  "overall": "ok",
  "checks": {
    "supabase": {
      "status": "ok",
      "message": "連線正常",
      "details": {
        "url": "https://...",
        "anonKey": "..."
      }
    },
    "googleOAuth": {
      "status": "warning",
      "message": "需要手動確認",
      "details": {}
    },
    "elevenlabs": {
      "status": "ok",
      "message": "API 連線正常",
      "details": {}
    },
    "googleGemini": {
      "status": "ok",
      "message": "API 連線正常",
      "details": {}
    },
    "environment": {
      "status": "ok",
      "message": "所有環境變數已設定",
      "present": ["NEXT_PUBLIC_SUPABASE_URL", ...],
      "missing": []
    }
  }
}
```

---

## 🚀 使用場景

### 場景 1: 開發時快速檢查
- 在開發過程中，快速確認所有 API 是否正常
- 發現問題立即處理

### 場景 2: 部署前檢查
- 部署到生產環境前，確認所有設定都正確
- 避免部署後出現問題

### 場景 3: 故障排除
- 當遇到問題時，快速定位是哪個服務有問題
- 節省除錯時間

### 場景 4: 持續監控
- 頁面會自動刷新，可以持續監控狀態
- 適合在另一個視窗打開監控

---

## 💡 提示

1. **書籤保存**：
   - 將 `/health` 頁面加入書籤，方便隨時訪問

2. **多視窗監控**：
   - 可以在開發時保持健康檢查頁面打開
   - 隨時查看狀態變化

3. **分享給團隊**：
   - 團隊成員可以訪問此頁面檢查設定狀態
   - 統一管理配置狀態

---

## 🔗 相關連結

- **健康檢查頁面**: `http://localhost:3000/health`
- **API 端點**: `http://localhost:3000/api/health-check`
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Google Cloud Console**: https://console.cloud.google.com/

---

**立即試用**: 訪問 `http://localhost:3000/health` 查看所有 API 的狀態！🎉


