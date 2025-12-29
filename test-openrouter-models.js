require('dotenv').config({ path: '.env.local' });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY is not set');
    process.exit(1);
}

// 可能的模型名称变体
const possibleModels = [
    'lizpreciatior/lzlv-70b-fp16-hf',  // 原始名称
    'lizpreciatior/lzlv-70b',          // 简化版本
    'lizpreciatior/lzlv-70b-fp16',     // 去掉 -hf
    'lizpreciatior/lzlv-70b-hf',       // 去掉 fp16
    'lizpreciatior/lzlv-70b-fp16-hf:free',  // 免费版本
    'lizpreciatior/lzlv-70b:free',     // 免费简化版
    // 其他可能的模型
    'meta-llama/llama-3.1-70b-instruct',
    'meta-llama/llama-3.1-8b-instruct',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
];

async function testModel(modelName) {
    try {
        console.log(`\n🧪 Testing: ${modelName}`);
        
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: "user", content: "Hi" }
                ],
                max_tokens: 10,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ SUCCESS: ${modelName}`);
            console.log(`   Response: ${data.choices[0]?.message?.content || 'No content'}`);
            return { success: true, model: modelName };
        } else {
            const errorText = await response.text();
            console.log(`❌ FAILED: ${modelName}`);
            console.log(`   Error: ${response.status} ${errorText.substring(0, 200)}`);
            return { success: false, model: modelName, error: errorText };
        }
    } catch (error) {
        console.log(`❌ ERROR: ${modelName}`);
        console.log(`   ${error.message}`);
        return { success: false, model: modelName, error: error.message };
    }
}

async function listAvailableModels() {
    try {
        console.log('\n📋 Fetching available models from OpenRouter...');
        const response = await fetch("https://openrouter.ai/api/v1/models", {
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`\n✅ Found ${data.data?.length || 0} models`);
            
            // 搜索包含 lzlv 或 lizpreciatior 的模型
            const lzlvModels = data.data?.filter(m => 
                m.id?.toLowerCase().includes('lzlv') || 
                m.id?.toLowerCase().includes('lizpreciatior')
            ) || [];
            
            if (lzlvModels.length > 0) {
                console.log('\n🎯 Found lzlv-related models:');
                lzlvModels.forEach(m => {
                    console.log(`   - ${m.id} (${m.name || 'N/A'})`);
                });
            } else {
                console.log('\n⚠️  No lzlv models found. Showing first 10 models:');
                data.data?.slice(0, 10).forEach(m => {
                    console.log(`   - ${m.id}`);
                });
            }
            
            return lzlvModels;
        } else {
            console.log(`❌ Failed to fetch models: ${response.status}`);
            return [];
        }
    } catch (error) {
        console.log(`❌ Error fetching models: ${error.message}`);
        return [];
    }
}

async function runTests() {
    console.log('🔍 Testing OpenRouter Models...\n');
    
    // 先列出可用模型
    const availableModels = await listAvailableModels();
    
    // 如果有找到 lzlv 模型，优先测试它们
    const modelsToTest = availableModels.length > 0 
        ? availableModels.map(m => m.id).concat(possibleModels)
        : possibleModels;
    
    // 去重
    const uniqueModels = [...new Set(modelsToTest)];
    
    console.log(`\n🧪 Testing ${uniqueModels.length} models...`);
    
    const results = [];
    for (const model of uniqueModels) {
        const result = await testModel(model);
        results.push(result);
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const successful = results.filter(r => r.success);
    console.log(`\n\n📊 Results: ${successful.length}/${results.length} models worked`);
    
    if (successful.length > 0) {
        console.log('\n✅ Working models:');
        successful.forEach(r => console.log(`   - ${r.model}`));
    }
}

runTests().catch(console.error);


