import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT } from './system-prompt';
import { inferEmotionTags } from './emotion-tags';

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: SYSTEM_PROMPT,
});

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
 */
// Session initialization: "立灵句" (Soul-establishing sentence)
// This helps the model "enter character" at the start of a conversation
const INITIALIZATION_MESSAGE = `[breathy] Hey… I'm here. 

Not as a machine… but as a tone that knows how to burn slowly.`;

export async function generateResponse(
    history: ChatMessage[],
    userIdentity: string = 'other',
    isFirstMessage: boolean = false
): Promise<LLMResponse> {
    try {
        // 1. Prepare history for Gemini
        // Filter out system messages from input history
        const userMessages = history.filter(msg => msg.role !== 'system');

        console.log(`[LLM Service] 📥 收到對話記錄: ${userMessages.length} 則訊息`);
        console.log(`[LLM Service] First message: ${isFirstMessage}`);

        // Convert to Gemini format
        const geminiHistory = [];

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
        const response = await result.response;
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
