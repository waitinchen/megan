# 🛠️ Railway CLI 自動化操作指南

## 📋 概述

雖然我無法直接訪問 Railway Dashboard，但可以通過 **Railway CLI** 實現自動化操作。

---

## 🚀 安裝 Railway CLI

### Windows (PowerShell)

```powershell
# 使用 npm 安裝
npm install -g @railway/cli

# 或使用 scoop
scoop bucket add railway https://github.com/railwayapp/homebrew-tap
scoop install railway
```

### 驗證安裝

```bash
railway --version
```

---

## 🔐 登入和授權

### 1. 登入 Railway

```bash
railway login
```

這會打開瀏覽器，讓你授權 CLI 訪問你的 Railway 帳號。

### 2. 選擇項目

```bash
railway link
```

選擇你的 `megan` 項目。

---

## 🎯 自動化 Builder 切換

### 方法 1: 使用 Railway CLI（如果支持）

**注意**：Railway CLI 可能不直接支持 Builder 切換，但可以嘗試：

```bash
# 查看項目設置
railway status

# 查看環境變數（確認項目已鏈接）
railway variables
```

### 方法 2: 使用 Railway API

Railway 提供 REST API，可以通過 API 操作：

1. **獲取 API Token**
   - Railway Dashboard → Settings → Tokens
   - 創建新的 API Token

2. **使用 API 切換 Builder**

```bash
# 需要 API Token 和項目 ID
curl -X PATCH https://api.railway.app/v1/projects/{project_id}/settings \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{"builder": "dockerfile"}'
```

---

## ⚠️ 限制說明

**重要**：根據 Railway 的文檔，Builder 設置可能**無法通過 CLI 或 API 直接修改**，因為：

1. Builder 設置是項目級別的配置
2. 可能需要通過 Dashboard UI 手動操作
3. API 可能不暴露 Builder 設置的端點

---

## 🔄 替代方案

### 方案 A: 手動操作 + 我提供指導

**最可靠的方法**：
- 你手動在 Dashboard 操作
- 我提供詳細的步驟指導
- 你記錄結果，我幫你分析

### 方案 B: 使用 Railway CLI 觸發重新部署

雖然無法切換 Builder，但可以觸發重新部署：

```bash
# 觸發重新部署（使用最新代碼）
railway up

# 或指定環境
railway up --environment production
```

### 方案 C: 創建 Dockerfile（強制使用 Docker）

如果項目根目錄有 `Dockerfile`，Railway 會自動使用 Docker 構建：

```bash
# 創建 Dockerfile
# Railway 會自動檢測並使用 Docker 構建
```

---

## 📝 推薦方案

**建議使用方案 A**（手動操作 + 指導），因為：

1. ✅ Builder 切換是關鍵操作，需要確認
2. ✅ 手動操作可以實時看到結果
3. ✅ 我可以提供詳細的步驟和驗證方法
4. ✅ 最可靠，不會因為 API 限制而失敗

---

## 🎯 執行建議

1. **現在**：按照 `START_EXECUTION.md` 手動執行
2. **過程中**：隨時告訴我進度，我提供指導
3. **完成後**：運行驗證腳本，我幫你分析結果

---

## 📞 需要幫助？

如果在操作過程中遇到問題：
- 截圖分享給我
- 複製錯誤訊息
- 我會立即提供解決方案

---

**結論**：雖然無法完全自動化，但我可以提供最詳細的指導，確保操作順利完成！





