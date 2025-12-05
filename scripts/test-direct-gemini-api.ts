/**
 * 直接測試 Google Gemini API
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.GOOGLE_API_KEY;

console.log('🔑 API Key:', API_KEY?.substring(0, 20) + '...');
console.log('📏 API Key 長度:', API_KEY?.length);
console.log('\n');

async function testDirectAPI() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;

    const payload = {
        contents: [{
            parts: [{
                text: "Say hello in one word"
            }]
        }]
    };

    console.log('🌐 測試 URL:', url.substring(0, 100) + '...');
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    console.log('\n');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        console.log('📊 Response Status:', response.status, response.statusText);
        console.log('📋 Response Headers:');
        response.headers.forEach((value, key) => {
            console.log(`  ${key}: ${value}`);
        });
        console.log('\n');

        const text = await response.text();
        console.log('📄 Response Body:');
        console.log(text);
        console.log('\n');

        if (response.ok) {
            const data = JSON.parse(text);
            console.log('✅ API 調用成功!');
            console.log('🤖 Gemini 回應:', data.candidates?.[0]?.content?.parts?.[0]?.text);
        } else {
            console.log('❌ API 調用失敗');
            try {
                const error = JSON.parse(text);
                console.log('錯誤詳情:', JSON.stringify(error, null, 2));
            } catch (e) {
                console.log('無法解析錯誤訊息');
            }
        }
    } catch (error: any) {
        console.error('💥 請求失敗:', error.message);
    }
}

testDirectAPI();
