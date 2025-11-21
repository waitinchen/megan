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
export async function generateResponse(
    history: ChatMessage[],
    userIdentity: string = 'other'
): Promise<LLMResponse> {
    try {
        // 1. Prepare history for Gemini
        // Filter out system messages from input history
        const userMessages = history.filter(msg => msg.role !== 'system');

        // Convert to Gemini format
        const geminiHistory = [];
        for (let i = 0; i < userMessages.length - 1; i++) {
            const msg = userMessages[i];
            geminiHistory.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            });
        }

        // Start chat with history
        const chat = model.startChat({
            history: geminiHistory,
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.7,
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
            text: `(系統錯誤: ${error.message || "Unknown Error"})`,
            emotionTags: ['sad', 'softer']
        };
    }
}
