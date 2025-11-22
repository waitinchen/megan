import { ELEVENLABS_TAGS, injectV3TagsIntoText } from './elevenlabs-tags';

interface ElevenLabsParams {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
    text_prefix?: string; // For injecting tags or instructions
    processed_text?: string; // Text with V3 tags injected
}

/**
 * Maps Lingya's emotion tags to ElevenLabs generation parameters.
 * This is the "Translation Layer" that converts "Soul" to "Voice".
 * Now also injects V3 tags into the text for expressive voice generation.
 * @param tags Detected emotion tags
 * @param text The actual text content (used to check if tags are already present)
 */
export function mapEmotionToElevenLabs(tags: string[], text: string = ""): ElevenLabsParams {
    // Default parameters - Optimized for emotionally-aware models (multilingual_v2, v3)
    // For these models, we can be more aggressive with expressiveness
    // Lower stability = more variation, Higher style = more expressive
    let params: ElevenLabsParams = {
        stability: 0.3,   // Lower for more emotion variation (multilingual_v2 handles this well)
        similarity_boost: 0.8,  // Slightly higher to maintain voice character
        style: 0.7,       // Higher for more expressiveness (emotionally-aware models excel here)
        use_speaker_boost: true,
        text_prefix: "",
    };

    const lowerText = text.toLowerCase();

    // Helper to check if a tag is already explicitly in the text
    const hasExplicitTag = (tag: string) => lowerText.includes(`[${tag}]`);

    // Priority-based mapping for voice parameters
    // More aggressive settings for expressive voice

    // Emotion-specific parameters optimized for emotionally-aware models
    if (tags.includes('whisper')) {
        params.stability = 0.2;   // Very low for natural whisper variation
        params.style = 0.85;      // High style for breathy, intimate whisper
    }

    if (tags.includes('flirty') || tags.includes('playful')) {
        params.stability = 0.25;  // Low stability = more emotion variation
        params.style = 0.95;      // Very high style = more breathy/expressive
    }

    if (tags.includes('excited')) {
        params.stability = 0.25;
        params.style = 0.9;
    }

    if (tags.includes('angry')) {
        params.stability = 0.2;
        params.style = 1.0;       // Maximum style for intense emotion
    }

    if (tags.includes('sad') || tags.includes('tender') || tags.includes('softer')) {
        params.stability = 0.4;   // Moderate stability for controlled sadness
        params.style = 0.5;       // Moderate style for tender, gentle emotions
    }

    if (tags.includes('breathy')) {
        params.stability = 0.3;
        params.style = 0.8;       // High style for breathy quality
    }

    if (tags.includes('sings')) {
        params.stability = 0.2;
        params.style = 1.0;       // Maximum style for singing
    }
    
    // For calm/thoughtful emotions (from 小软's tag system)
    if (tags.includes('calm') || tags.includes('thoughtful')) {
        params.stability = 0.45;
        params.style = 0.4;       // Lower style for calm, thoughtful delivery
    }

    // NEW: Inject V3 tags into text for expressive voice generation
    // ALWAYS inject V3 tags - even if no emotion tags detected, use default "whisper" for Moon-Shadow persona
    if (tags.length === 0 || (tags.length === 1 && tags[0] === 'neutral')) {
        // Default to whisper for Moon-Shadow persona if no emotion detected
        params.processed_text = injectV3TagsIntoText(text, ['whisper', 'softer']);
    } else {
        params.processed_text = injectV3TagsIntoText(text, tags);
    }

    return params;
}
