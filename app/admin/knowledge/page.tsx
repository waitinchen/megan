'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface KnowledgeItem {
    id: string;
    title: string;
    content: string;
    category: string;
    createdAt: string;
}

export default function KnowledgePage() {
    const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newItem, setNewItem] = useState({
        title: '',
        content: '',
        category: 'general',
    });

    useEffect(() => {
        loadKnowledge();
    }, []);

    async function loadKnowledge() {
        try {
            const response = await fetch('/api/admin/knowledge');
            if (response.ok) {
                const data = await response.json();
                setKnowledge(data.knowledge || []);
            }
        } catch (error) {
            console.error('[Admin Knowledge] 載入失敗:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAdd() {
        if (!newItem.title || !newItem.content) {
            alert('請填寫標題和內容');
            return;
        }

        try {
            const response = await fetch('/api/admin/knowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem),
            });

            if (response.ok) {
                await loadKnowledge();
                setNewItem({ title: '', content: '', category: 'general' });
                alert('✅ 知識已添加!');
            }
        } catch (error) {
            console.error('[Admin Knowledge] 添加失敗:', error);
            alert('❌ 添加失敗');
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('確定要刪除這條知識嗎?')) return;

        try {
            const response = await fetch(`/api/admin/knowledge?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await loadKnowledge();
                alert('✅ 知識已刪除!');
            }
        } catch (error) {
            console.error('[Admin Knowledge] 刪除失敗:', error);
            alert('❌ 刪除失敗');
        }
    }

    if (isLoading) {
        return <div className="text-center py-12 text-slate-500">載入中...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">知識庫管理</h1>
                <p className="text-sm text-slate-500 mt-1">
                    管理 Megan 的知識庫內容
                </p>
            </div>

            {/* Add New Knowledge */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">添加新知識</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            分類
                        </label>
                        <select
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-700"
                        >
                            <option value="general">一般知識</option>
                            <option value="personality">人格特質</option>
                            <option value="skills">技能知識</option>
                            <option value="facts">事實資料</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            標題
                        </label>
                        <input
                            type="text"
                            value={newItem.title}
                            onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-700 placeholder:text-slate-400"
                            placeholder="輸入知識標題..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            內容
                        </label>
                        <textarea
                            value={newItem.content}
                            onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                            className="w-full h-32 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none text-slate-700 placeholder:text-slate-400"
                            placeholder="輸入知識內容..."
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                    >
                        <Plus size={16} />
                        添加知識
                    </button>
                </div>
            </div>

            {/* Knowledge List */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                    知識列表 ({knowledge.length})
                </h2>
                {knowledge.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        還沒有任何知識,開始添加吧!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {knowledge.map((item) => (
                            <div
                                key={item.id}
                                className="border border-slate-200 rounded-lg p-4 hover:border-rose-300 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded">
                                                {item.category}
                                            </span>
                                            <h3 className="font-semibold text-slate-800">
                                                {item.title}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                            {item.content}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            創建於: {new Date(item.createdAt).toLocaleString('zh-TW')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="刪除"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 提示</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                    <li>• 知識庫用於存儲 Megan 需要記住的特定資訊</li>
                    <li>• 可以包含產品知識、常見問題、特定事實等</li>
                    <li>• 建議按分類組織知識,方便管理和檢索</li>
                    <li>• 未來將支持向量搜索和智能檢索</li>
                </ul>
            </div>
        </div>
    );
}
