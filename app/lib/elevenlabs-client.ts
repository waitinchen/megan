import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { mapEmotionToElevenLabs } from './soul/elevenlabs-adapter';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

const client = new ElevenLabsClient({
    apiKey: ELEVENLABS_API_KEY,
});

export async function generateSpeech(text: string, emotionTags: string[]) {
    if (!ELEVENLABS_API_KEY) {
        throw new Error("Missing ELEVENLABS_API_KEY");
    }

    // 1. Map Emotion Tags to ElevenLabs Parameters
    const params = mapEmotionToElevenLabs(emotionTags, text);

    // 2. Prepare the text (inject prefix if any)
    const textToSpeak = (params.text_prefix || "") + text;

    console.log(`[ElevenLabs] Generating speech for: "${textToSpeak}"`);
    console.log(`[ElevenLabs] Params: Stability=${params.stability}, Style=${params.style}`);

    // 3. Call ElevenLabs SDK
    try {
        const audioStream = await client.textToSpeech.convert(VOICE_ID, {
            text: textToSpeak,
            modelId: "eleven_turbo_v2_5",
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
