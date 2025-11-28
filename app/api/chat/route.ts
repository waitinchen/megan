import { NextResponse } from 'next/server';
import { generateResponse } from '@/app/lib/soul/llm-service';
import { generateSpeech } from '@/app/lib/elevenlabs-client';
import { getUserMemories, buildMemoryContext } from '@/app/lib/memory/memory-service';

/**
 * Removes ElevenLabs V3 audio tags from text for display purposes
 * Tags like *whispers*, *laughs*, [pause], [whisper] etc. should only be used for TTS, not shown to users
 */
function stripAudioTags(text: string): string {
    // Remove V3 audio tags: *action description* and [tag]
    return text
        .replace(/\*[^*]+\*/g, '') // Remove *...*
        .replace(/\[[^\]]+\]/g, '') // Remove [...]
        .trim();
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { messages, userIdentity, userId } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
        }

        // 1. Load user memories from Cloudflare KV (if userId provided)
        let memoryContext = '';
        if (userId) {
            console.log(`[Chat API] Loading memories for user: ${userId}`);
            try {
                const memories = await getUserMemories(userId);
                memoryContext = buildMemoryContext(userIdentity || '你', memories);
                console.log(`[Chat API] Memory context loaded: ${memoryContext.length} chars`);
            } catch (memoryError) {
                console.error('[Chat API] Failed to load memories:', memoryError);
                // Continue without memories if loading fails
            }
        }

        // 2. Check if this is the first message (for "立灵句" initialization)
        const isFirstMessage = messages.length === 1 && messages[0].role === 'user';

        // 3. Get Text and Emotion from LLM (The "Soul")
        // Pass memory context to LLM
        const { text, emotionTags } = await generateResponse(
            messages,
            userIdentity,
            isFirstMessage,
            memoryContext
        );

        // 2. Generate Speech using ElevenLabs (The "Voice")
        // We pass the emotion tags to adapt the voice parameters
        let audioBase64 = null;

        // Only generate speech if there is valid text and it's not just "..."
        if (text && text.trim() !== "..." && text.trim().length > 0) {
            try {
                console.log(`[Chat API] Generating speech for text: "${text.substring(0, 50)}..."`);
                // Generate speech with the FULL text (including V3 tags)
                const audioBuffer = await generateSpeech(text, emotionTags);
                if (audioBuffer && audioBuffer.length > 0) {
                    audioBase64 = audioBuffer.toString('base64');
                    console.log(`[Chat API] ✅ Audio generated: ${audioBase64.length} chars (base64)`);
                } else {
                    console.warn("[Chat API] ⚠️ Audio buffer is empty");
                }
            } catch (speechError: any) {
                console.error("[Chat API] ❌ Speech generation failed:", speechError);
                console.error("[Chat API] Error details:", {
                    message: speechError.message,
                    stack: speechError.stack,
                });
                // We continue even if speech fails, returning just text
            }
        } else {
            console.warn("[Chat API] ⚠️ Skipping speech generation - invalid text");
        }

        // 3. Clean the text for display (remove V3 audio tags)
        const displayText = stripAudioTags(text);

        // 4. Return everything to the client
        return NextResponse.json({
            text: displayText, // Clean text without audio tags
            emotionTags,
            audio: audioBase64, // Client can play this data:audio/mpeg;base64,...
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
