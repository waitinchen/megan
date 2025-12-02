/**
 * 診斷收藏功能問題
 * 
 * 在瀏覽器 Console 中執行此腳本
 */

async function diagnoseFavorites() {
    console.log('=== 開始診斷收藏功能 ===\n');

    // 1. 檢查當前用戶
    const { createClient } = await import('/app/utils/supabase/client');
    const supabase = createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error('❌ 未登入或獲取用戶失敗:', userError);
        return;
    }

    console.log('✅ 當前用戶:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('');

    // 2. 直接查詢 Supabase
    console.log('📊 直接從 Supabase 查詢收藏...');
    const { data: directData, error: directError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id);

    if (directError) {
        console.error('❌ Supabase 查詢失敗:', directError);
    } else {
        console.log('✅ Supabase 直接查詢結果:', directData?.length || 0, '個收藏');
        if (directData && directData.length > 0) {
            console.log('  收藏列表:', directData);
        }
    }
    console.log('');

    // 3. 測試 API 端點
    console.log('🌐 測試 API 端點...');
    try {
        const response = await fetch('/api/favorites?sort=desc');
        const apiData = await response.json();

        console.log('  - Status:', response.status);
        console.log('  - OK:', response.ok);
        console.log('  - Response:', apiData);
        console.log('  - 收藏數量:', apiData.favorites?.length || 0);

        if (response.ok && apiData.favorites) {
            console.log('✅ API 調用成功');
        } else {
            console.error('❌ API 調用失敗');
        }
    } catch (apiError) {
        console.error('❌ API 調用異常:', apiError);
    }
    console.log('');

    // 4. 檢查 Session
    console.log('🔐 檢查 Session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        console.error('❌ Session 獲取失敗:', sessionError);
    } else {
        console.log('✅ Session 有效');
        console.log('  - Access Token:', session.access_token ? '存在' : '缺失');
        console.log('  - Expires At:', new Date(session.expires_at * 1000).toLocaleString());
    }
    console.log('');

    console.log('=== 診斷完成 ===');
}

// 執行診斷
diagnoseFavorites().catch(err => console.error('診斷腳本錯誤:', err));
