/**
 * ElevenLabs V3 Supported Tags
 * Based on official documentation and user request.
 */

export const ELEVENLABS_TAGS = {
    // Emotions / Delivery
    emotions: [
        '[laughs]',
        '[laughs harder]',
        '[starts laughing]',
        '[wheezing]',
        '[whispers]',
        '[sighs]',
        '[exhales]',
        '[sarcastic]',
        '[curious]',
        '[excited]',
        '[crying]',
        '[snorts]',
        '[mischievously]',
        '[sings]', // User requested specific support for singing
        '[woo]',
        '[fart]', // Yes, this is real
    ],

    // Sound Effects
    sfx: [
        '[gunshot]',
        '[applause]',
        '[clapping]',
        '[explosion]',
        '[swallows]',
        '[gulps]',
    ],

    // Accents (Experimental)
    accents: [
        '[strong British accent]',
        '[strong American accent]',
        // Add others as needed
    ]
};

export type ElevenLabsTag = string;

/**
 * Maps emotion tags to ElevenLabs V3 audio tags
 * This function injects V3 tags into text based on emotion tags
 */
export function mapEmotionTagsToV3Tags(emotionTags: string[]): string[] {
    const v3Tags: string[] = [];
    
    // Priority-based mapping (higher priority first)
    if (emotionTags.includes('whisper')) {
        v3Tags.push('[whispers]');
    }
    
    if (emotionTags.includes('sad') || emotionTags.includes('tender') || emotionTags.includes('softer')) {
        v3Tags.push('[sighs]');
    }
    
    if (emotionTags.includes('flirty') || emotionTags.includes('playful')) {
        v3Tags.push('[mischievously]');
    }
    
    if (emotionTags.includes('excited')) {
        v3Tags.push('[excited]');
    }
    
    if (emotionTags.includes('angry')) {
        v3Tags.push('[sarcastic]');
    }
    
    if (emotionTags.includes('sings')) {
        v3Tags.push('[sings]');
    }
    
    if (emotionTags.includes('breathy')) {
        v3Tags.push('[exhales]');
    }
    
    // Remove duplicates
    return [...new Set(v3Tags)];
}

/**
 * Injects V3 tags into text based on emotion tags
 * @param text Original text
 * @param emotionTags Emotion tags detected
 * @returns Text with V3 tags injected at appropriate positions
 */
export function injectV3TagsIntoText(text: string, emotionTags: string[]): string {
    const v3Tags = mapEmotionTagsToV3Tags(emotionTags);
    
    // If no V3 tags to inject, return original text
    if (v3Tags.length === 0) {
        return text;
    }
    
    // Check if text already contains V3 tags (check for common patterns)
    const v3TagPattern = /\[(whispers?|sighs?|excited|mischievously|sings?|sarcastic|exhales?|laughs?|crying|curious)\]/i;
    const hasV3Tags = v3TagPattern.test(text);
    
    // If text already has V3 tags, don't duplicate (but allow LLM-generated tags to pass through)
    if (hasV3Tags) {
        console.log(`[V3 Tags] Text already contains V3 tags, using as-is: "${text}"`);
        return text;
    }
    
    // Priority-based injection (whisper and sigh are most important for "Moon-Shadow" persona)
    // For whisper (intimate, secretive) - highest priority
    if (v3Tags.includes('[whispers]')) {
        const injected = `[whispers] ${text}`;
        console.log(`[V3 Tags] Injected [whispers]: "${injected}"`);
        return injected;
    }
    
    // For sigh (sad, tender, vulnerable) - second priority
    if (v3Tags.includes('[sighs]')) {
        const injected = `[sighs] ${text}`;
        console.log(`[V3 Tags] Injected [sighs]: "${injected}"`);
        return injected;
    }
    
    // For other tags, inject at the beginning
    // Use the first (highest priority) tag
    const primaryTag = v3Tags[0];
    const injected = `${primaryTag} ${text}`;
    console.log(`[V3 Tags] Injected ${primaryTag}: "${injected}"`);
    return injected;
}