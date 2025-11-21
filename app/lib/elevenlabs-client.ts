import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { mapEmotionToElevenLabs } from './soul/elevenlabs-adapter';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "WUEPpaWdYrRSq7wyeO9O";

const client = new ElevenLabsClient({
    apiKey: ELEVENLABS_API_KEY,
});

export async function generateSpeech(text: string, emotionTags: string[]) {
    if (!ELEVENLABS_API_KEY) {
        throw new Error("Missing ELEVENLABS_API_KEY");
    }

    // 1. Map Emotion Tags to ElevenLabs Parameters (includes V3 tag injection)
    const params = mapEmotionToElevenLabs(emotionTags, text);

    // 2. Prepare the text - use processed_text if V3 tags were injected, otherwise use original
    let textToSpeak = params.processed_text || ((params.text_prefix || "") + text);
    
    // 3. Add tone example sentence for V3 model (小软's requirement: prompt > 200 chars)
    // This helps the model understand the desired tone before the main text
    const toneExample = `[breathy][slow] Hey… it's me, Megan. Let's breathe together. `;
    
    // Only add example if text is short (to ensure total > 200 chars for V3)
    if (textToSpeak.length < 200) {
        textToSpeak = toneExample + textToSpeak;
    }

    console.log(`[ElevenLabs] Generating speech for: "${textToSpeak}"`);
    console.log(`[ElevenLabs] Params: Stability=${params.stability}, Style=${params.style}`);
    console.log(`[ElevenLabs] Emotion Tags: ${emotionTags.join(', ')}`);
    console.log(`[ElevenLabs] V3 Tags injected: ${textToSpeak.includes('[whispers]') || textToSpeak.includes('[sighs]') || textToSpeak.includes('[breathy]') ? 'YES' : 'NO'}`);

    // 3. Call ElevenLabs SDK
    try {
        // Use V3 model that supports audio tags
        // Try eleven_turbo_v2_5 first (confirmed to support V3 tags), then fallback
        const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5";
        
        const audioStream = await client.textToSpeech.convert(VOICE_ID, {
            text: textToSpeak,
            modelId: modelId,
            voiceSettings: {
                stability: params.stability,
                similarityBoost: params.similarity_boost,
                style: params.style,
                useSpeakerBoost: params.use_speaker_boost,
            },
        });

        // 4. Convert Stream to Buffer (for current compatibility)
        // 4. Convert Stream to Buffer (for current compatibility)
        const reader = audioStream.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
                chunks.push(value);
            }
        }
        return Buffer.concat(chunks);

    } catch (error: any) {
        console.error("ElevenLabs SDK Error:", error);
        throw error;
    }
}
