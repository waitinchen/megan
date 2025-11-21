import { NextResponse } from 'next/server';
import { generateResponse } from '@/app/lib/soul/llm-service';
import { generateSpeech } from '@/app/lib/elevenlabs-client';

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
        try {
            const audioBuffer = await generateSpeech(text, emotionTags);
            audioBase64 = audioBuffer.toString('base64');
        } catch (speechError) {
            console.error("Speech generation failed:", speechError);
            // We continue even if speech fails, returning just text
        }

        // 3. Return everything to the client
        return NextResponse.json({
            text,
            emotionTags,
            audio: audioBase64, // Client can play this data:audio/mpeg;base64,...
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
