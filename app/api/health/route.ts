import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    // Check Google Gemini API (the actual LLM being used)
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            status.llm = 'error';
        } else {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ 
                model: 'gemini-2.0-flash-exp' 
            });

            // Simple test request
            const result = await model.generateContent('Hi');
            const response = await result.response;
            const text = response.text();

            status.llm = text && text.length > 0 ? 'ok' : 'error';
        }
    } catch (error: any) {
        console.error('Google Gemini health check failed:', error.message);
        status.llm = 'error';
    }

    return NextResponse.json(status);
}
