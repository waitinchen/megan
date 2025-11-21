import { NextResponse } from 'next/server';
import { generateResponse } from '@/app/lib/soul/llm-service';
import { generateSpeech } from '@/app/lib/elevenlabs-client';

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
        const { messages, userIdentity } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
        }

        // 1. Get Text and Emotion from LLM (The "Soul")
        const { text, emotionTags } = await generateResponse(messages, userIdentity);

        // 2. Generate Speech using ElevenLabs (The "Voice")
        // We pass the emotion tags to adapt the voice parameters
        let audioBase64 = null;

        // Only generate speech if there is valid text and it's not just "..."
        if (text && text.trim() !== "..." && text.trim().length > 0) {
            try {
                // Generate speech with the FULL text (including V3 tags)
                const audioBuffer = await generateSpeech(text, emotionTags);
                audioBase64 = audioBuffer.toString('base64');
            } catch (speechError) {
                console.error("Speech generation failed:", speechError);
                // We continue even if speech fails, returning just text
            }
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
