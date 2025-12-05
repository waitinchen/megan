/**
 * LLM Extraction Test Script
 * 測試 LLM 記憶提取功能
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { analyzeConversationWithLLM, mergeMemories } from '../app/lib/memory/llm-analyzer';
import type { UserMemory } from '../app/lib/memory/memory-service';

// 模擬對話數據
const mockConversation = [
    { role: 'user' as const, content: '嗨 Megan，我今天心情不太好' },
    { role: 'assistant' as const, content: '怎麼了？發生什麼事了嗎？' },
    { role: 'user' as const, content: '工作上遇到一些困難，我是做軟體開發的' },
    { role: 'assistant' as const, content: '原來如此，做軟體開發確實壓力很大呢' },
    { role: 'user' as const, content: '是啊，而且我今年才 28 歲，感覺壓力特別大' },
    { role: 'assistant' as const, content: '28 歲還很年輕呢，慢慢來不要著急' },
    { role: 'user' as const, content: '謝謝你，我喜歡你這種溫柔的語氣' },
    { role: 'assistant' as const, content: '我會一直陪著你的 ❤️' },
];

// 現有記憶（空）
const existingMemories: UserMemory = {};

async function testLLMExtraction() {
    console.log('🧪 開始測試 LLM 記憶提取...\n');
    console.log('📝 模擬對話:');
    console.log('='.repeat(50));
    mockConversation.forEach(msg => {
        console.log(`${msg.role === 'user' ? '用戶' : 'Megan'}: ${msg.content}`);
    });
    console.log('\n');

    console.log('🤖 調用 LLM 分析...');
    console.log('='.repeat(50));

    try {
        const analysis = await analyzeConversationWithLLM(mockConversation, existingMemories);

        console.log('✅ LLM 分析完成\n');
        console.log('📊 提取的記憶:');
        console.log(JSON.stringify(analysis, null, 2));
        console.log('\n');

        // 測試記憶合併
        console.log('🔄 測試記憶合併...');
        console.log('='.repeat(50));
        const merged = mergeMemories(existingMemories, analysis);
        console.log('✅ 合併完成\n');
        console.log('📦 合併後的記憶:');
        console.log(JSON.stringify(merged, null, 2));

        // 驗證提取結果
        console.log('\n');
        console.log('✔️ 驗證提取結果:');
        console.log('='.repeat(50));

        const checks = [
            { name: '年齡提取', pass: merged.profile?.estimated_age === 28 },
            { name: '職業提取', pass: merged.profile?.estimated_occupation?.includes('軟體') },
            { name: '語氣偏好', pass: merged.preferences?.preferred_tone?.includes('溫柔') },
            { name: '情緒模式', pass: merged.profile?.emotion_patterns !== undefined },
        ];

        checks.forEach(check => {
            console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
        });

        const passRate = checks.filter(c => c.pass).length / checks.length * 100;
        console.log(`\n📈 通過率: ${passRate.toFixed(0)}%`);

    } catch (error: any) {
        console.error('❌ LLM 分析失敗:', error.message);
        console.error('詳細錯誤:', error);
    }

    console.log('\n🎉 測試完成！');
}

// 執行測試
testLLMExtraction().catch(console.error);
