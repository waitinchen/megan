# 🔒 GitHub 推送問題解決方案

## 問題說明

GitHub 的安全掃描檢測到歷史提交中包含 Google OAuth 憑證，推送被攔截。

**涉及的歷史提交**: `b0e3dbd`

**包含敏感信息的文件**:
- `FIX_INVALID_CLIENT.md`
- `QUICK_FIX_INVALID_CLIENT.md`
- `FINAL_FIX_INVALID_CLIENT.md`

## 解決方案

### 方案 1: 使用 GitHub 提供的 URL 允許推送（推薦）

如果這些密鑰已經失效或只是示例，可以直接允許：

1. **Google OAuth Client ID**:
   - 訪問: https://github.com/waitinchen/megan/security/secret-scanning/unblock-secret/365pCRNAls9mE3p1AwpmoZzS5Kd

2. **Google OAuth Client Secret (第一個)**:
   - 訪問: https://github.com/waitinchen/megan/security/secret-scanning/unblock-secret/365pCOkrtXe4HiYpwnHIqgbvvMQ

3. **Google OAuth Client Secret (第二個)**:
   - 訪問: https://github.com/waitinchen/megan/security/secret-scanning/unblock-secret/365pCS5TnB4cWs7ku8n3GHzKyp0

在每個頁面上點擊「Allow this secret」即可。

### 方案 2: 清理敏感信息（如果密鑰仍在使用）

如果這些密鑰仍在使用，需要：

1. 從文檔中移除或遮罩敏感信息
2. 重新提交
3. 或者使用 Git 歷史重寫（不推薦，會改變歷史）

## 建議

由於這些文檔文件是故障排除指南，包含的是示例或測試用的憑證：
- 如果已經失效 → 使用方案 1 直接允許
- 如果仍在使用 → 需要清理這些文件

**立即行動**: 訪問上面的 URL，允許這些密鑰，然後重新執行 `git push`。

