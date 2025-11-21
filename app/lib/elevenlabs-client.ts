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
    const params = mapEmotionToElevenLabs(emotionTags);

    // 2. Prepare the text (inject prefix if any)
    const textToSpeak = (params.text_prefix || "") + text;

    console.log(`[ElevenLabs] Generating speech for: "${textToSpeak}"`);
    console.log(`[ElevenLabs] Params: Stability=${params.stability}, Style=${params.style}`);

    // 3. Call ElevenLabs SDK
    try {
        const audioStream = await client.textToSpeech.convert(VOICE_ID, {
            text: textToSpeak,
            model_id: "eleven_turbo_v2_5",
            voice_settings: {
                stability: params.stability,
                similarity_boost: params.similarity_boost,
                style: params.style,
                use_speaker_boost: params.use_speaker_boost,
            },
        });

        // 4. Convert Stream to Buffer (for current compatibility)
        const chunks: Buffer[] = [];
        for await (const chunk of audioStream) {
            chunks.push(Buffer.from(chunk));
        }
        return Buffer.concat(chunks);

    } catch (error: any) {
        console.error("ElevenLabs SDK Error:", error);
        throw error;
    }
}
