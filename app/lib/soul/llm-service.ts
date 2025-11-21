import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './system-prompt';
import { inferEmotionTags } from './emotion-tags';

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
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
        // 1. Prepare messages
        // Anthropic handles system prompt separately
        const userMessages = history.filter(msg => msg.role !== 'system');

        // Convert messages to Anthropic format
        const anthropicMessages = userMessages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        })) as Anthropic.MessageParam[];

        // 2. Call Claude
        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022', // Use Sonnet 3.5 for best performance/speed balance
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: anthropicMessages,
            temperature: 0.7,
        });

        // Extract text content
        const textBlock = message.content[0];
        const text = textBlock.type === 'text' ? textBlock.text : "";

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

    } catch (error) {
        console.error("Error in generateResponse:", error);
        return {
            text: "嗯... 我好像有點累了... (系統錯誤)",
            emotionTags: ['sad', 'softer']
        };
    }
}
