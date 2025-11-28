# 🌈 Megan 完整系統架構 v2.0

## 整合：記憶系統 + 靈格管理後台

---

## 🏗️ 系統架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                    🟣 Megan System Layer                         │
│                 Megan System Prompt（固定人格）                    │
│              夜光系靈魂 × 貓系氣質 × 成熟親密感                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│  🟦 User Interaction      │   │  🟫 Admin Panel           │
│  - ChatKit Web 前端        │   │  - 靈格管理後台 v1.0        │
│  - Voice Agent (花小軟/黃蓉)│   │  - 用戶管理                │
│                           │   │  - 記憶編輯                │
└───────────────────────────┘   │  - 對話紀錄查看             │
                │               │  - 每日摘要審查             │
                │               └───────────────────────────┘
                │                           │
                ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│         Cloudflare Worker: Tone Memory Core API                 │
│         - GET /memory/:userId/:type                             │
│         - POST /memory/:userId                                  │
│         - POST /conversation/:userId/log                        │
│         - GET /admin/users                                      │
│         - GET /admin/user/:userId/summary                       │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ 🟩 KV Storage │   │ 🟧 Supabase   │   │ 🟨 Processing │
│ (快速記憶層)    │   │ PostgreSQL    │   │   Layer       │
│               │   │ (對話紀錄)      │   │               │
│ - profile     │   │               │   │ - 每日摘要     │
│ - preferences │   │ conversations │   │ - 記憶精煉     │
│ - relationship│   │ user_memories │   │ - GPT 處理     │
│ - longterm    │   │ daily_summary │   │               │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## 🗄️ 數據儲存策略：混合架構

### 方案 A：Cloudflare KV + Supabase PostgreSQL（推薦）

| 數據類型 | 儲存位置 | 原因 | 訪問速度 |
|---------|---------|------|---------|
| **精煉記憶** | Cloudflare KV | 需要極快速度載入，全球分佈 | 5-20ms |
| **原始對話** | Supabase PostgreSQL | 需要查詢、分析、備份 | 50-200ms |
| **每日摘要** | Supabase PostgreSQL | 需要時間範圍查詢 | 50-200ms |
| **用戶資料** | Supabase PostgreSQL | 需要認證、RLS、關聯查詢 | 50-200ms |

#### KV 結構：

```typescript
// Cloudflare KV Keys
user:{userId}:profile       // 用戶人格摘要（Megan 的理解）
user:{userId}:preferences   // 長期偏好
user:{userId}:relationship  // 關係 × 默契
user:{userId}:longterm      // 長期總結（所有重要記憶的精華）
```

#### Supabase 表結構：

```sql
-- 1. profiles（用戶基本資料）
profiles
  - id (uuid)
  - nickname (text)
  - email (text)
  - created_at (timestamp)
  - updated_at (timestamp)

-- 2. conversations（對話會話）
conversations
  - id (uuid)
  - user_id (uuid)
  - messages (jsonb)        -- 完整對話內容
  - started_at (timestamp)
  - ended_at (timestamp)
  - message_count (int)
  - memory_extracted (bool) -- 是否已提取記憶

-- 3. daily_summaries（每日摘要）
daily_summaries
  - id (uuid)
  - user_id (uuid)
  - date (date)
  - emotion_trend (jsonb)   -- 情緒趨勢圖數據
  - new_learnings (text[])  -- Megan 學到的新東西
  - relationship_update (text) -- 關係更新
  - new_preferences (jsonb) -- 新發現的偏好
  - should_merge_to_longterm (bool) -- 是否應合併到長期記憶
  - created_at (timestamp)

-- 4. memory_extraction_jobs（記憶提取任務）
memory_extraction_jobs
  - id (uuid)
  - user_id (uuid)
  - conversation_id (uuid)
  - status (enum: pending/processing/completed/failed)
  - scheduled_at (timestamp)
  - completed_at (timestamp)
```

---

## 🔄 完整數據流程

### 1️⃣ 對話進行中（實時）

```typescript
// Frontend → API → KV
1. 用戶發送消息
2. API 從 KV 讀取用戶記憶（5-20ms）
3. 組合：System Prompt + KV Memory + 對話歷史
4. 發送給 LLM（Gemini/Claude）
5. 返回 Megan 的回應
6. 將對話追加到 Supabase conversations 表
```

### 2️⃣ 對話結束後（異步處理）

```typescript
// 判斷是否需要提取記憶
if (messages.length >= 5 || hasImportantKeywords) {
  // 創建提取任務
  await createMemoryExtractionJob(userId, conversationId);
}

// 背景任務（Cloudflare Worker Cron）
async function processMemoryExtractionJobs() {
  const jobs = await getPendingJobs();

  for (const job of jobs) {
    // 1. 讀取對話內容
    const conversation = await getConversation(job.conversation_id);

    // 2. 使用 GPT 提取記憶
    const memories = await extractMemoriesWithGPT(conversation);

    // 3. 更新 KV（快速記憶層）
    await updateKVMemory(job.user_id, memories);

    // 4. 標記任務完成
    await markJobCompleted(job.id);
  }
}
```

### 3️⃣ 每日摘要生成（定時任務）

```typescript
// 每天凌晨 2:00 運行（Cloudflare Worker Cron）
async function generateDailySummaries() {
  const yesterday = getYesterday();
  const users = await getActiveUsers(yesterday);

  for (const user of users) {
    // 1. 讀取昨天所有對話
    const conversations = await getConversationsByDate(user.id, yesterday);

    // 2. 使用 GPT 生成每日摘要
    const summary = await generateDailySummaryWithGPT(conversations);

    // 3. 儲存到 Supabase
    await saveDailySummary(user.id, yesterday, summary);

    // 4. 如果有重要更新，合併到 KV longterm
    if (summary.should_merge_to_longterm) {
      await mergeSummaryToLongterm(user.id, summary);
    }
  }
}
```

---

## 🎨 靈格管理後台 v1.0 實施方案

### 技術棧

- **Frontend**: Next.js 15 + React + Tailwind CSS
- **Backend**: Next.js API Routes + Supabase
- **KV Access**: Cloudflare API (通過 Worker 代理)
- **Auth**: Supabase Auth（只允許 Waitin 登入）
- **Charts**: Recharts / Chart.js

### 路由結構

```
/admin
  /login                    # 登入頁
  /dashboard                # 儀表板
  /users                    # 用戶列表
  /users/:userId            # 用戶總覽
  /users/:userId/memories   # 記憶總覽
  /users/:userId/memories/:key  # 記憶詳細編輯
  /users/:userId/conversations  # 對話紀錄
  /users/:userId/summaries      # 每日摘要
  /settings                 # 全局設定
```

---

## 📊 八大頁面詳細設計

### 1️⃣ 登入頁（`/admin/login`）

```tsx
// app/admin/login/page.tsx
export default function AdminLogin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <h1 className="text-2xl font-bold">ToneSpirit Admin</h1>
            <p className="text-slate-500">v1.0</p>
          </CardHeader>
          <CardContent>
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
            <button>Login</button>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-slate-400">© 2025 Superintelligence</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
```

**權限控制**：

```sql
-- Supabase RLS
create policy "只允許 Waitin 登入後台"
  on profiles for select
  using (auth.uid() = 'waitin-user-id');
```

---

### 2️⃣ 儀表板（`/admin/dashboard`）

**API Endpoints**:

```typescript
// app/api/admin/dashboard/route.ts
export async function GET() {
  const stats = {
    todayConversations: await getTodayConversationCount(),
    todayMemoryUpdates: await getTodayMemoryUpdateCount(),
    activeUsers: await getActiveUserCount(),
    avgPositiveEmotion: await getAvgPositiveEmotion(),
    recentUsers: await getRecentUsers(5),
    pendingReviews: await getPendingReviews()
  };

  return Response.json(stats);
}
```

**UI Components**:

```tsx
<Dashboard>
  <KPICards>
    <KPICard title="今日新增對話" value={stats.todayConversations} />
    <KPICard title="今日更新記憶" value={stats.todayMemoryUpdates} />
    <KPICard title="活躍用戶" value={stats.activeUsers} />
    <KPICard title="平均正向情緒" value={`${stats.avgPositiveEmotion}%`} />
  </KPICards>

  <RecentUsers users={stats.recentUsers} />

  <PendingReviews reviews={stats.pendingReviews} />
</Dashboard>
```

---

### 3️⃣ 用戶列表頁（`/admin/users`）

**API**:

```typescript
// app/api/admin/users/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');

  const users = await supabase
    .from('profiles')
    .select(`
      *,
      conversations(count),
      user_memories(count)
    `)
    .ilike('nickname', `%${search}%`)
    .range((page - 1) * 20, page * 20 - 1);

  return Response.json(users);
}
```

**UI Table**:

```tsx
<UsersTable>
  <thead>
    <tr>
      <th>用戶 ID</th>
      <th>暱稱</th>
      <th>最後對話時間</th>
      <th>記憶總量</th>
      <th>默契等級</th>
      <th>狀態</th>
      <th>操作</th>
    </tr>
  </thead>
  <tbody>
    {users.map(user => (
      <tr key={user.id}>
        <td>{user.id.slice(0, 8)}</td>
        <td>{user.nickname}</td>
        <td>{formatDate(user.last_conversation)}</td>
        <td>{user.memory_count}</td>
        <td>{calculateBondLevel(user)}</td>
        <td>{user.status}</td>
        <td>
          <Link href={`/admin/users/${user.id}`}>查看</Link>
        </td>
      </tr>
    ))}
  </tbody>
</UsersTable>
```

---

### 4️⃣ 用戶總覽頁（`/admin/users/:userId`）

**API**:

```typescript
// app/api/admin/users/[userId]/overview/route.ts
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  // 從 KV 讀取記憶
  const kvMemories = await getKVMemories(userId);

  // 從 Supabase 讀取用戶資料
  const profile = await getProfile(userId);

  // 從 Supabase 讀取統計數據
  const stats = await getUserStats(userId);

  return Response.json({
    profile,
    memories: kvMemories,
    stats
  });
}
```

**UI Sections**:

```tsx
<UserOverview>
  {/* A. 基本資料 */}
  <ProfileCard>
    <h2>{user.nickname}</h2>
    <p>年齡: {user.estimated_age || '未知'}</p>
    <p>性別: {user.estimated_gender || '未知'}</p>
    <p>職業: {user.estimated_occupation || '未知'}</p>
  </ProfileCard>

  {/* B. Megan 的核心理解 */}
  <CoreUnderstanding>
    <h3>此人是怎樣的人？</h3>
    <p>{kvMemories.profile.personality_summary}</p>

    <h3>常出現的情緒模式</h3>
    <p>{kvMemories.profile.emotion_patterns}</p>

    <h3>依賴 Megan 的方式</h3>
    <p>{kvMemories.relationship.dependency_pattern}</p>
  </CoreUnderstanding>

  {/* C. 偏好 */}
  <Preferences>
    <PreferenceItem>
      <label>喜歡的語氣</label>
      <p>{kvMemories.preferences.preferred_tone}</p>
    </PreferenceItem>
    <PreferenceItem>
      <label>避免的話題</label>
      <p>{kvMemories.preferences.avoid_topics.join(', ')}</p>
    </PreferenceItem>
  </Preferences>

  {/* D. 快速操作 */}
  <QuickActions>
    <Button href={`/admin/users/${userId}/memories`}>查看記憶</Button>
    <Button href={`/admin/users/${userId}/conversations`}>查看對話</Button>
    <Button onClick={forceResummarize}>強制重新摘要</Button>
  </QuickActions>
</UserOverview>
```

---

### 5️⃣ 記憶總覽頁（`/admin/users/:userId/memories`）

**API**:

```typescript
// app/api/admin/users/[userId]/memories/route.ts
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  // 從 Cloudflare KV 讀取所有記憶 keys
  const keys = [
    'profile',
    'preferences',
    'relationship',
    'longterm'
  ];

  const memories = await Promise.all(
    keys.map(async (key) => {
      const value = await KV.get(`user:${userId}:${key}`);
      const metadata = await KV.getWithMetadata(`user:${userId}:${key}`);

      return {
        key,
        size: new Blob([value]).size,
        lastUpdated: metadata.metadata?.lastUpdated,
        value: JSON.parse(value)
      };
    })
  );

  return Response.json({ memories });
}
```

**UI Table**:

```tsx
<MemoriesTable>
  <thead>
    <tr>
      <th>Key</th>
      <th>說明</th>
      <th>大小</th>
      <th>最後更新時間</th>
      <th>操作</th>
    </tr>
  </thead>
  <tbody>
    {memories.map(memory => (
      <tr key={memory.key}>
        <td><code>{memory.key}</code></td>
        <td>{getDescription(memory.key)}</td>
        <td>{formatBytes(memory.size)}</td>
        <td>{formatDate(memory.lastUpdated)}</td>
        <td>
          <Link href={`/admin/users/${userId}/memories/${memory.key}`}>
            查看/編輯
          </Link>
        </td>
      </tr>
    ))}
  </tbody>
</MemoriesTable>

<Actions>
  <Button onClick={exportAllMemories}>匯出全部記憶 (JSON)</Button>
  <Button onClick={importMemories}>匯入記憶</Button>
</Actions>
```

---

### 6️⃣ 記憶詳細頁（`/admin/users/:userId/memories/:key`）

**API**:

```typescript
// app/api/admin/users/[userId]/memories/[key]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { userId: string; key: string } }
) {
  const { userId, key } = params;

  const memory = await KV.getWithMetadata(`user:${userId}:${key}`);

  return Response.json({
    key,
    value: JSON.parse(memory.value),
    metadata: memory.metadata
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { userId: string; key: string } }
) {
  const { userId, key } = params;
  const body = await request.json();

  await KV.put(
    `user:${userId}:${key}`,
    JSON.stringify(body.value),
    {
      metadata: {
        lastUpdated: new Date().toISOString(),
        updatedBy: 'admin'
      }
    }
  );

  return Response.json({ success: true });
}
```

**UI**:

```tsx
<MemoryDetail>
  {/* 資訊列 */}
  <InfoBar>
    <InfoItem label="Key" value={memory.key} />
    <InfoItem label="最後更新" value={memory.metadata.lastUpdated} />
    <InfoItem label="字數" value={getWordCount(memory.value)} />
    <InfoItem label="大小" value={formatBytes(memory.size)} />
  </InfoBar>

  {/* 記憶內容編輯器 */}
  <Editor>
    <JSONEditor
      value={memory.value}
      onChange={handleChange}
      readOnly={false}
    />
  </Editor>

  {/* 操作按鈕 */}
  <Actions>
    <Button onClick={saveChanges}>儲存更新</Button>
    <Button onClick={cancelChanges}>取消修改</Button>
    <Button onClick={showDiff}>Diff 舊版</Button>
    <Button onClick={deleteMemory} danger>刪除</Button>
  </Actions>
</MemoryDetail>
```

---

### 7️⃣ 對話紀錄頁（`/admin/users/:userId/conversations`）

**API**:

```typescript
// app/api/admin/users/[userId]/conversations/route.ts
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');
  const keyword = searchParams.get('keyword');

  const conversations = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', params.userId)
    .gte('started_at', startDate)
    .lte('ended_at', endDate)
    .order('started_at', { ascending: false });

  return Response.json({ conversations });
}
```

**UI**:

```tsx
<ConversationLog>
  {/* 搜尋器 */}
  <SearchBar>
    <DateRangePicker onChange={setDateRange} />
    <Input placeholder="搜尋關鍵字..." onChange={setKeyword} />
    <Select onChange={setEmotionFilter}>
      <option value="all">所有情緒</option>
      <option value="happy">快樂</option>
      <option value="sad">悲傷</option>
      <option value="anxious">焦慮</option>
    </Select>
  </SearchBar>

  {/* 對話紀錄 */}
  <MessageList>
    {messages.map(msg => (
      <Message
        key={msg.id}
        role={msg.role}
        content={msg.content}
        emotion={msg.emotion}
        timestamp={msg.timestamp}
      />
    ))}
  </MessageList>

  {/* 匯出 */}
  <ExportButton onClick={exportConversations}>
    下載全部對話 (TXT/JSON)
  </ExportButton>
</ConversationLog>
```

**Message 組件（帶情緒上色）**:

```tsx
function Message({ role, content, emotion, timestamp }) {
  const emotionColors = {
    happy: 'bg-green-50 border-green-200',
    calm: 'bg-blue-50 border-blue-200',
    anxious: 'bg-yellow-50 border-yellow-200',
    sad: 'bg-gray-50 border-gray-200',
    angry: 'bg-red-50 border-red-200'
  };

  return (
    <div className={`p-4 rounded-lg ${emotionColors[emotion]}`}>
      <div className="flex justify-between">
        <strong>{role === 'user' ? user.nickname : 'Megan'}</strong>
        <span className="text-xs text-slate-500">{formatTime(timestamp)}</span>
      </div>
      <p>{content}</p>
      {emotion && <Badge>{emotion}</Badge>}
    </div>
  );
}
```

---

### 8️⃣ 每日摘要頁（`/admin/users/:userId/summaries`）

**API**:

```typescript
// app/api/admin/users/[userId]/summaries/route.ts
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || getTodayDate();

  const summary = await supabase
    .from('daily_summaries')
    .select('*')
    .eq('user_id', params.userId)
    .eq('date', date)
    .single();

  return Response.json({ summary });
}
```

**UI**:

```tsx
<DailySummary>
  {/* 日期選擇器 */}
  <DatePicker value={selectedDate} onChange={setSelectedDate} />

  {/* 情緒趨勢圖 */}
  <EmotionTrend>
    <LineChart data={summary.emotion_trend}>
      <XAxis dataKey="time" />
      <YAxis />
      <Line type="monotone" dataKey="happiness" stroke="#10b981" />
      <Line type="monotone" dataKey="anxiety" stroke="#f59e0b" />
    </LineChart>
  </EmotionTrend>

  {/* 今日 Megan 學到的新東西 */}
  <NewLearnings>
    <h3>🧠 今日 Megan 學到的新東西</h3>
    <ul>
      {summary.new_learnings.map((learning, i) => (
        <li key={i}>{learning}</li>
      ))}
    </ul>
  </NewLearnings>

  {/* 關係更新 */}
  <RelationshipUpdate>
    <h3>💞 今日關係更新</h3>
    <p>{summary.relationship_update}</p>
  </RelationshipUpdate>

  {/* 新偏好 */}
  <NewPreferences>
    <h3>✨ 今日新偏好</h3>
    <ul>
      {summary.new_preferences.map((pref, i) => (
        <li key={i}>{pref}</li>
      ))}
    </ul>
  </NewPreferences>

  {/* 操作按鈕 */}
  <Actions>
    <Button onClick={mergeToLongterm}>覆寫到 longterm</Button>
    <Button onClick={ignoreToday}>加入 ignored</Button>
    <Button onClick={manualEdit}>修改後手動寫入</Button>
  </Actions>
</DailySummary>
```

---

## 🔧 全局設定頁（`/admin/settings`）

```tsx
<Settings>
  {/* Megan System Prompt */}
  <Section>
    <h2>Megan System Prompt（主靈格）</h2>
    <Textarea
      value={systemPrompt}
      onChange={setSystemPrompt}
      rows={20}
    />
    <Button onClick={saveSystemPrompt}>儲存</Button>
  </Section>

  {/* 每日精煉規則 */}
  <Section>
    <h2>每日精煉規則</h2>
    <Input label="最大字數" value={maxWords} onChange={setMaxWords} />
    <Input label="分段數" value={paragraphs} onChange={setParagraphs} />
  </Section>

  {/* KV 測試工具 */}
  <Section>
    <h2>KV 命名空間測試工具</h2>
    <Input placeholder="Key" value={testKey} onChange={setTestKey} />
    <Button onClick={kvGet}>GET</Button>
    <Textarea placeholder="Value" value={testValue} onChange={setTestValue} />
    <Button onClick={kvPut}>PUT</Button>
  </Section>

  {/* API Key 設定 */}
  <Section>
    <h2>API Key 設定</h2>
    <Input label="Cloudflare API Token" type="password" />
    <Input label="OpenAI API Key" type="password" />
  </Section>
</Settings>
```

---

## 🚀 實施步驟（Phase by Phase）

### Phase 1: 基礎架構（Week 1）

- [ ] 建立 Supabase 數據庫表
- [ ] 設置 Cloudflare KV 命名空間
- [ ] 實現 Cloudflare Worker API
- [ ] 建立 Admin 登入頁面

### Phase 2: 記憶系統（Week 2-3）

- [ ] 實現記憶載入功能（KV → API → Frontend）
- [ ] 實現記憶提取功能（GPT 分析 → KV）
- [ ] 實現對話儲存功能（Frontend → Supabase）

### Phase 3: 管理後台（Week 3-4）

- [ ] 儀表板頁面
- [ ] 用戶列表 + 總覽頁面
- [ ] 記憶編輯頁面
- [ ] 對話紀錄頁面

### Phase 4: 每日摘要（Week 5）

- [ ] 每日摘要生成 Cron Job
- [ ] 每日摘要查看頁面
- [ ] 手動合併到 longterm 功能

### Phase 5: 優化與測試（Week 6）

- [ ] 性能優化
- [ ] UI/UX 優化
- [ ] 測試與 Bug 修復

---

## 💰 成本估算

### Cloudflare（免費 / Paid）

- **KV Storage**: 免費 1GB，每天 100K reads，1K writes
- **Workers**: 免費 100K requests/day
- **Cron Jobs**: 免費

### Supabase（免費 / Pro）

- **Free Plan**: 500MB 數據庫，2GB 流量/月
- **Pro Plan**: $25/月，8GB 數據庫，250GB 流量

### 預計成本

- **Phase 1-2**（測試階段）: $0
- **Phase 3-5**（生產環境）: ~$25/月（Supabase Pro）

---

## ✅ 總結

這個整合系統結合了：

1. ✅ **你的靈格管理後台 v1.0**（8 大頁面完整設計）
2. ✅ **我的記憶系統架構**（KV + Supabase 混合儲存）
3. ✅ **完整的數據流程**（實時 + 異步 + 定時任務）
4. ✅ **可擴展性**（支援多用戶、多 AI 靈格）

**下一步**：你想先實施哪個 Phase？我建議從 Phase 1 開始，先建立基礎架構。
