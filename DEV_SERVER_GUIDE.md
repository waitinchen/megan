# 🚀 開發伺服器啟動指南

## ❌ 常見錯誤

### 錯誤: `ERR_CONNECTION_REFUSED`
```
無法連上這個網站
localhost 拒絕連線。
ERR_CONNECTION_REFUSED
```

**原因**：開發伺服器沒有運行

---

## ✅ 解決步驟

### 方法 1: 啟動開發伺服器

```powershell
# 在項目根目錄執行
npm run dev
```

**預期輸出**：
```
▲ Next.js 16.0.3
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in X.XXs
```

### 方法 2: 如果端口被佔用

```powershell
# 1. 停止所有 Node 進程
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. 清除 Next.js 緩存
Remove-Item -Recurse -Force .next

# 3. 重新啟動
npm run dev
```

---

## 🔍 檢查伺服器狀態

### 檢查端口是否監聽

```powershell
netstat -ano | Select-String ":3000"
```

**如果看到輸出**，表示端口正在監聽：
```
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       XXXXX
```

**如果沒有輸出**，表示伺服器未啟動。

### 檢查 Node 進程

```powershell
Get-Process -Name node -ErrorAction SilentlyContinue
```

---

## ⚠️ 常見問題

### 問題 1: 端口 3000 已被使用

**解決方法**：
1. 找到使用端口 3000 的進程：
   ```powershell
   netstat -ano | Select-String ":3000"
   ```
2. 停止該進程（使用 PID）：
   ```powershell
   Stop-Process -Id <PID> -Force
   ```

### 問題 2: 環境變數缺失導致啟動失敗

**檢查**：確認 `.env.local` 檔案存在且包含必要的環境變數：
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=...
```

### 問題 3: 依賴套件未安裝

**解決方法**：
```powershell
npm install
```

---

## 📝 快速啟動檢查清單

- [ ] 確認在項目根目錄 (`C:\Users\waiti\Megan_Fox`)
- [ ] 確認 `.env.local` 檔案存在
- [ ] 確認依賴已安裝 (`node_modules` 目錄存在)
- [ ] 執行 `npm run dev`
- [ ] 等待看到 "Ready" 訊息
- [ ] 訪問 `http://localhost:3000/login`

---

## 🎯 成功標誌

當開發伺服器成功啟動時，你應該看到：

1. **終端輸出**：
   ```
   ▲ Next.js 16.0.3
   - Local:        http://localhost:3000
   ✓ Ready in X.XXs
   ```

2. **瀏覽器訪問**：
   - `http://localhost:3000/login` 應該能正常顯示登入頁面

3. **端口監聽**：
   - `netstat -ano | Select-String ":3000"` 應該有輸出

---

## 🔄 自動啟動（可選）

如果你經常需要啟動伺服器，可以建立一個簡單的啟動腳本：

**`start-dev.ps1`**:
```powershell
# 停止現有進程
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# 清除緩存
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
}

# 啟動開發伺服器
npm run dev
```

**使用**：
```powershell
.\start-dev.ps1
```

---

**提示**：如果開發伺服器啟動失敗，檢查終端輸出的錯誤訊息，通常是環境變數或依賴套件的問題。







