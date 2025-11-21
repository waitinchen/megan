import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './system-prompt';
import { inferEmotionTags } from './emotion-tags';

// Initialize Anthropic client
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY is not set in environment variables');
}

const anthropic = new Anthropic({
    apiKey: apiKey || '',
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
        // 1. Prepare history for Claude
        // Claude uses 'user' and 'assistant' roles. System prompt is passed separately.
        // Filter out system messages from input history
        const conversationHistory = history
            .filter(msg => msg.role !== 'system')
            .map(msg => ({
                role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
                content: msg.content
            }));

        // 2. Call Claude
        const response = await anthropic.messages.create({
            model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
            max_tokens: 1024,
            temperature: 0.7,
            system: SYSTEM_PROMPT,
            messages: conversationHistory,
        });

        // Extract text from response
        let text = '';
        if (response.content && response.content.length > 0) {
            const textBlock = response.content.find(block => block.type === 'text');
            if (textBlock && textBlock.type === 'text') {
                text = textBlock.text;
            }
        }

        // Fallback if text is empty
        if (!text || text.trim().length === 0) {
            console.warn("⚠️ Claude returned empty text. Using fallback.");
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
