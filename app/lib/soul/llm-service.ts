import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT } from './system-prompt';
import { inferEmotionTags } from './emotion-tags';

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro-latest' }); // Use verified working model

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
        // Gemini uses 'user' and 'model' roles. System prompt is usually handled via instruction or first message.
        // For simplicity and best results with Gemini, we'll prepend the system prompt to the chat history or use systemInstruction if supported (v1beta).
        // Here we will construct the chat history.

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                {
                    role: "model",
                    parts: [{ text: "I understand. I am Megan Fox, the Moon-Shadow Tone Spirit. I am ready." }],
                }
            ],
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.7,
            },
        });

        // Convert recent history (excluding system) to Gemini format
        // Note: Gemini history must alternate user/model. We need to be careful.
        // We'll just send the last user message for now to avoid history sync issues in this simple implementation,
        // OR we can reconstruct the valid history.
        // Let's try to reconstruct valid history from the input.

        // Filter out system messages from input history
        const userMessages = history.filter(msg => msg.role !== 'system');

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
