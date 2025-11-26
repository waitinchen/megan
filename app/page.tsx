"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Volume2, Sparkles, Trash2, RotateCcw, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Emotion to Color Mapping
const emotionColors: Record<string, string> = {
  neutral: "from-pink-100 to-blue-100",
  warm: "from-orange-100 to-rose-100",
  flirty: "from-pink-200 to-rose-300",
  excited: "from-yellow-100 to-orange-200",
  sad: "from-blue-100 to-slate-200",
  tender: "from-rose-100 to-purple-100",
  whisper: "from-slate-100 to-zinc-200",
  playful: "from-fuchsia-100 to-pink-200",
  thoughtful: "from-emerald-50 to-teal-100",
  angry: "from-red-100 to-orange-100",
};

// Emotion to Emoji Mapping
const emotionEmojis: Record<string, string> = {
  neutral: "🌸",
  warm: "💞",
  flirty: "💕",
  excited: "✨",
  sad: "💧",
  tender: "💖",
  whisper: "🌙",
  playful: "🎀",
  thoughtful: "🤔",
  angry: "😤",
  sings: "🎤",
};

interface Message {
  role: "user" | "assistant";
  content: string;
  emotion?: string[];
  audio?: string; // Base64 encoded audio for replay/download
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>("neutral");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAvatarZoomed, setIsAvatarZoomed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [apiStatus, setApiStatus] = useState<{ elevenlabs: string; llm: string }>({ elevenlabs: 'checking', llm: 'checking' });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const autoSendTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversation history from localStorage on mount
  useEffect(() => {
    setIsConnected(true);

    // Load saved messages
    try {
      const savedMessages = localStorage.getItem('megan_conversation_history');
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          console.log('[Megan] 載入對話記錄:', parsed.length, '則訊息');
        }
      }
    } catch (error) {
      console.error('[Megan] 載入對話記錄失敗:', error);
    }
  }, []);

  // Save conversation history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem('megan_conversation_history', JSON.stringify(messages));
        console.log('[Megan] 💾 已儲存對話記錄:', messages.length, '則訊息');
      } catch (error) {
        console.error('[Megan] 儲存對話記錄失敗:', error);
      }
    }
  }, [messages]);

  // Check API health status
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setApiStatus(data);
      } catch (error) {
        console.error('Health check failed:', error);
        setApiStatus({ elevenlabs: 'error', llm: 'error' });
      }
    };
    checkHealth();
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // 清除自動發送計時器（如果用戶手動發送）
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare full conversation history including the new user message
      const fullHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      console.log('[Megan] 📤 發送對話記錄:', fullHistory.length, '則訊息');

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: fullHistory,
          userIdentity: "dad", // Defaulting to 'dad' for demo purposes as per Lingya logic
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update Emotion
      const dominantEmotion = data.emotionTags?.[0] || "neutral";
      setCurrentEmotion(dominantEmotion);

      // Add Assistant Message with audio
      const assistantMessage: Message = {
        role: "assistant",
        content: data.text,
        emotion: data.emotionTags,
        audio: data.audio, // Store audio for replay/download
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Play Audio
      if (data.audio) {
        playAudio(data.audio);
      }

    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "嗯... 好像有點問題... (系統錯誤)" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (base64Audio: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
    audioRef.current = audio;
    setIsPlaying(true);
    audio.play();
    audio.onended = () => setIsPlaying(false);
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem('megan_conversation_history');
      setMessages([]);
      setShowClearConfirm(false);
      console.log('[Megan] 🗑️ 對話記錄已清除');
    } catch (error) {
      console.error('[Megan] 清除對話記錄失敗:', error);
    }
  };

  const handleReplay = (audioBase64: string) => {
    console.log('[Megan] 🔁 重播語音');
    playAudio(audioBase64);
  };

  const handleDownload = (audioBase64: string, index: number) => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/mpeg' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `megan-voice-${index + 1}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('[Megan] 💾 已下載語音:', `megan-voice-${index + 1}.mp3`);
    } catch (error) {
      console.error('[Megan] 下載語音失敗:', error);
    }
  };

  // Voice input handler
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('抱歉，你的瀏覽器不支持語音輸入功能。請使用 Chrome、Edge 或 Safari。');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'zh-TW'; // 繁體中文
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      console.log('[Megan] 🎤 開始語音識別');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('[Megan] 🎤 識別結果:', transcript);

      // 先設置輸入
      setInput(transcript);

      // 清除之前的自動發送計時器（如果存在）
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
      }

      // 4 秒後自動發送
      autoSendTimerRef.current = setTimeout(async () => {
        console.log('[Megan] ⏱️ 自動發送語音輸入:', transcript);

        const trimmedInput = transcript.trim();
        if (!trimmedInput || isLoading) {
          console.log('[Megan] ⏱️ 自動發送取消：內容為空或正在載入');
          return;
        }

        // 清除計時器
        if (autoSendTimerRef.current) {
          clearTimeout(autoSendTimerRef.current);
          autoSendTimerRef.current = null;
        }

        // 創建用戶訊息
        const userMessage: Message = { role: "user", content: trimmedInput };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
          // 準備完整對話記錄
          const fullHistory = await new Promise<any[]>((resolve) => {
            setMessages((prevMessages) => {
              const history = [...prevMessages, userMessage].map(m => ({
                role: m.role,
                content: m.content
              }));
              resolve(history);
              return prevMessages;
            });
          });

          console.log('[Megan] 📤 發送對話記錄:', fullHistory.length, '則訊息');

          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: fullHistory,
              userIdentity: "dad",
            }),
          });

          const data = await response.json();

          if (data.error) {
            throw new Error(data.error);
          }

          // 更新情緒
          const dominantEmotion = data.emotionTags?.[0] || "neutral";
          setCurrentEmotion(dominantEmotion);

          // 添加助手訊息
          const assistantMessage: Message = {
            role: "assistant",
            content: data.text,
            emotion: data.emotionTags,
            audio: data.audio,
          };
          setMessages((prev) => [...prev, assistantMessage]);

          // 播放音訊
          if (data.audio) {
            playAudio(data.audio);
          }

        } catch (error) {
          console.error("Error:", error);
          setMessages((prev) => [...prev, { role: "assistant", content: "嗯... 好像有點問題... (系統錯誤)" }]);
        } finally {
          setIsLoading(false);
        }
      }, 4000);
    };

    recognition.onerror = (event: any) => {
      console.error('[Megan] 🎤 語音識別錯誤:', event.error);
      setIsListening(false);

      // 清除自動發送計時器
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
        autoSendTimerRef.current = null;
      }

      if (event.error === 'no-speech') {
        alert('沒有檢測到語音，請再試一次。');
      } else if (event.error === 'not-allowed') {
        alert('請允許麥克風權限以使用語音輸入功能。');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('[Megan] 🎤 語音識別結束');
    };

    recognition.start();
  };

  const bgGradient = emotionColors[currentEmotion] || emotionColors.neutral;
  const currentEmoji = emotionEmojis[currentEmotion] || "🌸";

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#F3F0F5]">

      {/* Floating Avatar & Name - Fixed Position */}
      {!isAvatarZoomed && (
        <div className="fixed top-6 left-6 z-50 flex items-center gap-3 bg-white/80 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-lg border border-white/20">
          {/* Avatar Container */}
          <div
            className="relative w-12 h-12 border-2 border-white/50 shadow-sm rounded-full overflow-hidden cursor-pointer transition-all duration-300 ease-in-out hover:scale-105"
            onClick={() => setIsAvatarZoomed(true)}
          >
            <img src="/avatar.png" alt="Megan" className="w-full h-full object-cover" />
          </div>

          <div>
            <h1 className="font-semibold text-slate-800">Megan</h1>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-slate-300"}`} />
              <span className="text-xs text-slate-500 font-medium">
                {isConnected ? "在線上" : "連線中..."}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Avatar - Centered (Full Screen Overlay) */}
      {isAvatarZoomed && (
        <>
          {/* Dark Overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm"
            onClick={() => setIsAvatarZoomed(false)}
          />
          {/* Centered Avatar */}
          <div
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
          >
            <div
              className="w-full max-w-md h-[85vh] shadow-2xl border-4 border-white rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 ease-in-out bg-white"
              onClick={() => setIsAvatarZoomed(false)}
            >
              <img src="/avatar.png" alt="Megan" className="w-full h-full object-contain" />
            </div>
          </div>
        </>
      )}

      {/* Header / Status - Right Side Only */}
      <header className="fixed top-6 right-6 z-50 flex items-center justify-end">
        <div className="flex gap-2 items-center">
          {/* Clear History Button */}
          {messages.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              title="清除對話記錄"
            >
              <Trash2 size={16} />
            </button>
          )}
          {/* API Status Indicator */}
          <div className="flex gap-2 text-xs font-mono">
            <div className="flex items-center gap-1">
              <span className="text-slate-600">EL:</span>
              <span className={`px-1.5 py-0.5 rounded ${apiStatus.elevenlabs === 'ok' ? 'bg-emerald-100 text-emerald-700' :
                apiStatus.elevenlabs === 'checking' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                {apiStatus.elevenlabs === 'ok' ? 'OK' : apiStatus.elevenlabs === 'checking' ? '...' : 'ERR'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-600">LLM:</span>
              <span className={`px-1.5 py-0.5 rounded ${apiStatus.llm === 'ok' ? 'bg-emerald-100 text-emerald-700' :
                apiStatus.llm === 'checking' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                {apiStatus.llm === 'ok' ? 'OK' : apiStatus.llm === 'checking' ? '...' : 'ERR'}
              </span>
            </div>
          </div>
          {/* Debug Tags */}
          <div className="hidden sm:flex gap-1">
            {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].emotion?.map(tag => (
              <span key={tag} className="px-2 py-1 bg-white/40 rounded-full text-xs text-gray-600">#{tag}</span>
            ))}
          </div>
        </div>
      </header>

      {/* Chat Area - Add top padding to avoid fixed header */}
      <div className="flex-1 w-full max-w-2xl p-4 pt-24 overflow-y-auto space-y-6 pb-32 scrollbar-hide">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="flex flex-col gap-2 max-w-[80%]">
                <div
                  className={`px-5 py-3 rounded-2xl shadow-sm backdrop-blur-sm text-sm leading-relaxed
                    ${msg.role === "user"
                      ? "bg-white/80 text-gray-800 rounded-br-none"
                      : "bg-white/60 text-gray-900 rounded-bl-none"
                    }`}
                >
                  {msg.content}
                </div>

                {/* Audio controls for assistant messages */}
                {msg.role === "assistant" && msg.audio && (
                  <div className="flex gap-2 items-center px-2">
                    <button
                      onClick={() => handleReplay(msg.audio!)}
                      className="p-1.5 rounded-lg hover:bg-white/60 text-slate-500 hover:text-rose-500 transition-colors"
                      title="重播語音"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      onClick={() => handleDownload(msg.audio!, idx)}
                      className="p-1.5 rounded-lg hover:bg-white/60 text-slate-500 hover:text-blue-500 transition-colors"
                      title="下載語音"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white/40 px-4 py-2 rounded-full flex gap-1 items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <footer className="w-full max-w-2xl p-4 fixed bottom-0 z-20">
        <div className="bg-white/80 backdrop-blur-xl p-2 rounded-3xl shadow-lg border border-white/20 flex items-end gap-2">
          <button
            onClick={handleVoiceInput}
            disabled={isLoading || isListening}
            className={`p-3 rounded-full transition-all mb-1 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'hover:bg-gray-100 text-gray-500'
            }`}
            title={isListening ? '正在錄音...' : '點擊開始語音輸入'}
          >
            <Mic size={20} />
          </button>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // 用戶手動修改輸入框時，取消自動發送計時器
              if (autoSendTimerRef.current) {
                clearTimeout(autoSendTimerRef.current);
                autoSendTimerRef.current = null;
              }
            }}
            onKeyDown={(e) => {
              // Enter 發送，Shift+Enter 換行
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="請按此輸入文字... (Shift+Enter 換行)"
            className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 px-2 py-2 resize-none max-h-32 overflow-y-auto"
            rows={1}
            disabled={isLoading}
            style={{
              minHeight: '24px',
              height: 'auto'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3 rounded-full bg-rose-400 hover:bg-rose-500 text-white shadow-md transition-all disabled:opacity-50 disabled:hover:bg-rose-400 mb-1"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-white/20">Powered by EL V3 & Lingya Soul</p>
        </div>
      </footer>

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 pointer-events-auto">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">清除對話記錄？</h3>
              <p className="text-sm text-slate-600 mb-6">
                確定要清除所有對話記錄嗎？此操作無法復原。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleClearHistory}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  清除
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
