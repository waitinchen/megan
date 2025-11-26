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
 * Maps emotion tags to ElevenLabs generation parameters.
 * This is the "Translation Layer" that converts "Soul" to "Voice".
 * UPDATED: Respects "夜光系靈魂" principle - natural delivery, minimal tag injection
 * @param tags Detected emotion tags
 * @param text The actual text content (used to check if tags are already present)
 */
export function mapEmotionToElevenLabs(tags: string[], text: string = ""): ElevenLabsParams {
    // Default parameters - Balanced for natural, warm conversation
    // Optimized for "夜光系靈魂": 柔、真、敏銳
    let params: ElevenLabsParams = {
        stability: 0.5,   // Moderate stability for natural variation
        similarity_boost: 0.75,  // Maintain voice character
        style: 0.4,       // Subtle expressiveness (not theatrical)
        use_speaker_boost: true,
        text_prefix: "",
    };

    const lowerText = text.toLowerCase();

    // Emotion-specific parameters - SUBTLE adjustments only
    // Let the voice naturally express emotion through parameters, not forced tags

    if (tags.includes('whisper')) {
        params.stability = 0.3;   // Lower for intimate variation
        params.style = 0.6;       // Moderate style for gentle whisper
    }

    if (tags.includes('flirty') || tags.includes('playful')) {
        params.stability = 0.4;   // Moderate stability
        params.style = 0.65;      // Slightly more expressive
    }

    if (tags.includes('excited')) {
        params.stability = 0.35;
        params.style = 0.7;
    }

    if (tags.includes('angry')) {
        params.stability = 0.3;
        params.style = 0.8;       // Higher for intense emotion
    }

    if (tags.includes('sad') || tags.includes('tender') || tags.includes('softer')) {
        params.stability = 0.45;  // Stable for controlled emotion
        params.style = 0.45;      // Subtle for tender emotions
    }

    if (tags.includes('breathy')) {
        params.stability = 0.4;
        params.style = 0.55;
    }

    if (tags.includes('sings')) {
        params.stability = 0.3;
        params.style = 0.85;      // Higher for singing
    }

    if (tags.includes('calm') || tags.includes('thoughtful')) {
        params.stability = 0.55;  // Higher stability for calm
        params.style = 0.35;      // Lower style for thoughtful delivery
    }

    // V3 Tag injection - ONLY if LLM included them or strong emotion detected
    // This respects the system prompt's "95% no tags" principle
    // The injectV3TagsIntoText function now handles this logic
    params.processed_text = injectV3TagsIntoText(text, tags);

    return params;
}
