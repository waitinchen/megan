require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 环境变量检查\n');
console.log('心菲 2.0 核心配置:');
console.log('  OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '✓ 已设置' : '✗ 未设置');
console.log('  ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? '✓ 已设置' : '✗ 未设置');
console.log('  ELEVENLABS_VOICE_ID:', process.env.ELEVENLABS_VOICE_ID || 'nhK7WPj1pwfQrucZFj1m (默认值)');
console.log('\nSupabase 配置:');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ 已设置' : '✗ 未设置');
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ 已设置' : '✗ 未设置');
console.log('\n');

const required = ['OPENROUTER_API_KEY', 'ELEVENLABS_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.log('⚠️  缺少必需的环境变量:', missing.join(', '));
  console.log('请检查 .env.local 文件\n');
  process.exit(1);
} else {
  console.log('✅ 所有必需的环境变量已设置\n');
  process.exit(0);
}


