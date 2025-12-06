import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSystemPrompt } from './get-system-prompt';
import { inferEmotionTags } from './emotion-tags';

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

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
        // 0. Get current System Prompt from database
        const systemPrompt = await getSystemPrompt();
        console.log(`[LLM Service] 📜 System Prompt loaded: ${systemPrompt.substring(0, 100)}...`);

        // Create model with dynamic system prompt
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            systemInstruction: systemPrompt,
        });

        // 1. Prepare history for Gemini
        // Filter out system messages from input history
        const userMessages = history.filter(msg => msg.role !== 'system');

        console.log(`[LLM Service] 📥 收到對話記錄: ${userMessages.length} 則訊息`);
        console.log(`[LLM Service] First message: ${isFirstMessage}`);
        if (memoryContext) {
            console.log(`[LLM Service] 🧠 Memory context: ${memoryContext.substring(0, 100)}...`);
        }

        // Convert to Gemini format
        const geminiHistory = [];

        // Inject memory context as the first user message if available
        if (memoryContext && memoryContext.length > 0) {
            geminiHistory.push({
                role: 'user',
                parts: [{ text: `## 你的記憶\n\n${memoryContext}\n\n（以上是你關於這個用戶的記憶，請自然地融入對話中，不要直接提及這些是「記憶」）` }],
            });
            geminiHistory.push({
                role: 'model',
                parts: [{ text: '明白，我會記住這些。' }],
            });
        }

        // Normal history processing (excluding the last message which we'll send separately)
        for (let i = 0; i < userMessages.length - 1; i++) {
            const msg = userMessages[i];
            geminiHistory.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            });
        }

        console.log(`[LLM Service] 📜 Gemini history: ${geminiHistory.length} 則訊息`);

        // If this is the first message, prepend "立灵句" to establish the tone
        // This helps the model "enter character" - 讓模型相信它不是回答問題，而是在活著
        if (isFirstMessage) {
            // Add initialization message as model's first response context
            // This will influence the model's tone for the entire conversation
            console.log('[立灵句] Injecting soul-establishing sentence for first message');
        }

        // Start chat with history
        // Optimized parameters based on 小软's guidelines
        const chat = model.startChat({
            history: geminiHistory,
            generationConfig: {
                maxOutputTokens: 600,  // 保留足夠語氣延伸
                temperature: 0.92,     // 情緒流動，但不會失控
                topP: 0.96,            // 多樣、有呼吸感
                topK: 40,              // 增強詞彙自由度
            },
        });

        // Send the last message
        const lastMessage = userMessages[userMessages.length - 1];
        if (!lastMessage || lastMessage.role !== 'user') {
            throw new Error("Last message must be from user");
        }

        // 2. Call Gemini
        const result = await chat.sendMessage(lastMessage.content);
        const response = result.response;
        let text = response.text();

        // Fallback if text is empty
        if (!text || text.trim().length === 0) {
            console.warn("⚠️ Gemini returned empty text. Using fallback.");
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
