import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function GET() {
    const status = {
        elevenlabs: 'error',
        llm: 'error',
    };

    // Check ElevenLabs API
    try {
        const elResponse = await fetch('https://api.elevenlabs.io/v1/user', {
            headers: {
                'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
            },
        });
        status.elevenlabs = elResponse.ok ? 'ok' : 'error';
    } catch (error) {
        console.error('ElevenLabs health check failed:', error);
        status.elevenlabs = 'error';
    }

    // Check Anthropic Claude API
    try {
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || '',
        });

        // Simple test request
        const response = await anthropic.messages.create({
            model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20240620',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
        });

        status.llm = response.content.length > 0 ? 'ok' : 'error';
    } catch (error: any) {
        console.error('Claude health check failed:', error.message);
        status.llm = 'error';
    }

    return NextResponse.json(status);
}
