import { mapEmotionToElevenLabs } from './soul/elevenlabs-adapter';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Default voice (Rachel) or user's choice

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

    // 3. Call ElevenLabs API
    // We use the V3 Turbo (v2.5) model for best performance and emotion support.
    const modelId = "eleven_turbo_v2_5";

    const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
            method: "POST",
            headers: {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
                text: textToSpeak,
                model_id: modelId,
                voice_settings: {
                    stability: params.stability,
                    similarity_boost: params.similarity_boost,
                    style: params.style,
                    use_speaker_boost: params.use_speaker_boost,
                },
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API Error: ${response.status} - ${errorText}`);
    }

    // 4. Return Audio Buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}
