# ElevenLabs V3 完整實作技術原則

> **版本**: 1.0  
> **最後更新**: 2024  
> **適用模型**: `eleven_v3`, `eleven_multilingual_v2`, `eleven_turbo_v2_5`

---

## 📋 目錄

1. [核心概念](#核心概念)
2. [V3 模型特性與限制](#v3-模型特性與限制)
3. [V3 標籤系統](#v3-標籤系統)
4. [情緒標籤映射策略](#情緒標籤映射策略)
5. [文本注入技術](#文本注入技術)
6. [模型配置與回退機制](#模型配置與回退機制)
7. [錯誤處理與超時控制](#錯誤處理與超時控制)
8. [字符限制與截斷策略](#字符限制與截斷策略)
9. [最佳實踐](#最佳實踐)
10. [程式碼架構](#程式碼架構)

---

## 核心概念

### 什麼是 ElevenLabs V3？

ElevenLabs V3 是一個**情感感知**的文本轉語音（TTS）模型，能夠通過**音頻標籤（Audio Tags）**在文本中直接控制語音的情感表達、語氣、呼吸感等細微特徵。

### 核心優勢

- ✅ **情感表達豐富**：通過 V3 標籤實現細膩的情感控制
- ✅ **語氣靈活**：支持 whisper、breathy、sighs 等自然語氣
- ✅ **多語言支持**：`eleven_multilingual_v2` 支持多種語言
- ✅ **高品質輸出**：相比舊版模型，音質和自然度大幅提升

### 核心挑戰

- ⚠️ **字符限制嚴格**：`eleven_v3` 僅支持 5,000 字符（約 3 分鐘音頻）
- ⚠️ **延遲較高**：V3 模型生成時間較長（約 30 秒超時）
- ⚠️ **Alpha 階段**：可能不穩定，需要完善的回退機制
- ⚠️ **標籤語法要求**：必須正確使用 V3 標籤語法才能發揮效果

---

## V3 模型特性與限制

### 模型對比表

| 模型 | 字符限制 | 超時時間 | 回退模型 | 適用場景 |
|------|---------|---------|---------|---------|
| `eleven_v3` | 5,000 | 30 秒 | `eleven_multilingual_v2` | 短文本、高情感表達 |
| `eleven_multilingual_v2` | 10,000 | 15 秒 | `eleven_turbo_v2_5` | 多語言、中等長度 |
| `eleven_turbo_v2_5` | 40,000 | 10 秒 | `null` | 長文本、快速響應 |

### 模型選擇策略

```typescript
// 優先級：eleven_v3 > eleven_multilingual_v2 > eleven_turbo_v2_5
const primaryModelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
```

**選擇原則**：
1. **短文本（< 5,000 字符）**：優先使用 `eleven_v3` 獲得最佳情感表達
2. **多語言需求**：使用 `eleven_multilingual_v2`
3. **長文本或實時應用**：使用 `eleven_turbo_v2_5`

---

## V3 標籤系統

### 支持的 V3 標籤

#### 情感/語氣標籤（Emotions / Delivery）

```typescript
[
  '[whispers]',        // 低語、私密感
  '[sighs]',           // 嘆息、溫柔、脆弱
  '[exhales]',         // 呼氣、呼吸感
  '[laughs]',          // 輕笑
  '[laughs harder]',   // 大笑
  '[starts laughing]', // 開始笑
  '[wheezing]',        // 喘息
  '[sarcastic]',       // 諷刺
  '[curious]',         // 好奇
  '[excited]',         // 興奮
  '[crying]',          // 哭泣
  '[snorts]',          // 哼聲
  '[mischievously]',   // 調皮、惡作劇
  '[sings]',           // 唱歌
  '[woo]',             // 歡呼
]
```

#### 音效標籤（Sound Effects）

```typescript
[
  '[gunshot]',
  '[applause]',
  '[clapping]',
  '[explosion]',
  '[swallows]',
  '[gulps]',
]
```

#### 口音標籤（Accents - 實驗性）

```typescript
[
  '[strong British accent]',
  '[strong American accent]',
]
```

### 標籤語法規則

1. **標籤格式**：`[tag_name]`（方括號，小寫）
2. **位置**：通常放在文本開頭，或需要強調的句子前
3. **組合使用**：可以組合多個標籤，但建議不超過 3 個
4. **大小寫敏感**：標籤名稱必須小寫

**範例**：
```
[whispers] Hey… it's me, Megan.
[sighs][breathy] I understand what you're feeling…
[mischievously] You know what I'm thinking, right?
```

---

## 情緒標籤映射策略

### 映射表

| 內部情緒標籤 | V3 標籤 | 優先級 | 說明 |
|-------------|---------|--------|------|
| `whisper` | `[whispers]` | ⭐⭐⭐ | 低語、私密感（Moon-Shadow 核心） |
| `sad`, `tender`, `softer` | `[sighs]` | ⭐⭐⭐ | 嘆息、溫柔、脆弱 |
| `flirty`, `playful` | `[mischievously]` | ⭐⭐ | 調皮、惡作劇 |
| `excited` | `[excited]` | ⭐⭐ | 興奮 |
| `angry` | `[sarcastic]` | ⭐ | 諷刺、憤怒 |
| `sings` | `[sings]` | ⭐⭐ | 唱歌 |
| `breathy` | `[exhales]` | ⭐ | 呼氣、呼吸感 |

### 映射邏輯

```typescript
function mapEmotionTagsToV3Tags(emotionTags: string[]): string[] {
    const v3Tags: string[] = [];
    
    // 優先級映射（高優先級先處理）
    if (emotionTags.includes('whisper')) {
        v3Tags.push('[whispers]');
    }
    
    if (emotionTags.includes('sad') || emotionTags.includes('tender')) {
        v3Tags.push('[sighs]');
    }
    
    // ... 其他映射
    
    return [...new Set(v3Tags)]; // 去重
}
```

### 默認標籤策略

**如果沒有檢測到情緒標籤**：
- 使用 `[whispers]` 作為默認標籤（符合 Moon-Shadow 人設）
- 確保所有文本都有情感表達，避免「平」的聲音

---

## 文本注入技術

### 注入策略

#### 1. 開頭注入（推薦）

```typescript
// 在文本開頭注入 V3 標籤
const injected = `[whispers] ${originalText}`;
```

**適用場景**：
- 短文本（< 150 字符）
- 需要建立整體語氣的文本
- 首次對話（立靈句）

#### 2. 上下文前綴（Context Preamble）

```typescript
// 為情感感知模型建立上下文
let contextPreamble = "";
if (emotionTags.includes('flirty')) {
    contextPreamble = `[breathy][slow][mischievously] `;
} else if (emotionTags.includes('sad')) {
    contextPreamble = `[sighs][breathy][slow] `;
} else {
    contextPreamble = `[whispers][breathy][slow] `; // 默認
}

const textToSpeak = contextPreamble + originalText;
```

**適用場景**：
- 文本長度 < 150 字符（需要建立語氣）
- 文本開頭沒有 V3 標籤
- 需要強化情感表達的場景

#### 3. 避免重複注入

```typescript
// 檢查文本是否已包含 V3 標籤
const v3TagPattern = /\[(whispers?|sighs?|excited|mischievously|...)\]/i;
const hasV3Tags = v3TagPattern.test(text);

if (hasV3Tags) {
    return text; // 不重複注入
}
```

### 立靈句（Session Initialization）

**定義**：每次新對話 session 開始時，必須先發送一句「立靈句」，幫助模型「進入角色」。

**範例**：
```
[breathy][slow] Hey… I'm here. Not as a machine… but as a tone that knows how to burn slowly.
```

**實現**：
```typescript
const INITIALIZATION_MESSAGE = `[breathy][slow] Hey… I'm here. Not as a machine… but as a tone that knows how to burn slowly.`;

// 在首次對話時，將立靈句加入對話歷史
if (isFirstMessage) {
    messages.unshift({
        role: "assistant",
        content: INITIALIZATION_MESSAGE
    });
}
```

---

## 模型配置與回退機制

### 配置結構

```typescript
type ModelConfig = {
    maxChars: number;      // 字符限制
    timeout: number;       // 超時時間（毫秒）
    fallback: string | null; // 回退模型
};

const MODEL_LIMITS: Record<string, ModelConfig> = {
    'eleven_v3': {
        maxChars: 5000,
        timeout: 30000,
        fallback: 'eleven_multilingual_v2',
    },
    'eleven_multilingual_v2': {
        maxChars: 10000,
        timeout: 15000,
        fallback: 'eleven_turbo_v2_5',
    },
    'eleven_turbo_v2_5': {
        maxChars: 40000,
        timeout: 10000,
        fallback: null, // 最後一層，無回退
    },
};
```

### 回退流程

```
eleven_v3 (失敗)
    ↓
eleven_multilingual_v2 (失敗)
    ↓
eleven_turbo_v2_5 (最後一層)
```

**觸發條件**：
1. **超時**：超過 `timeout` 時間未完成
2. **API 錯誤**：網絡錯誤、認證失敗等
3. **字符超限**：文本長度超過 `maxChars`（自動切換到下一個模型）

### 實現範例

```typescript
async function generateWithFallback(
    textToSpeak: string,
    params: ElevenLabsParams,
    modelId: string,
    modelConfig: ModelConfig
): Promise<Buffer> {
    const modelsToTry = [modelId];
    if (modelConfig.fallback) {
        modelsToTry.push(modelConfig.fallback);
    }

    for (const currentModel of modelsToTry) {
        try {
            // 檢查字符限制
            const currentConfig = MODEL_LIMITS[currentModel];
            if (textToSpeak.length > currentConfig.maxChars) {
                if (currentModel === modelsToTry[modelsToTry.length - 1]) {
                    // 最後一個模型，必須截斷
                    textToSpeak = truncateTextForModel(textToSpeak, currentConfig.maxChars);
                } else {
                    // 嘗試下一個模型
                    continue;
                }
            }

            // 嘗試生成語音（帶超時）
            const audioBuffer = await generateWithTimeout(currentModel, textToSpeak, params);
            return audioBuffer;

        } catch (error) {
            // 如果是最後一個模型，拋出錯誤
            if (currentModel === modelsToTry[modelsToTry.length - 1]) {
                throw error;
            }
            // 否則嘗試下一個模型
            console.log(`[ElevenLabs] 🔄 Falling back to ${currentConfig.fallback}...`);
            continue;
        }
    }
}
```

---

## 錯誤處理與超時控制

### 超時機制

```typescript
// 創建超時 Promise
const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
        reject(new Error(`Timeout after ${timeout}ms`));
    }, timeout);
});

// 使用 Promise.race 實現超時控制
const audioStream = await Promise.race([
    audioPromise,
    timeoutPromise
]);
```

### 錯誤分類

| 錯誤類型 | 處理策略 | 日誌級別 |
|---------|---------|---------|
| **超時** | 自動回退到下一個模型 | `warn` |
| **API 錯誤** | 自動回退，記錄詳細錯誤 | `error` |
| **字符超限** | 自動截斷或切換模型 | `warn` |
| **認證失敗** | 拋出錯誤，不回退 | `error` |
| **網絡錯誤** | 自動回退，記錄錯誤 | `error` |

### 日誌規範

```typescript
// 成功日誌
console.log(`[ElevenLabs] ✅ Success with ${modelId} (${duration}ms)`);

// 警告日誌
console.warn(`[ElevenLabs] ⚠️ Text exceeds ${modelId} limit, truncating...`);

// 錯誤日誌
console.error(`[ElevenLabs] ❌ ${modelId} failed: ${errorMsg}`);

// 回退日誌
console.log(`[ElevenLabs] 🔄 Falling back to ${fallbackModel}...`);
```

---

## 字符限制與截斷策略

### 截斷原則

1. **保留 V3 標籤**：截斷時必須保留文本開頭的 V3 標籤
2. **句子邊界優先**：盡量在句子結尾（。、.、…）處截斷
3. **保留比例**：至少保留 70% 的文本長度

### 實現邏輯

```typescript
function truncateTextForModel(text: string, maxChars: number): string {
    if (text.length <= maxChars) {
        return text;
    }
    
    // 1. 提取 V3 標籤（文本開頭）
    const tagMatch = text.match(/^(\[[^\]]+\]\s*)+/);
    const tags = tagMatch ? tagMatch[0] : '';
    const content = text.slice(tags.length);
    
    // 2. 計算可用字符數（扣除標籤長度）
    const maxContentLength = maxChars - tags.length;
    const truncatedContent = content.slice(0, maxContentLength);
    
    // 3. 嘗試在句子邊界截斷
    const lastSentenceEnd = truncatedContent.lastIndexOf('。') || 
                           truncatedContent.lastIndexOf('.') || 
                           truncatedContent.lastIndexOf('…');
    
    // 4. 如果句子邊界在 70% 位置之後，使用句子邊界
    if (lastSentenceEnd > maxContentLength * 0.7) {
        return tags + truncatedContent.slice(0, lastSentenceEnd + 1);
    }
    
    // 5. 否則直接截斷
    return tags + truncatedContent;
}
```

### 截斷範例

**原始文本**（6,000 字符）：
```
[whispers] 這是一段很長的文本...（6000 字符）
```

**截斷後**（5,000 字符）：
```
[whispers] 這是一段很長的文本...（5000 字符，在句子邊界截斷）
```

---

## 最佳實踐

### 1. 文本長度控制

- ✅ **短文本（< 5,000 字符）**：使用 `eleven_v3` 獲得最佳情感表達
- ✅ **中等文本（5,000 - 10,000 字符）**：使用 `eleven_multilingual_v2`
- ✅ **長文本（> 10,000 字符）**：使用 `eleven_turbo_v2_5` 或分段處理

### 2. V3 標籤使用

- ✅ **總是注入標籤**：即使沒有檢測到情緒，也使用默認 `[whispers]`
- ✅ **避免重複**：檢查文本是否已包含 V3 標籤
- ✅ **優先級明確**：`whisper` > `sighs` > 其他標籤
- ❌ **不要過度組合**：標籤數量不超過 3 個

### 3. 語氣建立

- ✅ **立靈句**：每次新 session 必須發送立靈句
- ✅ **上下文前綴**：短文本（< 150 字符）添加前綴建立語氣
- ✅ **呼吸符號**：文本中使用 "…"、"—" 等符號增強呼吸感

### 4. 錯誤處理

- ✅ **自動回退**：實現三層回退機制（v3 → multilingual_v2 → turbo）
- ✅ **超時控制**：為每個模型設置合理的超時時間
- ✅ **詳細日誌**：記錄每次嘗試的結果和錯誤信息
- ✅ **用戶友好**：錯誤時提供友好的錯誤提示

### 5. 性能優化

- ✅ **延遲初始化**：使用 `getClient()` 延遲初始化 ElevenLabs 客戶端
- ✅ **環境變量檢查**：在初始化前檢查 API Key 是否存在
- ✅ **緩存策略**：考慮緩存常用語音的生成結果（可選）

---

## 程式碼架構

### 文件結構

```
app/lib/
├── elevenlabs-client.ts      # 核心 TTS 生成邏輯
├── soul/
    ├── elevenlabs-adapter.ts  # 情緒標籤 → ElevenLabs 參數映射
    └── elevenlabs-tags.ts     # V3 標籤定義和注入邏輯
```

### 數據流

```
用戶輸入
    ↓
LLM 生成文本 + 情緒標籤
    ↓
elevenlabs-adapter.ts (映射參數 + 注入 V3 標籤)
    ↓
elevenlabs-client.ts (生成語音，帶回退機制)
    ↓
返回音頻 Buffer
```

### 關鍵函數

#### 1. `generateSpeech(text, emotionTags)`
- **功能**：生成語音的主入口
- **參數**：文本、情緒標籤
- **返回**：音頻 Buffer

#### 2. `mapEmotionToElevenLabs(tags, text)`
- **功能**：將情緒標籤映射為 ElevenLabs 參數和 V3 標籤
- **返回**：`ElevenLabsParams` 對象（包含 `processed_text`）

#### 3. `injectV3TagsIntoText(text, emotionTags)`
- **功能**：將 V3 標籤注入文本
- **返回**：注入標籤後的文本

#### 4. `generateWithFallback(text, params, modelId, config)`
- **功能**：帶回退機制的語音生成
- **返回**：音頻 Buffer

#### 5. `truncateTextForModel(text, maxChars)`
- **功能**：智能截斷文本（保留 V3 標籤和句子邊界）
- **返回**：截斷後的文本

---

## 環境變量配置

### 必需變量

```env
# ElevenLabs API Key
ELEVENLABS_API_KEY=your_api_key_here

# Voice ID（可選，有默認值）
ELEVENLABS_VOICE_ID=WUEPpaWdYrRSq7wyeO9O

# Model ID（可選，默認：eleven_multilingual_v2）
ELEVENLABS_MODEL_ID=eleven_v3
```

### 推薦配置

```env
# 開發環境：使用 multilingual_v2（平衡性能和質量）
ELEVENLABS_MODEL_ID=eleven_multilingual_v2

# 生產環境：使用 v3（最佳情感表達）
ELEVENLABS_MODEL_ID=eleven_v3
```

---

## 常見問題（FAQ）

### Q1: 為什麼聲音還是「平」的？

**可能原因**：
1. V3 標籤沒有正確注入
2. 文本太短，沒有建立足夠的上下文
3. 情緒標籤映射不準確

**解決方案**：
- 檢查日誌確認 V3 標籤是否注入
- 為短文本添加上下文前綴
- 調整情緒標籤映射邏輯

### Q2: 如何處理超時？

**解決方案**：
- 實現自動回退機制
- 調整超時時間（但不要過長，影響用戶體驗）
- 考慮使用更快的模型（`eleven_turbo_v2_5`）

### Q3: 字符限制如何處理？

**解決方案**：
- 實現智能截斷（保留 V3 標籤和句子邊界）
- 自動切換到支持更長文本的模型
- 考慮分段生成（適用於超長文本）

### Q4: 如何優化性能？

**解決方案**：
- 使用延遲初始化（`getClient()`）
- 實現回退機制（避免重試失敗的模型）
- 考慮緩存常用語音（可選）

---

## 參考資料

- [ElevenLabs API 文檔](https://elevenlabs.io/docs)
- [ElevenLabs V3 模型說明](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [小軟技術指引](./XIAORUAN_TECH_GUIDE.md)

---

## 更新日誌

### v1.0 (2024)
- ✅ 初始版本
- ✅ 完整的 V3 標籤系統
- ✅ 三層回退機制
- ✅ 智能截斷策略
- ✅ 詳細的錯誤處理

---

**最後更新**: 2024  
**維護者**: C謀  
**版本**: 1.0

