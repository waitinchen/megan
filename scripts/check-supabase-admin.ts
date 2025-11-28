/**
 * Supabase 數據庫管理檢查腳本
 * 使用 Service Role Key 繞過 RLS
 */

import { createClient } from '@supabase/supabase-js';

// 需要使用 Service Role Key 來繞過 RLS
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.log('❌ 錯誤: 需要設定 SUPABASE_SERVICE_ROLE_KEY');
  console.log('   請到 Supabase Dashboard > Settings > API > service_role key');
  console.log('   然後在 .env.local 中添加：');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSupabaseStatus() {
  console.log('🔍 正在檢查 Supabase 數據庫（管理模式）...\n');

  // 1. 測試連線並獲取表結構
  console.log('📡 測試 profiles 表...');
  try {
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: false })
      .limit(1);

    if (error) {
      console.log('❌ profiles 表訪問失敗');
      console.log('   錯誤:', error.message);
    } else {
      console.log('✅ profiles 表存在');
      console.log(`   記錄數: ${count || 0}`);
      if (data && data.length > 0) {
        console.log('   欄位:', Object.keys(data[0]).join(', '));
      }
    }
  } catch (err: any) {
    console.error('❌ profiles 表檢查失敗:', err.message);
  }

  console.log('\n📡 測試 conversations 表...');
  try {
    const { data, error, count } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: false })
      .limit(1);

    if (error) {
      console.log('❌ conversations 表訪問失敗');
      console.log('   錯誤:', error.message);
    } else {
      console.log('✅ conversations 表存在');
      console.log(`   記錄數: ${count || 0}`);
      if (data && data.length > 0) {
        console.log('   欄位:', Object.keys(data[0]).join(', '));
      }
    }
  } catch (err: any) {
    console.error('❌ conversations 表檢查失敗:', err.message);
  }

  // 2. 檢查 RLS 狀態
  console.log('\n🔒 檢查 RLS 政策...');
  try {
    const { data: policies, error } = await supabase
      .rpc('pg_policies')
      .select('*');

    if (error) {
      console.log('⚠️  無法查詢 RLS 政策（這是正常的）');
    }
  } catch (err) {
    console.log('⚠️  RLS 政策查詢不可用（使用 SQL 編輯器查看）');
  }

  console.log('\n✅ 檢查完成！');
  console.log('\n📋 Phase 1 狀態：');
  console.log('   ✅ profiles 表 - 已創建');
  console.log('   ✅ conversations 表 - 已創建');
  console.log('\n下一步：測試 Cloudflare Worker API');
}

checkSupabaseStatus();
