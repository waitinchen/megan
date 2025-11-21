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
 */
export function mapEmotionToElevenLabs(tags: string[]): ElevenLabsParams {
    // Default parameters (Balanced)
    let params: ElevenLabsParams = {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
        text_prefix: "",
    };

    // Priority-based mapping (Last match wins or we can blend)
    // For simplicity, we check for presence of high-impact tags

    if (tags.includes('whisper')) {
        params.stability = 0.3; // Lower stability for more expressiveness
        params.style = 0.5;
        params.text_prefix += "[whispers] ";
    }

    if (tags.includes('flirty') || tags.includes('playful')) {
        params.stability = 0.4;
        params.style = 0.6;
        // Inject a soft/playful tone marker if not already whispering
        if (!tags.includes('whisper')) {
            // ElevenLabs V3 often picks up on context, but we can nudge it
            // We don't have a specific [flirty] tag in the standard list, 
            // but we can use [whispers] or [mischievously]
            params.text_prefix += "[mischievously] ";
        }
    }

    if (tags.includes('excited')) {
        params.stability = 0.35; // High emotion needs lower stability
        params.style = 0.8; // High style exaggeration
        params.text_prefix += "[excited] ";
    }

    if (tags.includes('angry')) {
        params.stability = 0.3;
        params.style = 0.9;
        // No specific tag for angry in the standard list, but context helps
    }

    if (tags.includes('sad') || tags.includes('tender') || tags.includes('softer')) {
        params.stability = 0.6; // More stable for sad/slow
        params.style = 0.2;
        params.text_prefix += "[sighs] ";
    }

    if (tags.includes('breathy')) {
        params.stability = 0.4;
        params.text_prefix += "[exhales] ";
    }

    // User requested singing support
    // If the LLM outputs a "singing" intent (which we might need to detect separately or add to tags),
    // we would add [sings]. 
    // For now, if 'sings' is in tags:
    if (tags.includes('sings')) {
        params.stability = 0.3;
        params.style = 1.0; // Max style for singing
        params.text_prefix += "[sings] ";
    }

    return params;
}
