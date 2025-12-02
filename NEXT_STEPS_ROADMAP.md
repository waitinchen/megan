# 🗺️ Megan 平台後續開發路線圖

**當前狀態**: OAuth PKCE 修復完成 ✅  
**下一步選擇**: 請選擇以下路線之一

---

## 🅰️ 路線 A：微信登入 (WeChat OAuth) 準備 + 審核補件

### 📋 當前狀態

- ✅ 微信登入按鈕 UI 已完成（顯示為「開發中」）
- ❌ 微信 OAuth 功能未實現
- ❌ 微信網站應用未綁定 AppID

### 🎯 目標

完成微信 OAuth 登入功能，讓用戶可以使用微信帳號登入。

### 📝 任務清單

#### 階段 1：找回微信帳號和應用

- [ ] 定位之前使用的微信開發者帳號
- [ ] 登入微信公眾平台
- [ ] 找到或重新創建網站應用

#### 階段 2：配置微信 OAuth

- [ ] 獲取微信 AppID 和 AppSecret
- [ ] 配置回調域名：`https://megan.tonetown.ai/auth/wechat/callback`
- [ ] 在 Supabase 中配置微信 Provider
- [ ] 設置環境變數

#### 階段 3：實現微信 OAuth 流程

- [ ] 創建 `/api/auth/wechat/login` 端點
- [ ] 創建 `/api/auth/wechat/callback` 端點
- [ ] 更新 `LoginWithWeChatButton` 組件
- [ ] 測試微信 OAuth 流程

#### 階段 4：提交審核

- [ ] 準備審核材料
- [ ] 提交微信網站應用審核
- [ ] 等待審核通過

### ⏱️ 預計時間

- 階段 1-2: 1-2 小時
- 階段 3: 2-3 小時
- 階段 4: 等待審核（1-7 天）

### 📚 相關文檔

- `components/auth/LoginWithWeChat.tsx` - 微信登入按鈕組件
- `app/api/auth/wechat/` - 微信 OAuth API 路由（待實現）

---

## 🅱️ 路線 B：語音 AGENT / 花小軟 Voice Agent 進度銜接

### 📋 當前狀態

- ✅ Chat API 已實現 (`/api/chat`)
- ✅ ElevenLabs 語音合成已集成
- ✅ 情緒標籤系統已實現
- ⏳ 即時語音串流待實現
- ⏳ WebSocket 連接待實現

### 🎯 目標

完成即時語音對話功能，實現單回路 Voice Agent。

### 📝 任務清單

#### 階段 1：WebSocket 基礎設施

- [ ] 設置 WebSocket 服務器（Next.js API Route 或獨立服務）
- [ ] 實現客戶端 WebSocket 連接
- [ ] 實現心跳機制和連接管理
- [ ] 處理連接斷開和重連

#### 階段 2：語音輸入處理

- [ ] 集成瀏覽器語音識別 API（Web Speech API）
- [ ] 或集成第三方語音識別服務
- [ ] 實現語音轉文字（STT）
- [ ] 處理語音輸入流

#### 階段 3：即時語音輸出

- [ ] 實現 ElevenLabs 流式語音合成
- [ ] 通過 WebSocket 發送音頻流
- [ ] 客戶端接收並播放音頻
- [ ] 處理音頻緩衝和播放

#### 階段 4：情緒引擎集成

- [ ] 將情緒標籤傳遞給語音合成
- [ ] 根據情緒調整語音參數
- [ ] 實現語音情感表達

#### 階段 5：單回路 Voice Agent

- [ ] 整合語音輸入 → LLM → 語音輸出
- [ ] 實現對話上下文管理
- [ ] 處理中斷和恢復
- [ ] 優化延遲和體驗

### ⏱️ 預計時間

- 階段 1: 3-4 小時
- 階段 2: 2-3 小時
- 階段 3: 3-4 小時
- 階段 4: 1-2 小時
- 階段 5: 4-6 小時

**總計**: 約 13-19 小時

### 📚 相關文件

- `app/api/chat/route.ts` - Chat API
- `app/lib/elevenlabs-client.ts` - ElevenLabs 客戶端
- `app/lib/soul/emotion-tags.js` - 情緒標籤系統
- `app/lib/soul/llm-service.ts` - LLM 服務

---

## 🅾️ 路線 C：Megan 平台使用者設定 / Dashboard 功能

### 📋 當前狀態

- ✅ 登入系統已穩定
- ✅ Dashboard 基礎結構已建立
- ⏳ Avatar 上傳功能待實現
- ⏳ Favorites / Conversations 存儲待完善
- ⏳ Memory dashboard 待實現
- ⏳ Timeline 對接待完成

### 🎯 目標

完善用戶體驗，實現完整的 Dashboard 功能。

### 📝 任務清單

#### 階段 1：Avatar 上傳功能

- [ ] 實現圖片上傳 API (`/api/upload/avatar`)
- [ ] 集成 Supabase Storage 或 Cloudinary
- [ ] 實現圖片裁剪和優化
- [ ] 更新用戶 profile 中的 avatar_url
- [ ] 在 Dashboard 中顯示上傳的頭像

#### 階段 2：Favorites 功能完善

- [ ] 檢查 Favorites API 是否正常工作
- [ ] 實現 Favorites 列表頁面
- [ ] 實現添加/刪除 Favorites
- [ ] 實現搜索和篩選功能
- [ ] 優化 UI/UX

#### 階段 3：Conversations 存儲

- [ ] 檢查 Conversations API 是否正常工作
- [ ] 實現對話歷史列表
- [ ] 實現對話詳情頁面
- [ ] 實現對話搜索功能
- [ ] 實現對話刪除功能

#### 階段 4：Memory Dashboard

- [ ] 實現 Memory 列表顯示
- [ ] 實現 Memory 編輯功能
- [ ] 實現 Memory 刪除功能
- [ ] 實現 Memory 搜索和篩選
- [ ] 顯示 Memory 統計信息

#### 階段 5：Timeline 對接

- [ ] 檢查 Timeline API 連接
- [ ] 實現 Timeline 事件顯示
- [ ] 實現 Timeline 過濾和搜索
- [ ] 實現 Timeline 統計圖表
- [ ] 優化 Timeline 性能

### ⏱️ 預計時間

- 階段 1: 3-4 小時
- 階段 2: 2-3 小時
- 階段 3: 2-3 小時
- 階段 4: 3-4 小時
- 階段 5: 2-3 小時

**總計**: 約 12-17 小時

### 📚 相關文件

- `app/dashboard/profile/page.tsx` - Profile 頁面
- `app/dashboard/favorites/page.tsx` - Favorites 頁面
- `app/dashboard/history/page.tsx` - Conversations 歷史
- `app/dashboard/memory/page.tsx` - Memory 頁面
- `app/api/favorites/route.ts` - Favorites API
- `app/api/conversations/route.ts` - Conversations API
- `app/api/timeline/route.ts` - Timeline API

---

## 🎯 路線選擇建議

### 如果你想要：

**快速見效** → 選擇 **路線 C**
- 功能明確，容易實現
- 可以快速看到成果
- 提升用戶體驗

**技術挑戰** → 選擇 **路線 B**
- 涉及實時通信和音頻處理
- 技術難度較高
- 完成後功能強大

**擴展用戶群** → 選擇 **路線 A**
- 微信用戶基數大
- 需要等待審核
- 長期價值高

---

## 📝 下一步行動

1. **完成 OAuth 驗收**（使用 `OAUTH_FINAL_VERIFICATION_CHECKLIST.md`）

2. **選擇路線**：
   - [ ] 路線 A：微信登入
   - [ ] 路線 B：Voice Agent
   - [ ] 路線 C：Dashboard 功能

3. **開始執行**：
   - 告訴我你選擇的路線
   - 我會提供詳細的實施計劃和代碼

---

**準備好了嗎？讓我們繼續前進！** 🚀


