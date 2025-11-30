# 📄 WeChat Login Placeholder — 技術備忘錄

**版本**: v0.1 (純展示版)  
**狀態**: 功能已禁用，僅保留 UI

---

## 概述

此階段微信登入功能尚未啟用。

為保持 UI 完整，登入頁面和帳號綁定頁面保留「微信登入」按鈕，但不連接任何 API。

---

## 已暫停的功能

以下功能已完全禁用：

- ❌ `/api/auth/wechat/login` - API Route 已刪除
- ❌ `/api/auth/wechat/callback` - API Route 已刪除
- ❌ 所有 WeChat OAuth 流程
- ❌ 所有 Supabase OAuth session 寫入
- ❌ 所有 cookies 寫入（避免 runtime 衝突）

---

## 當前實作方式

### 1. 前端按鈕組件

**文件**: `components/auth/LoginWithWeChat.tsx`

- ✅ 保留按鈕 UI（綠色，WeChat 風格）
- ✅ 設置 `disabled` 狀態
- ✅ 顯示文字：「微信登入（開發中）」
- ✅ 所有 `onClick` 事件已移除
- ✅ 完全不觸發任何 API 調用

### 2. API Routes 狀態

- ❌ `app/api/auth/wechat/login/route.ts` - **已刪除**
- ❌ `app/api/auth/wechat/callback/route.ts` - **已刪除**

**原因**: 避免 Next.js 在運行時導入這些 routes，可能導致 cookies API 衝突。

### 3. 使用位置

按鈕仍在以下頁面顯示（僅展示）：

- ✅ `/login` - 登入頁面
- ✅ `/dashboard/bindings` - 帳號綁定頁面

---

## 預期行為

### 用戶視角

- ✅ 按鈕可見（綠色 WeChat 風格）
- ✅ 顯示「微信登入（開發中）」文字
- ✅ 按鈕呈現 disabled 狀態（透明度降低）
- ✅ 點擊無任何反應（完全安全）

### 技術視角

- ✅ 不觸發任何 API 請求
- ✅ 不寫入任何 cookies
- ✅ 不影響 Supabase session
- ✅ 不造成任何部署錯誤
- ✅ 系統保持完全穩定

---

## 部署注意事項

### 清除構建緩存

完成上述更改後，**必須清除部署緩存**：

#### Railway

1. Railway → Service → **Settings**
2. 找到 **Build Cache**
3. 點擊 **Clear Build Cache**
4. 再按 **Deploy latest commit**

#### Vercel

```bash
vercel --prod --force
```

---

## 恢復功能時的操作

當需要恢復完整 WeChat OAuth 功能時：

### Step 1: 恢復 API Routes

重新創建：
- `app/api/auth/wechat/login/route.ts`
- `app/api/auth/wechat/callback/route.ts`

### Step 2: 啟用按鈕功能

修改 `components/auth/LoginWithWeChat.tsx`：

```tsx
// 取消註解 loginWithWeChat 函數
// 移除 disabled 屬性
// 恢復 onClick 事件處理
```

### Step 3: 配置環境變數

確保設置：
```env
WECHAT_APPID=your_app_id
WECHAT_SECRET=your_app_secret
```

### Step 4: 測試驗證

- 測試登入流程
- 測試回調處理
- 驗證 session 寫入
- 確認 cookies 正常工作

---

## 相關文檔

- **原始實作文檔**: `WECHAT_LOGIN_IMPLEMENTATION.md`
- **OAuth 設置指南**: `WECHAT_OAUTH_SETUP.md`
- **Cookies 錯誤修復**: `FIX_COOKIES_ERROR.md`

---

## 技術決策記錄

### 為什麼完全刪除 API Routes？

**問題**: 即使 API routes 沒有被調用，Next.js 在構建時仍會導入它們，可能導致：
- Cookies API 衝突
- Runtime 錯誤
- 部署失敗

**解決方案**: 完全刪除 routes，僅保留前端 UI。

### 為什麼不註解代碼而是刪除？

註解代碼仍可能被 TypeScript 編譯器處理，刪除更徹底，避免任何意外導入。

---

**最後更新**: 2025-01-XX  
**負責人**: C謀

