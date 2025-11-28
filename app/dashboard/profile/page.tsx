'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [newNickname, setNewNickname] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: authData } = await supabase.auth.getUser();

        if (!authData.user) return;

        setUserId(authData.user.id);
        setEmail(authData.user.email || '未提供');
        setProvider(authData.user.app_metadata.provider || 'email');
        setCreatedAt(new Date(authData.user.created_at).toLocaleDateString('zh-TW'));

        // Get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, avatar_url, created_at')
          .eq('id', authData.user.id)
          .single();

        if (profile) {
          setNickname(profile.nickname);
          setNewNickname(profile.nickname);
          setAvatarUrl(profile.avatar_url);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('[Profile] 載入失敗:', error);
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [supabase]);

  const handleSave = async () => {
    if (!newNickname.trim()) {
      setMessage({ type: 'error', text: '暱稱不能為空' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nickname: newNickname.trim(), updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      setNickname(newNickname.trim());
      setMessage({ type: 'success', text: '暱稱更新成功！Megan 會立即使用新暱稱稱呼你 ✨' });

      // 觸發頁面刷新，讓主頁面重新載入暱稱
      setTimeout(() => {
        router.refresh();
        // 通知主頁面更新（透過 storage event）
        window.localStorage.setItem('nickname-updated', Date.now().toString());
      }, 1000);
    } catch (error: any) {
      console.error('[Profile] 更新失敗:', error);
      setMessage({ type: 'error', text: `更新失敗: ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 驗證文件類型
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '請選擇圖片文件' });
      return;
    }

    // 驗證文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: '圖片大小不能超過 5MB' });
      return;
    }

    setIsUploadingAvatar(true);
    setMessage(null);

    try {
      // 生成唯一文件名
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      console.log('[Avatar] 上傳文件:', fileName);

      // 上傳到 Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[Avatar] 上傳錯誤:', uploadError);
        throw uploadError;
      }

      console.log('[Avatar] 上傳成功:', uploadData);

      // 獲取公開 URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('[Avatar] 公開 URL:', publicUrl);

      // 更新資料庫
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) {
        console.error('[Avatar] 更新資料庫錯誤:', updateError);
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      setMessage({ type: 'success', text: '頭像上傳成功！✨' });

      // 通知主頁面更新
      setTimeout(() => {
        router.refresh();
        window.localStorage.setItem('avatar-updated', Date.now().toString());
      }, 1000);
    } catch (error: any) {
      console.error('[Avatar] 上傳失敗:', error);
      setMessage({
        type: 'error',
        text: `上傳失敗: ${error.message || '未知錯誤'}`
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
        <p className="text-slate-600">載入中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">基本資料</h2>

        <div className="space-y-6">
          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              用戶 ID
            </label>
            <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-600 text-sm font-mono">
              {userId}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              電子信箱
            </label>
            <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-600">
              {email}
            </div>
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              註冊方式
            </label>
            <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-600 capitalize">
              {provider === 'google' && '🔵 Google'}
              {provider === 'email' && '📧 Email'}
              {provider !== 'google' && provider !== 'email' && provider}
            </div>
          </div>

          {/* Created At */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              註冊日期
            </label>
            <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-600">
              {createdAt}
            </div>
          </div>

          {/* Nickname (Editable) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              暱稱
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all"
                placeholder="輸入你的暱稱"
              />
              <button
                onClick={handleSave}
                disabled={isSaving || newNickname === nickname}
                className="px-6 py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 text-white rounded-lg font-medium transition-all disabled:cursor-not-allowed"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* Avatar Upload */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">大頭貼</h2>

        <div className="flex items-center gap-6">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="頭像"
                className="w-24 h-24 rounded-full object-cover border-2 border-rose-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-200 to-purple-200 flex items-center justify-center text-4xl">
                {nickname.charAt(0)}
              </div>
            )}
          </div>

          <div>
            <p className="text-slate-600 mb-3">
              {avatarUrl ? '點擊更換頭像' : '上傳你的頭像'}
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar}
              className="hidden"
              id="avatar-upload"
            />
            <label
              htmlFor="avatar-upload"
              className={`px-4 py-2 rounded-lg text-sm inline-block transition-all ${
                isUploadingAvatar
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-rose-500 hover:bg-rose-600 text-white cursor-pointer'
              }`}
            >
              {isUploadingAvatar ? '上傳中...' : '選擇圖片'}
            </label>
            <p className="text-xs text-slate-500 mt-2">
              支持 JPG、PNG、GIF 格式，最大 5MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
