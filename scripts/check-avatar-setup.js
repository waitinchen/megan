// 檢查頭像功能設置腳本
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAvatarSetup() {
  console.log('🔍 檢查頭像功能設置...\n');

  // 1. 檢查 profiles 表是否有 avatar_url 欄位
  console.log('📋 檢查 profiles 表結構...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url')
    .limit(1)
    .single();

  if (profileError) {
    if (profileError.message.includes('avatar_url')) {
      console.error('❌ profiles 表缺少 avatar_url 欄位');
      console.log('請執行以下 SQL:');
      console.log('ALTER TABLE profiles ADD COLUMN avatar_url text;');
      return false;
    } else {
      console.error('❌ 查詢 profiles 表時出錯:', profileError.message);
      return false;
    }
  }

  console.log('✅ profiles 表有 avatar_url 欄位\n');

  // 2. 檢查 avatars storage bucket
  console.log('🗂️  檢查 Storage bucket...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error('❌ 無法列出 Storage buckets:', bucketsError.message);
    return false;
  }

  const avatarsBucket = buckets.find(b => b.name === 'avatars');

  if (!avatarsBucket) {
    console.error('❌ 缺少 "avatars" bucket');
    console.log('\n請在 Supabase Dashboard 創建:');
    console.log('1. 前往 Storage > New bucket');
    console.log('2. 名稱: avatars');
    console.log('3. Public bucket: 啟用');
    console.log('4. File size limit: 5242880 (5MB)');
    return false;
  }

  console.log('✅ avatars bucket 存在');
  console.log(`   - ID: ${avatarsBucket.id}`);
  console.log(`   - Public: ${avatarsBucket.public ? '是' : '否'}`);

  // 3. 測試上傳權限
  console.log('\n🧪 測試上傳權限...');
  const testFile = new Blob(['test'], { type: 'text/plain' });
  const testFileName = `test-${Date.now()}.txt`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(testFileName, testFile);

  if (uploadError) {
    console.error('❌ 上傳測試失敗:', uploadError.message);
    console.log('\n可能需要設置 RLS 政策:');
    console.log('- 允許用戶上傳文件到 avatars bucket');
    return false;
  }

  console.log('✅ 上傳權限正常');

  // 清理測試文件
  await supabase.storage.from('avatars').remove([testFileName]);
  console.log('✅ 測試文件已清理\n');

  console.log('🎉 頭像功能設置完成！可以開始使用。');
  return true;
}

checkAvatarSetup().catch(console.error);
