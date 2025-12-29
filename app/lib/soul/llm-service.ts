import { inferEmotionTags } from './emotion-tags';

// 心菲 2.0 系统提示词
const XINFEI_SYSTEM_PROMPT = "妳是心菲，18歲賊壞小妹...";

// Note: Model will be created with dynamic system prompt in generateResponse function

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMResponse {
    text: string;
    emotionTags: string[];
}

/**
 * Generates a response from the LLM and infers emotion tags.
 * @param history Conversation history
 * @param userIdentity Optional identity of the user (e.g., 'dad')
 * @param isFirstMessage Whether this is the first message in the conversation
 * @param memoryContext Optional memory context to inject into the system prompt
 */
export async function generateResponse(
    history: ChatMessage[],
    userIdentity: string = 'other',
    isFirstMessage: boolean = false,
    memoryContext: string = ''
): Promise<LLMResponse> {
    try {
        // 使用心菲 2.0 系统提示词
        const systemPrompt = XINFEI_SYSTEM_PROMPT;
        console.log(`[LLM Service] 📜 使用心菲 2.0 系统提示词`);

        // 1. Prepare messages for OpenRouter
        // Filter out system messages from input history
        const userMessages = history.filter(msg => msg.role !== 'system');

        console.log(`[LLM Service] 📥 收到對話記錄: ${userMessages.length} 則訊息`);
        console.log(`[LLM Service] First message: ${isFirstMessage}`);
        if (memoryContext) {
            console.log(`[LLM Service] 🧠 Memory context: ${memoryContext.substring(0, 100)}...`);
        }

        // 2. Build messages array for OpenRouter
        const messages = [
            { role: "system", content: systemPrompt },
            ...userMessages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            }))
        ];

        // 3. Call OpenRouter API
        const openRouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterApiKey) {
            throw new Error('OPENROUTER_API_KEY is not set in environment variables');
        }

        // 注意：lizpreciatior/lzlv-70b-fp16-hf 在 OpenRouter 上不存在
        // 使用替代模型：meta-llama/llama-3.1-70b-instruct (同样是 70B 模型)
        const modelName = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-70b-instruct";
        console.log(`[LLM Service] 🚀 Calling OpenRouter with model: ${modelName}`);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: modelName, // 使用可用的 70B 模型
                messages: messages,
                temperature: 0.92,
                top_p: 0.96,
                max_tokens: 600,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response from OpenRouter API');
        }

        let text = data.choices[0].message.content;

        // Fallback if text is empty
        if (!text || text.trim().length === 0) {
            console.warn("⚠️ OpenRouter returned empty text. Using fallback.");
            text = "...";
        }

        // 3. Remove parentheses and action descriptions that would be read aloud by TTS
        // This is critical because TTS will read "(停頓)" as "括號停頓括號"
        const originalText = text;
        text = text
            .replace(/[（(][^）)]*[）)]/g, '') // Remove (...) and （...）
            .replace(/\s+/g, ' ')              // Clean up extra spaces
            .trim();

        if (originalText !== text) {
            console.log(`[Parentheses Removed] Original: "${originalText}"`);
            console.log(`[Parentheses Removed] Cleaned: "${text}"`);
        }

        // 4. Fix TTS pronunciation issues (同音字替換)
        // Replace words with problematic pronunciation with phonetically similar alternatives
        const pronunciationFixes: { [key: string]: string } = {
            '夜晚': '晚上',           // "夜晚" → "晚上" (更自然的發音)
            '妳': '你',               // "妳" → "你" (發音奇怪)
            '著': '着',               // "著" → "着" 或直接移除，視情況而定
        };

        let textBeforeFix = text;
        for (const [wrong, correct] of Object.entries(pronunciationFixes)) {
            text = text.replace(new RegExp(wrong, 'g'), correct);
        }

        if (textBeforeFix !== text) {
            console.log(`[Pronunciation Fixed] Original: "${textBeforeFix}"`);
            console.log(`[Pronunciation Fixed] Corrected: "${text}"`);
        }

        // 5. Reduce excessive pause symbols (減少過多的停頓符號)
        // Aggressive removal - keep minimal pauses only
        const textBeforePauseReduction = text;

        // Step 1: Replace multiple consecutive "..." with single "..."
        text = text.replace(/\.{3,}/g, '...');

        // Step 2: Aggressive pause removal - only keep 1 pause per entire response
        const allPauses = text.match(/\.\.\./g);
        if (allPauses && allPauses.length > 1) {
            // Find all pause positions
            let pauseIndex = 0;
            text = text.replace(/\.\.\./g, () => {
                pauseIndex++;
                // Only keep the first pause, remove all others
                return pauseIndex === 1 ? '...' : '';
            });
        }

        // Step 3: Clean up double commas and extra spaces caused by removal
        text = text
            .replace(/，{2,}/g, '，')           // Multiple commas → single comma
            .replace(/，\s*，/g, '，')          // Comma space comma → single comma
            .replace(/\s+/g, ' ')               // Multiple spaces → single space
            .replace(/\s*，\s*/g, '，')         // Spaces around commas
            .trim();

        // Step 4: Clean up any remaining excessive pauses at start/end
        text = text.replace(/^\.{3,}\s*/g, '').replace(/\s*\.{3,}$/g, '');

        if (textBeforePauseReduction !== text) {
            console.log(`[Pause Reduced] Original: "${textBeforePauseReduction}"`);
            console.log(`[Pause Reduced] Cleaned: "${text}"`);
        }

        // 3. Infer Emotion Tags from the generated text
        const emotionTags = inferEmotionTags(text, { userIdentity });

        // 4. Check for explicit tags in the text
        const explicitTagsRegex = /\[(.*?)\]/g;
        let match;
        while ((match = explicitTagsRegex.exec(text)) !== null) {
            emotionTags.push(match[1].toLowerCase());
        }

        return {
            text,
            emotionTags: [...new Set(emotionTags)] // Deduplicate
        };

    } catch (error: any) {
        console.error("💥 Error in generateResponse:", error);
        return {
            text: `（系統錯誤：${error.message || "未知錯誤"}）`,
            emotionTags: ['sad', 'softer']
        };
    }
}
