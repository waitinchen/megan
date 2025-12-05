/**
 * Memory Extraction Timer Component
 * 顯示記憶提取倒數計時器
 */

'use client';

import { useEffect, useState } from 'react';

interface MemoryExtractionTimerProps {
    countdown: number; // 剩餘秒數 (0-30)
    isExtracting: boolean; // 是否正在提取
    onCancel?: () => void; // 取消回調
}

export function MemoryExtractionTimer({
    countdown,
    isExtracting,
    onCancel,
}: MemoryExtractionTimerProps) {
    const [show, setShow] = useState(false);
    const [justCompleted, setJustCompleted] = useState(false);

    // 控制顯示/隱藏
    useEffect(() => {
        if (countdown > 0 && countdown <= 30) {
            setShow(true);
            setJustCompleted(false);
        } else if (countdown === 0 && isExtracting) {
            setJustCompleted(true);
            // 3 秒後隱藏完成提示
            const timer = setTimeout(() => {
                setShow(false);
                setJustCompleted(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [countdown, isExtracting]);

    if (!show) return null;

    const progress = ((30 - countdown) / 30) * 100;

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-pink-100 p-4 min-w-[280px]">
                {justCompleted ? (
                    // 提取完成提示
                    <div className="flex items-center gap-3 animate-fade-in">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">記憶提取完成!</p>
                            <p className="text-xs text-gray-500">已保存您的對話記憶</p>
                        </div>
                    </div>
                ) : (
                    // 倒數計時中
                    <>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center animate-pulse">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">記憶提取中...</p>
                                    <p className="text-xs text-gray-500">{countdown} 秒</p>
                                </div>
                            </div>
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label="取消"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* 進度條 */}
                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full transition-all duration-1000 ease-linear"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                            </div>
                        </div>

                        {/* 進度百分比 */}
                        <div className="mt-2 text-center">
                            <span className="text-xs font-medium text-gray-600">
                                {Math.round(progress)}%
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Tailwind 動畫配置 (需要添加到 tailwind.config.js)
/*
animation: {
  'slide-up': 'slideUp 0.3s ease-out',
  'fade-in': 'fadeIn 0.3s ease-out',
  'shimmer': 'shimmer 2s infinite',
},
keyframes: {
  slideUp: {
    '0%': { transform: 'translateY(100%)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  shimmer: {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
}
*/
