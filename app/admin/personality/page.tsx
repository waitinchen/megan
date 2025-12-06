'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';

export default function PersonalityPage() {
    const [systemPrompt, setSystemPrompt] = useState('');
    const [firstMessage, setFirstMessage] = useState('');
    const [isSaving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPersonality();
    }, []);

    async function loadPersonality() {
        try {
            const response = await fetch('/api/admin/personality');
            if (response.ok) {
                const result = await response.json();
                console.log('[Admin Personality] API Response:', result);

                // API 返回格式: { success: true, data: { systemPrompt, firstMessage, ... } }
                const data = result.data || result;
                setSystemPrompt(data.systemPrompt || '');
                setFirstMessage(data.firstMessage || '');
            } else {
                console.error('[Admin Personality] API 錯誤:', response.status);
                alert('❌ 載入失敗');
            }
        } catch (error: any) {
            console.error('[Admin Personality] 載入失敗:', error);
            alert('❌ 載入失敗: ' + (error?.message || '未知錯誤'));
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        if (!systemPrompt || !firstMessage) {
            alert('⚠️ 請填寫 System Prompt 和 First Message');
            return;
        }

        try {
            setSaving(true);
            const response = await fetch('/api/admin/personality', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt,
                    firstMessage,
                    description: `更新於 ${new Date().toLocaleString('zh-TW')}`,
                }),
            });

            const result = await response.json();
            console.log('[Admin Personality] Save Response:', result);

            if (response.ok && result.success) {
                alert(`✅ ${result.message || '人格設定已保存!'}`);
                await loadPersonality(); // 重新載入
            } else {
                alert(`❌ 保存失敗: ${result.message || '未知錯誤'}`);
            }
        } catch (error: any) {
            console.error('[Admin Personality] 保存失敗:', error);
            alert('❌ 保存失敗: ' + (error?.message || '未知錯誤'));
        } finally {
            setSaving(false);
        }
    }

    if (isLoading) {
        return <div className="text-center py-12 text-slate-500">載入中...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">人格管理</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        管理 Megan 的 System Prompt 和 First Message
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={loadPersonality}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <RefreshCw size={16} />
                        重新載入
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors"
                    >
                        <Save size={16} />
                        {isSaving ? '保存中...' : '保存變更'}
                    </button>
                </div>
            </div>

            {/* System Prompt */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        System Prompt
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                        定義 Megan 的核心人格、行為模式和對話風格
                    </p>
                </div>
                <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full h-96 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent font-mono text-sm resize-none text-slate-700 placeholder:text-slate-400"
                    placeholder="輸入 System Prompt..."
                />
                <div className="mt-2 text-xs text-slate-500">
                    字數: {systemPrompt.length}
                </div>
            </div>

            {/* First Message */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        First Message
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                        Megan 的第一句話,用於開啟對話
                    </p>
                </div>
                <textarea
                    value={firstMessage}
                    onChange={(e) => setFirstMessage(e.target.value)}
                    className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm resize-none text-slate-700 placeholder:text-slate-400"
                    placeholder="輸入 First Message..."
                />
                <div className="mt-2 text-xs text-slate-500">
                    字數: {firstMessage.length}
                </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 提示</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                    <li>• System Prompt 定義了 Megan 的核心人格和行為規則</li>
                    <li>• First Message 是用戶開始對話時 Megan 的第一句話</li>
                    <li>• 修改後需要重新部署才會生效</li>
                    <li>• 建議先在測試環境驗證後再應用到生產環境</li>
                </ul>
            </div>
        </div>
    );
}
