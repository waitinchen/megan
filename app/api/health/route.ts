import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
    const status = {
        elevenlabs: 'error',
        llm: 'error',
    };

    // Check ElevenLabs API
    try {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            console.error('[Health Check] ELEVENLABS_API_KEY is not set');
            status.elevenlabs = 'error';
        } else {
            const elResponse = await fetch('https://api.elevenlabs.io/v1/user', {
                headers: {
                    'xi-api-key': apiKey,
                },
            });
            if (elResponse.ok) {
                status.elevenlabs = 'ok';
                console.log('[Health Check] ElevenLabs API: OK');
            } else {
                const errorText = await elResponse.text();
                console.error(`[Health Check] ElevenLabs API failed: ${elResponse.status} - ${errorText}`);
                status.elevenlabs = 'error';
            }
        }
    } catch (error: any) {
        console.error('[Health Check] ElevenLabs health check failed:', error.message);
        status.elevenlabs = 'error';
    }

    // Check Google Gemini API (the actual LLM being used)
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error('[Health Check] GOOGLE_API_KEY is not set');
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

            if (text && text.length > 0) {
                status.llm = 'ok';
                console.log('[Health Check] Google Gemini API: OK');
            } else {
                console.error('[Health Check] Google Gemini returned empty response');
                status.llm = 'error';
            }
        }
    } catch (error: any) {
        console.error('[Health Check] Google Gemini health check failed:', error.message);
        status.llm = 'error';
    }

    return NextResponse.json(status);
}
