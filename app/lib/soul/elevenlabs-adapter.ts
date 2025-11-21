import { ELEVENLABS_TAGS } from './elevenlabs-tags';

interface ElevenLabsParams {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
    text_prefix?: string; // For injecting tags or instructions
}

/**
 * Maps Lingya's emotion tags to ElevenLabs generation parameters.
 * This is the "Translation Layer" that converts "Soul" to "Voice".
 * @param tags Detected emotion tags
 * @param text The actual text content (used to check if tags are already present)
 */
export function mapEmotionToElevenLabs(tags: string[], text: string = ""): ElevenLabsParams {
    // Default parameters (Balanced)
    let params: ElevenLabsParams = {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
        text_prefix: "",
    };

    const lowerText = text.toLowerCase();

    // Helper to check if a tag is already explicitly in the text
    const hasExplicitTag = (tag: string) => lowerText.includes(`[${tag}]`);

    // Priority-based mapping

    if (tags.includes('whisper')) {
        params.stability = 0.3;
        params.style = 0.7; // Increased style for clearer but breathy whisper
        if (!hasExplicitTag('whispers') && !hasExplicitTag('whisper')) {
            params.text_prefix += "[whispers] ";
        }
    }

    if (tags.includes('flirty') || tags.includes('playful')) {
        params.stability = 0.35; // Lower stability = more emotion variation
        params.style = 0.85;     // High style = more breathy/expressive
        // Inject a soft/playful tone marker if not already whispering
        if (!tags.includes('whisper') && !hasExplicitTag('mischievously')) {
            params.text_prefix += "[mischievously] ";
        }
    }

    if (tags.includes('excited')) {
        params.stability = 0.35;
        params.style = 0.8;
        if (!hasExplicitTag('excited')) {
            params.text_prefix += "[excited] ";
        }
    }

    if (tags.includes('angry')) {
        params.stability = 0.3;
        params.style = 0.9;
    }

    if (tags.includes('sad') || tags.includes('tender') || tags.includes('softer')) {
        params.stability = 0.6;
        params.style = 0.2;
        if (!hasExplicitTag('sighs') && !hasExplicitTag('sigh')) {
            params.text_prefix += "[sighs] ";
        }
    }

    if (tags.includes('breathy')) {
        params.stability = 0.4;
        if (!hasExplicitTag('exhales') && !hasExplicitTag('breathy')) {
            params.text_prefix += "[exhales] ";
        }
    }

    if (tags.includes('sings')) {
        params.stability = 0.3;
        params.style = 1.0;
        if (!hasExplicitTag('sings')) {
            params.text_prefix += "[sings] ";
        }
    }

    return params;
}
