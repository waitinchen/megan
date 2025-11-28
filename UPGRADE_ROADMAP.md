# 🚀 Megan 專案升級路線圖

**最後更新**: 2025-11-28

---

## ✅ v1.1 – 微升級（已完成）

### 實施日期: 2025-11-28

- [x] **收藏 → 加入「已收藏」狀態（防重複收藏）**
  - ✅ API 層面重複檢查
  - ✅ 前端狀態顯示
  - ✅ 視覺反饋（實心星號）

- [x] **收藏頁 → 搜尋功能**
  - ✅ 實時搜尋
  - ✅ 防抖處理
  - ✅ 模糊匹配

- [x] **收藏頁 → 時間排序切換（最新/最舊）**
  - ✅ 排序切換按鈕
  - ✅ API 支援排序參數
  - ✅ 即時更新

**詳見**: `UPGRADE_V1.1_COMPLETE.md`

---

## 🔄 v1.2 – 功能升級（規劃中）

### 預計開始: 待定

### 1. 對話歷史（完整 Chat History）

**功能描述**:
- 儲存完整對話記錄到資料庫
- 對話列表頁面，顯示所有歷史對話
- 點擊對話可恢復並繼續
- 對話搜索功能

**技術需求**:
- 新增 `conversations` 資料表
- 新增 `conversation_messages` 資料表
- 對話列表 API
- 對話恢復 API
- 前端對話列表頁面

**檔案規劃**:
- `database/conversations-table.sql`
- `app/api/conversations/route.ts`
- `app/dashboard/history/page.tsx`

---

### 2. 智慧主題分類（LLM Summary Tag）

**功能描述**:
- 使用 LLM 自動分析收藏內容
- 生成主題標籤（如：情感、日常、專業等）
- 收藏時自動分類
- 按主題篩選收藏

**技術需求**:
- 在收藏時調用 LLM 生成標籤
- 新增 `tags` 欄位到 `favorites` 表
- 標籤管理 API
- 前端標籤顯示和篩選

**檔案規劃**:
- `app/lib/llm/tag-generator.ts`
- `database/favorites-add-tags.sql`
- 更新收藏相關 API

---

### 3. 共享收藏（未來 premium 功能框架）

**功能描述**:
- 生成分享連結
- 公開/私人切換
- 訪問統計（未來）
- Premium 功能標記

**技術需求**:
- 新增 `share_token` 欄位
- 公開訪問 API（不需要登入）
- 分享頁面
- Premium 功能檢查

**檔案規劃**:
- `database/favorites-add-sharing.sql`
- `app/api/favorites/share/route.ts`
- `app/favorite/[token]/page.tsx`

---

## 🎙️ v2.0 – Megan Voice Agent（規劃中）

### 預計開始: v1.2 完成後

### 1. 全時語音等待模式

**功能描述**:
- 持續監聽語音輸入
- 自動檢測語音結束
- 無需點擊按鈕即可對話
- 語音活動指示器

**技術需求**:
- Web Speech API 持續監聽
- 語音活動檢測（VAD）
- 狀態管理（監聽中/處理中）
- UI 指示器

**檔案規劃**:
- `app/lib/voice/continuous-listener.ts`
- 更新 `app/page.tsx` 語音處理邏輯

---

### 2. WebSocket 即時語音

**功能描述**:
- WebSocket 即時語音流
- 低延遲語音回覆
- 即時語音處理
- 連接狀態管理

**技術需求**:
- WebSocket 伺服器（Next.js API Routes 或獨立服務）
- 語音流處理
- 即時 LLM 回應
- 即時語音合成

**檔案規劃**:
- `app/api/ws/route.ts` 或獨立 WebSocket 服務
- `app/lib/websocket/client.ts`
- 更新前端語音處理

---

### 3. 多語切換

**功能描述**:
- 支援多種語言切換
- 語言選擇器
- 自動語言檢測
- 語言特定設定

**技術需求**:
- 語言切換狀態管理
- 多語言語音合成
- LLM 多語言支援
- 前端語言選擇器

**檔案規劃**:
- `app/lib/language/manager.ts`
- `app/components/LanguageSelector.tsx`
- 更新系統提示支援多語言

---

### 4. 模組化人格系統

**功能描述**:
- 多種人格模式可選
- 人格切換功能
- 自定義人格設定
- 人格模板系統

**技術需求**:
- 人格配置系統
- 人格模板儲存
- 動態系統提示切換
- 人格選擇器 UI

**檔案規劃**:
- `app/lib/personality/manager.ts`
- `app/lib/personality/templates/`
- `database/personalities-table.sql`
- `app/dashboard/personality/page.tsx`

---

## 📋 實施優先級

### 高優先級（v1.2）
1. **對話歷史** - 核心功能，提升用戶體驗
2. **智慧主題分類** - 提升收藏管理效率

### 中優先級（v1.2）
3. **共享收藏** - 社交功能，可先實施框架

### 低優先級（v2.0）
- 所有 v2.0 功能 - 需要更多技術驗證和測試

---

## 🎯 里程碑

- [x] **v1.1 完成** - 2025-11-28
- [ ] **v1.2 完成** - 待定
- [ ] **v2.0 Alpha** - 待定
- [ ] **v2.0 正式版** - 待定

---

## 📝 注意事項

1. **版本相容性**: 每個版本升級都要考慮向後相容
2. **資料遷移**: 大版本升級需要資料遷移腳本
3. **測試**: 每個功能都需要完整測試
4. **文檔**: 功能完成後需要更新文檔

---

## 🔗 相關文件

- `UPGRADE_V1.1_COMPLETE.md` - v1.1 完成報告
- `專案現況總結.md` - 專案當前狀態
- `FAVORITE_FEATURE_COMPLETE.md` - 收藏功能完成報告
- `USER_DASHBOARD_COMPLETE.md` - 用戶儀表板完成報告

---

**最後更新**: 2025-11-28

