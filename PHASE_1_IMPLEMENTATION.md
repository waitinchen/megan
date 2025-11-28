# 🚀 Phase 1 實施指南 - 記憶系統基礎架構

## ✅ 已完成的準備工作

1. ✅ Cloudflare Worker API (Tone Memory Core) - 已部署
2. ✅ 數據庫 Schema 設計 - `database/schema.sql`
3. ✅ Memory Service - `app/lib/memory/memory-service.ts`
4. ✅ 環境變數配置 - `.env.local`

---

## 📋 Phase 1 實施步驟

### Step 1: 建立 Supabase 數據庫表 ⏳

**操作步驟：**

1. 打開 [Supabase Dashboard](https://supabase.com/dashboard/project/tqummhyhohacbkmpsgae)
2. 點擊左側選單的 **SQL Editor**
3. 點擊 **New query**
4. 複製 `database/schema.sql` 的內容
5. 貼上並點擊 **Run**

**預期結果：**

```
✅ profiles 表已更新（補充新欄位）
✅ conversations 表已創建
✅ daily_summaries 表已創建
✅ memory_extraction_jobs 表已創建
✅ kv_sync_log 表已創建
✅ RLS 政策已設置
✅ 觸發器已創建
✅ 實用函數已創建
✅ 管理員視圖已創建
```

**驗證：**

```sql
-- 在 SQL Editor 中執行以下查詢驗證
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'profiles',
  'conversations',
  'daily_summaries',
  'memory_extraction_jobs',
  'kv_sync_log'
);
```

應該看到 5 張表都存在。

---

### Step 2: 測試 Cloudflare Worker API ⏳

**操作步驟：**

在瀏覽器或 Postman 中測試以下 API：

#### 2.1 測試基本 KV 讀寫

```bash
# 寫入測試記憶
curl -X POST https://tone-memory-core-1.waitin-chen.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "key": "test:user123:profile",
    "value": {
      "personality_summary": "測試用戶，性格溫和",
      "emotion_patterns": "偶爾焦慮，但整體正向"
    }
  }'

# 讀取記憶
curl "https://tone-memory-core-1.waitin-chen.workers.dev?key=test:user123:profile"
```

**預期結果：**

```json
{
  "personality_summary": "測試用戶，性格溫和",
  "emotion_patterns": "偶爾焦慮，但整體正向"
}
```

#### 2.2 測試管理員 API

```bash
# 獲取用戶記憶
curl https://tone-memory-core-1.waitin-chen.workers.dev/admin/user/test-user-id/memory
```

**預期結果：**

```json
{
  "profile": {},
  "preferences": {},
  "relationship": {},
  "longterm": {}
}
```

---

### Step 3: 整合記憶載入到對話流程 ⏳

修改 `app/api/chat/route.ts` 來載入用戶記憶。

**修改位置：**

找到 `/api/chat` 的 POST handler，在調用 LLM 之前載入記憶。

**修改內容：**

```typescript
// app/api/chat/route.ts
import { getUserMemories, buildMemoryContext } from '@/app/lib/memory/memory-service';
import { SYSTEM_PROMPT } from '@/app/lib/soul/system-prompt';

export async function POST(request: Request) {
  const { messages, userIdentity } = await request.json();

  // 🆕 載入用戶記憶
  const userId = getUserIdFromRequest(request); // 從 session 獲取
  const memories = await getUserMemories(userId);
  const memoryContext = buildMemoryContext(userIdentity, memories);

  // 組合完整的 System Prompt
  const fullSystemPrompt = `${SYSTEM_PROMPT}

---

# 🧠 關於 ${userIdentity} 的記憶

${memoryContext}

---

現在，${userIdentity} 正在和你對話。請基於以上記憶，用 Megan 的語氣自然地回應。`;

  // 構建完整的訊息
  const fullMessages = [
    {
      role: "system",
      content: fullSystemPrompt
    },
    ...messages
  ];

  // 調用 LLM（Gemini）
  const response = await callLLM(fullMessages);

  return Response.json(response);
}
```

**完整修改文件（我現在幫你創建）：**

---

### Step 4: 更新前端對話組件 ⏳

修改 `app/page.tsx`，在對話結束時保存到 Supabase。

**添加功能：**

1. 當用戶登出時，保存對話到 `conversations` 表
2. 判斷是否需要提取記憶
3. 如果需要，創建記憶提取任務

---

### Step 5: 測試完整流程 ⏳

#### 5.1 測試場景 1：新用戶首次對話

1. 登入為新用戶（例如：小乖）
2. 與 Megan 對話 5 輪以上
3. 提到「我喜歡深夜聊天」
4. 結束對話

**預期結果：**

- ✅ 對話保存到 `conversations` 表
- ✅ 記憶提取任務創建（`memory_extraction_jobs` 表）
- ✅ （暫時手動）記憶提取到 KV

#### 5.2 測試場景 2：老用戶再次對話

1. 手動在 KV 中設置記憶：
   ```json
   {
     "key": "user:<userId>:preferences",
     "value": {
       "preferred_tone": "溫柔、慢節奏",
       "avoid_topics": ["政治", "宗教"],
       "chat_pace": "slow"
     }
   }
   ```

2. 再次登入為同一用戶
3. 與 Megan 對話

**預期結果：**

- ✅ Megan 記得用戶的偏好
- ✅ Megan 使用溫柔、慢節奏的語氣
- ✅ Megan 避開敏感話題

---

## 🧪 測試 Checklist

- [ ] Supabase 數據庫表已創建
- [ ] Cloudflare Worker API 可以讀寫 KV
- [ ] Memory Service 可以獲取用戶記憶
- [ ] 記憶 Context 正確注入到 System Prompt
- [ ] Megan 根據記憶調整回應
- [ ] 對話保存到 Supabase
- [ ] 記憶提取任務正確創建

---

## 📝 下一步（Phase 2）

Phase 1 完成後，我們將實施：

1. **記憶提取功能**（使用 GPT 自動分析對話）
2. **每日摘要生成**（Cron Job）
3. **記憶合併到 longterm**（自動更新）

---

## 🐛 故障排除

### 問題 1：無法連接 Cloudflare Worker API

**檢查：**

1. `.env.local` 中的 `NEXT_PUBLIC_MEMORY_API_URL` 是否正確
2. Cloudflare Worker 是否已部署
3. CORS 設定是否允許你的域名

**解決：**

在 Cloudflare Worker 中添加 CORS headers：

```typescript
// worker.ts
export default {
  async fetch(request, env) {
    const response = await handleRequest(request, env);

    // 添加 CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
  }
}
```

### 問題 2：Supabase RLS 阻止訪問

**檢查：**

1. 用戶是否已登入
2. `auth.uid()` 是否正確

**解決：**

在 Supabase Dashboard 暫時禁用 RLS 進行測試：

```sql
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
```

測試完成後記得重新啟用：

```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
```

### 問題 3：記憶載入失敗

**檢查：**

1. Network tab 查看 API 請求是否成功
2. Console 查看錯誤訊息

**解決：**

添加詳細的日誌：

```typescript
console.log('[Memory Service] 正在載入記憶:', userId);
console.log('[Memory Service] API URL:', MEMORY_API_URL);
console.log('[Memory Service] 記憶內容:', memories);
```

---

## ✅ Phase 1 完成標準

當以下所有項目都完成時，Phase 1 即算完成：

1. ✅ 數據庫表已創建並可用
2. ✅ Cloudflare Worker API 正常運作
3. ✅ Memory Service 可以成功載入用戶記憶
4. ✅ 記憶 Context 正確注入到對話
5. ✅ Megan 能夠根據記憶調整回應
6. ✅ 對話自動保存到 Supabase
7. ✅ 至少完成一次端到端測試

---

**準備好開始了嗎？** 🚀

從 Step 1 開始，建立 Supabase 數據庫表！
