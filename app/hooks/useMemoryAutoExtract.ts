/**
 * useMemoryAutoExtract Hook
 * 自動記憶提取 - 在對話結束時觸發
 */

import { useEffect, useRef } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface UseMemoryAutoExtractOptions {
    conversationId: string | null;
    messages: Message[];
    enabled?: boolean;
}

export function useMemoryAutoExtract({
    conversationId,
    messages,
    enabled = true,
}: UseMemoryAutoExtractOptions) {
    const lastExtractTimeRef = useRef<number>(0);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 提取記憶函數
    const extractMemory = () => {
        if (!conversationId || messages.length < 5 || !enabled) {
            return;
        }

        // 避免頻繁提取 (至少間隔 60 秒)
        const now = Date.now();
        if (now - lastExtractTimeRef.current < 60000) {
            return;
        }

        lastExtractTimeRef.current = now;

        // 只發送最後 20 則訊息
        const recentMessages = messages.slice(-20);

        const data = JSON.stringify({
            conversationId,
            messages: recentMessages,
        });

        // 使用 sendBeacon 確保請求發送 (即使頁面關閉)
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/memory/extract', data);
            console.log('[Memory Auto Extract] 記憶提取已觸發 (sendBeacon)');
        } else {
            // Fallback: 使用 fetch
            fetch('/api/memory/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: data,
                keepalive: true,
            }).catch(err => {
                console.error('[Memory Auto Extract] 提取失敗:', err);
            });
            console.log('[Memory Auto Extract] 記憶提取已觸發 (fetch)');
        }
    };

    // 1. 監聽頁面關閉/離開
    useEffect(() => {
        const handleBeforeUnload = () => {
            extractMemory();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [conversationId, messages, enabled]);

    // 2. 監聽 30 秒無活動
    useEffect(() => {
        // 清除舊的計時器
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        // 設置新的計時器
        if (conversationId && messages.length >= 5 && enabled) {
            inactivityTimerRef.current = setTimeout(() => {
                console.log('[Memory Auto Extract] 30 秒無活動,觸發提取');
                extractMemory();
            }, 30000); // 30 秒
        }

        return () => {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
        };
    }, [messages.length, conversationId, enabled]);

    // 3. 組件卸載時提取
    useEffect(() => {
        return () => {
            extractMemory();
        };
    }, []);
}
