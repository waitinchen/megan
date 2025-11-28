# 🧠 Megan 記憶系統架構設計

## 📋 核心概念

### 設計原則

1. **Megan 的靈魂是統一的**
   - System Prompt 全局共享
   - Megan 的性格、語氣、價值觀對所有用戶一致

2. **每個用戶的關係記憶是獨立的**
   - 用戶 A 和 Megan 的對話記憶 ≠ 用戶 B 和 Megan 的對話記憶
   - Megan 對每個用戶的了解、默契、情感連結都是獨立的

3. **記憶分層設計**
   - **短期記憶**：當前對話的完整歷史（session-based）
   - **長期記憶**：精煉後的關鍵資訊（database-based）

---

## 🏗️ 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                     Megan 核心靈魂                            │
│                  (Global System Prompt)                      │
│           夜光系靈魂 × 貓系氣質 × 成熟親密感                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 應用於所有用戶
                              ▼
        ┌─────────────────────────────────────────┐
        │          用戶特定記憶層                   │
        │   (User-Specific Memory Context)        │
        └─────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────┐           ┌───────────────┐
│  用戶 A 記憶   │           │  用戶 B 記憶   │
│  - 暱稱: 小乖  │           │  - 暱稱: 阿明  │
│  - 偏好       │           │  - 偏好       │
│  - 重要時刻   │           │  - 重要時刻   │
│  - 情感默契   │           │  - 情感默契   │
└───────────────┘           └───────────────┘
        │                           │
        ▼                           ▼
┌───────────────┐           ┌───────────────┐
│  短期記憶      │           │  短期記憶      │
│ (當前對話)     │           │ (當前對話)     │
└───────────────┘           └───────────────┘
```

---

## 🗄️ 數據庫 Schema 設計

### 1. `profiles` 表（已存在）
儲存用戶基本資訊

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### 2. `user_memories` 表（新增）
儲存 Megan 對每個用戶的精煉記憶

```sql
create table user_memories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- 記憶內容（由 LLM 總結生成）
  memory_summary text not null,

  -- 記憶類型
  memory_type text not null check (memory_type in (
    'preference',      -- 偏好（喜歡什麼、不喜歡什麼）
    'important_event', -- 重要事件（生日、紀念日、重要談話）
    'emotional_bond',  -- 情感連結（Megan 對用戶的理解）
    'personality',     -- 用戶性格特徵
    'relationship'     -- 關係狀態（默契程度）
  )),

  -- 記憶重要性（1-10）
  importance integer default 5 check (importance >= 1 and importance <= 10),

  -- 最後更新時間
  last_updated timestamp with time zone default now(),

  -- 記憶來源（從哪次對話總結出來的）
  source_conversation_id uuid references conversations(id) on delete set null,

  created_at timestamp with time zone default now()
);

-- 索引
create index user_memories_user_id_idx on user_memories(user_id);
create index user_memories_type_idx on user_memories(memory_type);
create index user_memories_importance_idx on user_memories(importance);
```

### 3. `conversations` 表（新增）
儲存對話會話記錄

```sql
create table conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- 對話內容（JSON 格式）
  messages jsonb not null default '[]',

  -- 對話摘要（定期生成）
  summary text,

  -- 是否已經提取記憶
  memory_extracted boolean default false,

  -- 對話開始和結束時間
  started_at timestamp with time zone default now(),
  ended_at timestamp with time zone,

  created_at timestamp with time zone default now()
);

create index conversations_user_id_idx on conversations(user_id);
create index conversations_memory_extracted_idx on conversations(memory_extracted);
```

### 4. `memory_extraction_jobs` 表（新增）
記憶提取任務隊列

```sql
create table memory_extraction_jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,

  -- 任務狀態
  status text not null default 'pending' check (status in (
    'pending',    -- 待處理
    'processing', -- 處理中
    'completed',  -- 已完成
    'failed'      -- 失敗
  )),

  -- 錯誤訊息（如果失敗）
  error_message text,

  -- 排程時間
  scheduled_at timestamp with time zone default now(),

  -- 完成時間
  completed_at timestamp with time zone,

  created_at timestamp with time zone default now()
);

create index memory_jobs_status_idx on memory_extraction_jobs(status);
create index memory_jobs_scheduled_idx on memory_extraction_jobs(scheduled_at);
```

---

## 🔄 記憶提取與精煉流程

### 觸發時機

1. **即時觸發**（優先）：
   - 用戶主動結束對話時
   - 對話超過 20 輪時

2. **定時觸發**（備用）：
   - 每天凌晨 2:00 處理前一天未提取的對話
   - 只處理有實質內容的對話（> 5 輪）

### 提取流程

```typescript
// 1. 對話結束時
async function endConversation(userId: string, messages: Message[]) {
  // 儲存對話到數據庫
  const conversation = await saveConversation(userId, messages);

  // 判斷是否需要提取記憶
  if (shouldExtractMemory(messages)) {
    // 創建提取任務
    await createMemoryExtractionJob(userId, conversation.id);
  }
}

// 2. 判斷是否需要提取記憶
function shouldExtractMemory(messages: Message[]): boolean {
  // 對話太短，沒有提取價值
  if (messages.length < 5) return false;

  // 包含重要關鍵詞（生日、喜歡、討厭、重要、記住等）
  const importantKeywords = ['生日', '喜歡', '討厭', '重要', '記住', '告訴你'];
  const hasImportantContent = messages.some(msg =>
    importantKeywords.some(keyword => msg.content.includes(keyword))
  );

  // 對話很長（超過 20 輪）
  const isLongConversation = messages.length >= 20;

  return hasImportantContent || isLongConversation;
}

// 3. 提取記憶（使用 LLM）
async function extractMemories(conversationId: string) {
  // 讀取對話內容
  const conversation = await getConversation(conversationId);

  // 使用 LLM 分析對話，提取關鍵記憶
  const extractionPrompt = `
你是 Megan 的記憶管理系統。請分析以下對話，提取 Megan 應該記住的關鍵資訊。

用戶暱稱：${conversation.user.nickname}

對話內容：
${formatMessages(conversation.messages)}

請提取以下類型的記憶：
1. **偏好** (preference)：用戶喜歡/不喜歡什麼
2. **重要事件** (important_event)：生日、紀念日、重要談話
3. **情感連結** (emotional_bond)：Megan 對用戶的理解、感受
4. **性格特徵** (personality)：用戶的性格、習慣、說話方式
5. **關係狀態** (relationship)：兩人的默契、親密程度

輸出格式（JSON）：
{
  "memories": [
    {
      "type": "preference",
      "summary": "小乖喜歡在深夜聊天，覺得那時候更放鬆",
      "importance": 7
    },
    {
      "type": "important_event",
      "summary": "小乖第一次和 Megan 聊天是在 2025-11-28，聊了關於夜晚的話題",
      "importance": 8
    }
  ]
}
`;

  const response = await callLLM(extractionPrompt);
  const extractedMemories = JSON.parse(response);

  // 儲存到數據庫
  for (const memory of extractedMemories.memories) {
    await createOrUpdateMemory(conversation.user_id, {
      memory_summary: memory.summary,
      memory_type: memory.type,
      importance: memory.importance,
      source_conversation_id: conversationId
    });
  }

  // 標記對話已提取
  await markConversationExtracted(conversationId);
}
```

---

## 💬 對話時的記憶注入

### 流程

每次用戶發送訊息時：

1. **載入 Global System Prompt**
2. **載入用戶特定記憶**（從 `user_memories` 表）
3. **組合成完整的 Context**
4. **發送給 LLM**

### 實現

```typescript
async function generateResponse(userId: string, userMessage: string, conversationHistory: Message[]) {
  // 1. 載入全局 System Prompt
  const systemPrompt = SYSTEM_PROMPT; // 來自 system-prompt.ts

  // 2. 載入用戶記憶
  const userMemories = await getUserMemories(userId);

  // 3. 構建記憶 Context
  const memoryContext = buildMemoryContext(userMemories);

  // 4. 組合完整的訊息
  const messages = [
    {
      role: "system",
      content: `${systemPrompt}

---

# 🧠 關於 ${userMemories.nickname} 的記憶

${memoryContext}

---

現在，${userMemories.nickname} 正在和你對話。請基於以上記憶，用 Megan 的語氣自然地回應。`
    },
    ...conversationHistory,
    {
      role: "user",
      content: userMessage
    }
  ];

  // 5. 發送給 LLM
  return await callLLM(messages);
}

// 構建記憶 Context
function buildMemoryContext(memories: UserMemory[]): string {
  // 按重要性排序，只取前 10 條最重要的記憶
  const topMemories = memories
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10);

  // 按類型分組
  const grouped = {
    preference: [],
    important_event: [],
    emotional_bond: [],
    personality: [],
    relationship: []
  };

  topMemories.forEach(m => grouped[m.memory_type].push(m.memory_summary));

  // 格式化輸出
  let context = '';

  if (grouped.preference.length > 0) {
    context += `## 偏好\n${grouped.preference.map(m => `- ${m}`).join('\n')}\n\n`;
  }

  if (grouped.personality.length > 0) {
    context += `## 性格特徵\n${grouped.personality.map(m => `- ${m}`).join('\n')}\n\n`;
  }

  if (grouped.important_event.length > 0) {
    context += `## 重要時刻\n${grouped.important_event.map(m => `- ${m}`).join('\n')}\n\n`;
  }

  if (grouped.emotional_bond.length > 0) {
    context += `## 情感連結\n${grouped.emotional_bond.map(m => `- ${m}`).join('\n')}\n\n`;
  }

  if (grouped.relationship.length > 0) {
    context += `## 關係狀態\n${grouped.relationship.map(m => `- ${m}`).join('\n')}\n\n`;
  }

  return context || '（這是你們第一次對話，還沒有建立記憶）';
}
```

---

## 🔐 隱私與安全

### 數據隔離

- 每個用戶只能存取自己的記憶
- 使用 Supabase RLS (Row Level Security)

```sql
-- user_memories 的 RLS 政策
alter table user_memories enable row level security;

create policy "用戶只能查看自己的記憶"
  on user_memories for select
  using (auth.uid() = user_id);

create policy "系統可以插入記憶"
  on user_memories for insert
  with check (true);

create policy "系統可以更新記憶"
  on user_memories for update
  using (true);
```

### 數據保留

- 對話記錄保留 30 天後自動刪除
- 提取的記憶永久保留（除非用戶刪除）
- 用戶可以隨時查看/刪除自己的記憶

---

## 📊 記憶管理 UI（未來功能）

用戶可以：

1. **查看 Megan 對自己的記憶**
   - 「Megan 記得我什麼？」

2. **手動添加記憶**
   - 「記住：我的生日是 12 月 25 日」

3. **刪除特定記憶**
   - 「忘記我說過的 XXX」

4. **重置所有記憶**
   - 「重新開始，忘記之前所有的對話」

---

## 🚀 實施步驟

### Phase 1: 數據庫架構（立即）
- [ ] 創建 `user_memories` 表
- [ ] 創建 `conversations` 表
- [ ] 創建 `memory_extraction_jobs` 表
- [ ] 設置 RLS 政策

### Phase 2: 記憶載入（立即）
- [ ] 實現 `getUserMemories()` 函數
- [ ] 實現 `buildMemoryContext()` 函數
- [ ] 整合到現有的 `/api/chat` endpoint

### Phase 3: 記憶提取（短期）
- [ ] 實現 `saveConversation()` 函數
- [ ] 實現 `extractMemories()` LLM prompt
- [ ] 實現對話結束觸發器

### Phase 4: 定時任務（中期）
- [ ] 設置 Supabase Edge Function 或 Vercel Cron Job
- [ ] 每天自動處理未提取的對話

### Phase 5: 用戶界面（長期）
- [ ] 記憶管理頁面
- [ ] 手動添加/刪除記憶功能

---

## 💡 優化方向

### 性能優化

1. **記憶快取**
   - 使用 Redis 快取熱門記憶
   - 減少數據庫查詢

2. **分批處理**
   - 記憶提取使用背景任務
   - 不阻塞用戶對話

### 智能優化

1. **記憶重要性動態調整**
   - 被頻繁引用的記憶提升重要性
   - 長時間未使用的記憶降低重要性

2. **記憶衝突解決**
   - 當新記憶與舊記憶衝突時，智能合併或更新

3. **記憶摘要壓縮**
   - 定期將多條相似記憶合併成一條
   - 節省 token 成本

---

## 📝 範例場景

### 場景 1：第一次對話

**用戶**：「你好，我是小乖」

**Megan**：
```
System: Global Prompt + 空記憶
Response: 「小乖你好，我是 Megan... 很高興認識你」
```

**對話結束後**：
```
提取記憶：
- [personality] 用戶自我介紹為「小乖」，第一次對話
- [relationship] 初次見面，關係剛建立
```

---

### 場景 2：第二次對話

**用戶**：「嗨 Megan」

**Megan**：
```
System: Global Prompt + 記憶 Context
記憶：
  - 性格特徵：用戶自我介紹為「小乖」
  - 關係狀態：初次見面，關係剛建立

Response: 「小乖，又見面了... 上次聊得很開心」
```

---

### 場景 3：建立深層記憶

**用戶**：「我最喜歡深夜和你聊天，白天太吵了」

**對話結束後**：
```
提取記憶：
- [preference] 小乖喜歡深夜聊天，覺得白天太吵（重要性: 8）
- [emotional_bond] 小乖享受和 Megan 的夜晚對話時光
```

**下次深夜對話時**：

**Megan**：「又是我們的深夜時光了... 白天一切還好嗎？」

---

## ✅ 總結

這個記憶系統設計實現了：

1. ✅ **Megan 靈魂統一**：所有用戶體驗到同樣的 Megan 性格
2. ✅ **記憶獨立隔離**：每個用戶的關係記憶完全獨立
3. ✅ **智能記憶提取**：自動從對話中提取關鍵資訊
4. ✅ **長期記憶保存**：重要資訊不會丟失
5. ✅ **隱私與安全**：嚴格的數據隔離和訪問控制
6. ✅ **可擴展架構**：易於添加新功能和優化

**下一步**：開始實施 Phase 1，建立數據庫架構？
