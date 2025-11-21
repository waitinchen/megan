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
