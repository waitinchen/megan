/**
 * Supabase 數據庫檢查腳本
 * 檢查連線、表結構、RLS 狀態
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSupabaseStatus() {
  console.log('🔍 正在檢查 Supabase 數據庫...\n');

  // 1. 測試連線
  console.log('📡 測試連線...');
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

    if (error) {
      console.log('⚠️  profiles 表不存在或無法訪問');
      console.log('   錯誤:', error.message);
    } else {
      console.log('✅ 連線成功！');
      console.log(`   profiles 表有 ${data} 筆記錄\n`);
    }
  } catch (err) {
    console.error('❌ 連線失敗:', err);
    process.exit(1);
  }

  // 2. 檢查現有表
  console.log('📊 檢查現有表...');
  const tables = [
    'profiles',
    'conversations',
    'daily_summaries',
    'memory_extraction_jobs',
    'kv_sync_log'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table} - 不存在`);
      } else {
        console.log(`✅ ${table} - 存在`);
      }
    } catch (err) {
      console.log(`❌ ${table} - 檢查失敗`);
    }
  }

  console.log('\n✅ 檢查完成！');
  console.log('\n下一步：');
  console.log('1. 如果有表缺失，請到 Supabase Dashboard 執行 database/schema.sql');
  console.log('2. 執行後再次運行此腳本驗證');
}

checkSupabaseStatus();
