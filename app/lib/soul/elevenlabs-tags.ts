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
 * UPDATED: Only injects if LLM already included tags, or if strong emotion is detected
 * Aligns with "夜光系靈魂" principle: natural conversation over theatrical performance
 * @param text Original text
 * @param emotionTags Emotion tags detected
 * @returns Text with V3 tags (only if LLM included them or strong emotion detected)
 */
export function injectV3TagsIntoText(text: string, emotionTags: string[]): string {
    // Check if text already contains V3 tags (LLM-generated)
    const v3TagPattern = /\[(whispers?|sighs?|excited|mischievously|sings?|sarcastic|exhales?|laughs?|crying|curious)\]/i;
    const hasV3Tags = v3TagPattern.test(text);

    // If text already has V3 tags, respect LLM's decision
    if (hasV3Tags) {
        console.log(`[V3 Tags] ✅ LLM included V3 tags, using as-is: "${text.substring(0, 50)}..."`);
        return text;
    }

    // If no emotion tags detected, DO NOT inject default tags
    // Let the voice parameters handle subtle emotion
    // This prevents forced theatrical performance
    if (emotionTags.length === 0) {
        console.log(`[V3 Tags] No emotion tags, no injection (natural delivery)`);
        return text;
    }

    // Only inject V3 tags for STRONG emotions (not subtle ones)
    // This reserves V3 tags for truly exceptional moments
    const v3Tags = mapEmotionTagsToV3Tags(emotionTags);

    if (v3Tags.length === 0) {
        console.log(`[V3 Tags] Emotion detected but not strong enough for V3 tags`);
        return text;
    }

    // Only inject for very strong emotions: whisper, sigh, excited, crying
    // Skip injection for subtle emotions like calm, thoughtful, playful
    const strongEmotions = ['[whispers]', '[sighs]', '[excited]', '[crying]'];
    const strongV3Tags = v3Tags.filter(tag => strongEmotions.includes(tag));

    if (strongV3Tags.length === 0) {
        console.log(`[V3 Tags] Emotion detected but not strong enough, using voice parameters only`);
        return text;
    }

    // Use the first strong emotion tag (highest priority)
    const primaryTag = strongV3Tags[0];
    const injected = `${primaryTag} ${text}`;
    console.log(`[V3 Tags] ✅ Strong emotion detected, injected ${primaryTag}`);
    return injected;
}