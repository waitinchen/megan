# 📘 Timeline API v4 技術指引

**版本**: 2025.11  
**負責人**: 謀謀（初版） → C 謀（交接）

---

## 1. 系統架構概述（1 分鐘掌握）

Timeline API v4 是一個 Cloudflare Worker + KV 的事件儲存系統。

### 核心功能

| 功能 | 說明 |
|------|------|
| POST /timeline | 儲存事件（使用 `${userId}:${timestamp}` 當 key） |
| GET /timeline?user=<id> | 讀取該用戶的所有事件 |
| TTL（7 天） | 自動過期清除舊事件 |

### 必備資源

- **Worker**: `megan-timeline`
- **KV Namespace**: `MEGAN_TIMELINE`（已綁定）
- **前端 Service**: `app/lib/timeline/timeline-service.ts`

---

## 2. Cloudflare Worker 設定

### 2.1 Worker 需綁定 KV

Cloudflare Dashboard →
Workers & Pages > megan-timeline > Bindings > Add binding

- **Type**: KV namespace
- **Variable name**: `MEGAN_TIMELINE`
- **KV Namespace**: `megan-timeline`（或最新版）

---

## 3. Timeline Worker v4 — 最終代碼

❗ **C 謀直接複製即可。**（此即目前線上使用的版本。）

完整代碼請參考：`cloudflare-workers/timeline-worker.js`

### 關鍵特點：

1. **POST /timeline**
   - 接收 `{ userId, event }`
   - 生成 key: `${userId}:${timestamp}`
   - 返回 `{ ok: true, saved: { key, timestamp } }`

2. **GET /timeline?user=<id>**
   - 使用 `user` 參數（不是 `userId`）
   - 返回 `{ ok: true, events: [{ key, timestamp, data }] }`
   - 自動按 timestamp 降序排序

3. **CORS 支持**
   - 完整的 CORS headers
   - 支持 OPTIONS preflight

---

## 4. 前端整合（C 謀必讀）

前端統一透過：`app/lib/timeline/timeline-service.ts`

### 4.1 saveTimeline(userId, event)

```typescript
export async function saveTimeline(userId: string, event: any) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_TIMELINE_URL}/timeline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, event }),
  });

  return res.json();
}
```

### 4.2 listTimeline(userId)

```typescript
export async function listTimeline(userId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_TIMELINE_URL}/timeline?user=${userId}`,
    { method: "GET" }
  );

  return res.json();
}
```

---

## 5. API 使用示例（Postman / 前端）

### POST 新事件

```http
POST https://megan-timeline.xxxxx.workers.dev/timeline
Content-Type: application/json

{
  "userId": "waitin",
  "event": {
    "type": "chat",
    "content": "Hello Megan!"
  }
}
```

**響應**:
```json
{
  "ok": true,
  "saved": {
    "key": "waitin:1704067200000",
    "timestamp": 1704067200000
  }
}
```

### GET 所有事件

```http
GET https://megan-timeline.xxxxx.workers.dev/timeline?user=waitin
```

**響應**:
```json
{
  "ok": true,
  "events": [
    {
      "key": "waitin:1704067200000",
      "timestamp": 1704067200000,
      "data": {
        "type": "chat",
        "content": "Hello Megan!"
      }
    }
  ]
}
```

---

## 6. 常見錯誤（C 謀 debug 用）

| 問題 | 解法 |
|------|------|
| 回應 500，TypeError: env.MEGAN_TIMELINE undefined | 重新綁定 KV |
| GET 回傳空陣列 | prefix 不對 → key 必須 `${userId}:${timestamp}` |
| CORS 被擋 | 確認 headers 是否照 Worker 程式碼 |
| GET 參數錯誤 | 使用 `?user=` 而不是 `?userId=` |

---

## 7. 環境變數（Next.js）

放在 `.env.local`：

```env
NEXT_PUBLIC_TIMELINE_URL=https://megan-timeline.<your-id>.workers.dev
```

---

## 8. 交接說明（給 C 謀）

### 你需要負責的部分：

- ✅ 維護 timeline worker 穩定性
- ✅ 擴充事件格式（如：角色、voiceTag、情緒 metadata）
- ✅ 做批量匯出（後續會用於小軟記憶體存檔）
- ✅ 若未來要接 Supabase，負責撰寫同步腳本
- ✅ 與 Memory v5 保持資料結構一致性

### 你不需處理的事：

- ✔ KV namespace 建立（已建）
- ✔ Worker 部署（已部署）
- ✔ Next.js 整合（已完成）
- ✔ API 流程與 TTL（已定版）

---

## 9. Key 結構說明

### Timeline Keys
- **格式**: `${userId}:${timestamp}`
- **範例**: `waitin:1704067200000`
- **TTL**: 7 天

### 查詢方式
- 使用 KV `list({ prefix: '${userId}:' })` 查詢所有該用戶的事件
- 自動按 timestamp 降序排序

---

## 10. 測試檢查清單

### Worker 部署
- [ ] Worker 已部署並可訪問
- [ ] KV namespace `MEGAN_TIMELINE` 已綁定
- [ ] CORS headers 正確設置
- [ ] POST 請求成功保存事件
- [ ] GET 請求成功返回事件列表

### 前端整合
- [ ] `NEXT_PUBLIC_TIMELINE_URL` 環境變數已設置
- [ ] `saveTimeline()` 函數正常工作
- [ ] `listTimeline()` 函數正常工作
- [ ] 聊天時自動保存到 Timeline
- [ ] 事件按時間戳正確排序

---

## 11. 相關文件

- **Worker 代碼**: `cloudflare-workers/timeline-worker.js`
- **前端 Service**: `app/lib/timeline/timeline-service.ts`
- **API Route**: `app/api/timeline/route.ts`
- **類型定義**: `app/lib/timeline/timeline-types.ts`
