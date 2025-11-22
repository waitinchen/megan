import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { mapEmotionToElevenLabs } from './soul/elevenlabs-adapter';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "WUEPpaWdYrRSq7wyeO9O";

const client = new ElevenLabsClient({
    apiKey: ELEVENLABS_API_KEY,
});

// Model configuration and limits
const MODEL_LIMITS = {
    'eleven_v3': {
        maxChars: 5000,
        timeout: 30000, // 30 seconds for v3 (higher latency)
        fallback: 'eleven_multilingual_v2',
    },
    'eleven_multilingual_v2': {
        maxChars: 10000,
        timeout: 15000, // 15 seconds for multilingual_v2
        fallback: 'eleven_turbo_v2_5',
    },
    'eleven_turbo_v2_5': {
        maxChars: 40000,
        timeout: 10000, // 10 seconds for turbo
        fallback: null,
    },
};

/**
 * Truncate text to model's character limit while preserving V3 tags
 */
function truncateTextForModel(text: string, maxChars: number): string {
    if (text.length <= maxChars) {
        return text;
    }
    
    // Try to preserve V3 tags at the start
    const tagMatch = text.match(/^(\[[^\]]+\]\s*)+/);
    const tags = tagMatch ? tagMatch[0] : '';
    const content = text.slice(tags.length);
    
    // Truncate content, leaving room for tags
    const maxContentLength = maxChars - tags.length;
    const truncatedContent = content.slice(0, maxContentLength);
    
    // Try to cut at sentence boundary
    const lastSentenceEnd = truncatedContent.lastIndexOf('。') || 
                           truncatedContent.lastIndexOf('.') || 
                           truncatedContent.lastIndexOf('…');
    
    if (lastSentenceEnd > maxContentLength * 0.7) {
        return tags + truncatedContent.slice(0, lastSentenceEnd + 1);
    }
    
    return tags + truncatedContent;
}

/**
 * Generate speech with fallback and error handling
 */
export async function generateSpeech(text: string, emotionTags: string[]) {
    if (!ELEVENLABS_API_KEY) {
        throw new Error("Missing ELEVENLABS_API_KEY");
    }

    // 1. Map Emotion Tags to ElevenLabs Parameters (includes V3 tag injection)
    const params = mapEmotionToElevenLabs(emotionTags, text);

    // 2. Prepare the text - use processed_text if V3 tags were injected, otherwise use original
    let textToSpeak = params.processed_text || ((params.text_prefix || "") + text);
    
    // 3. Build comprehensive context for emotionally-aware models
    // Eleven v3 and multilingual_v2 need rich context to understand emotional intent
    // Add tone-establishing preamble to help model understand the desired emotional delivery
    
    // Build context preamble based on emotion tags
    let contextPreamble = "";
    if (emotionTags.includes('flirty') || emotionTags.includes('playful')) {
        contextPreamble = `[breathy][slow][mischievously] `;
    } else if (emotionTags.includes('sad') || emotionTags.includes('tender')) {
        contextPreamble = `[sighs][breathy][slow] `;
    } else if (emotionTags.includes('whisper') || emotionTags.includes('softer')) {
        contextPreamble = `[whispers][breathy][slow] `;
    } else {
        // Default: establish intimate, breathy tone for Megan persona
        contextPreamble = `[breathy][slow] `;
    }
    
    // For emotionally-aware models, we need sufficient context
    // If text is too short, add preamble to establish tone
    // This helps the model understand the emotional context before generating
    if (textToSpeak.length < 150) {
        textToSpeak = contextPreamble + textToSpeak;
    } else if (!textToSpeak.startsWith('[')) {
        // Even for longer text, add context if no V3 tags at start
        textToSpeak = contextPreamble + textToSpeak;
    }

    // 4. Get model configuration
    const primaryModelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
    const modelConfig = MODEL_LIMITS[primaryModelId as keyof typeof MODEL_LIMITS] || MODEL_LIMITS['eleven_multilingual_v2'];
    
    // 5. Character limit check and truncation
    if (textToSpeak.length > modelConfig.maxChars) {
        console.warn(`[ElevenLabs] Text exceeds ${primaryModelId} limit (${textToSpeak.length} > ${modelConfig.maxChars}), truncating...`);
        textToSpeak = truncateTextForModel(textToSpeak, modelConfig.maxChars);
        console.log(`[ElevenLabs] Truncated to ${textToSpeak.length} chars`);
    }

    console.log(`[ElevenLabs] Generating speech for: "${textToSpeak.substring(0, 100)}..."`);
    console.log(`[ElevenLabs] Model: ${primaryModelId}, Text length: ${textToSpeak.length} chars`);
    console.log(`[ElevenLabs] Params: Stability=${params.stability}, Style=${params.style}`);
    console.log(`[ElevenLabs] Emotion Tags: ${emotionTags.join(', ')}`);
    console.log(`[ElevenLabs] Timeout: ${modelConfig.timeout}ms`);

    // 6. Try primary model with timeout and fallback
    return await generateWithFallback(textToSpeak, params, primaryModelId, modelConfig);
}

/**
 * Generate speech with automatic fallback on failure
 */
async function generateWithFallback(
    textToSpeak: string,
    params: ReturnType<typeof mapEmotionToElevenLabs>,
    modelId: string,
    modelConfig: typeof MODEL_LIMITS['eleven_v3']
): Promise<Buffer> {
    const modelsToTry = [modelId];
    if (modelConfig.fallback) {
        modelsToTry.push(modelConfig.fallback);
    }

    for (const currentModel of modelsToTry) {
        try {
            const currentConfig = MODEL_LIMITS[currentModel as keyof typeof MODEL_LIMITS] || MODEL_LIMITS['eleven_multilingual_v2'];
            
            // Check character limit for current model
            if (textToSpeak.length > currentConfig.maxChars) {
                if (currentModel === modelsToTry[modelsToTry.length - 1]) {
                    // Last model, must truncate
                    textToSpeak = truncateTextForModel(textToSpeak, currentConfig.maxChars);
                } else {
                    // Try next model instead
                    console.log(`[ElevenLabs] ${currentModel} limit exceeded, trying fallback...`);
                    continue;
                }
            }

            console.log(`[ElevenLabs] Attempting with model: ${currentModel}`);
            
            // Create a promise with timeout
            const audioPromise = client.textToSpeech.convert(VOICE_ID, {
                text: textToSpeak,
                modelId: currentModel,
                voiceSettings: {
                    stability: params.stability,
                    similarityBoost: params.similarity_boost,
                    style: params.style,
                    useSpeakerBoost: params.use_speaker_boost,
                },
            });

            // Add timeout
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Timeout after ${currentConfig.timeout}ms`));
                }, currentConfig.timeout);
            });

            const audioStream = await Promise.race([audioPromise, timeoutPromise]);

            // Convert Stream to Buffer
            const reader = audioStream.getReader();
            const chunks: Uint8Array[] = [];
            const startTime = Date.now();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    chunks.push(value);
                }
            }
            
            const duration = Date.now() - startTime;
            console.log(`[ElevenLabs] ✅ Success with ${currentModel} (${duration}ms)`);
            return Buffer.concat(chunks);

        } catch (error: any) {
            const errorMsg = error.message || String(error);
            console.error(`[ElevenLabs] ❌ ${currentModel} failed: ${errorMsg}`);
            
            // If this is the last model to try, throw the error
            if (currentModel === modelsToTry[modelsToTry.length - 1]) {
                throw new Error(`All models failed. Last error: ${errorMsg}`);
            }
            
            // Otherwise, try the next fallback model
            const currentConfig = MODEL_LIMITS[currentModel as keyof typeof MODEL_LIMITS] || MODEL_LIMITS['eleven_multilingual_v2'];
            const nextModel = currentConfig.fallback || modelsToTry[modelsToTry.indexOf(currentModel) + 1];
            if (nextModel) {
                console.log(`[ElevenLabs] 🔄 Falling back to ${nextModel}...`);
            }
            continue;
        }
    }
    
    // Should never reach here, but TypeScript needs it
    throw new Error("No models available");
}
