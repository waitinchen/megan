"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Volume2, Sparkles } from "lucide-react";
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

  useEffect(() => {
    setIsConnected(true);
  }, []);

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

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
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

      // Add Assistant Message
      const assistantMessage: Message = {
        role: "assistant",
        content: data.text,
        emotion: data.emotionTags,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Play Audio
      if (data.audio) {
        console.log("[Frontend] Audio received, length:", data.audio.length);
        playAudio(data.audio);
      } else {
        console.warn("[Frontend] ⚠️ No audio in response");
        console.log("[Frontend] Response data:", { 
          hasText: !!data.text, 
          hasEmotionTags: !!data.emotionTags,
          hasAudio: !!data.audio 
        });
      }

    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "嗯… 好像有點問題… （系統錯誤）" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (base64Audio: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      audioRef.current = audio;
      
      // Add error handling
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsPlaying(false);
      };
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      // Play with promise handling
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            console.log("✅ Audio started playing");
          })
          .catch((error) => {
            console.error("❌ Audio play failed:", error);
            setIsPlaying(false);
            // Try to show user-friendly error
            setMessages((prev) => [...prev, { 
              role: "assistant", 
              content: "（音訊播放失敗，請檢查瀏覽器設定）" 
            }]);
          });
      } else {
        // Fallback for older browsers where play() returns undefined
        // In this case, we assume playback started successfully
        setIsPlaying(true);
        console.log("✅ Audio started playing (legacy browser)");
      }
    } catch (error) {
      console.error("Audio setup error:", error);
      setIsPlaying(false);
    }
  };

  const bgGradient = emotionColors[currentEmotion] || emotionColors.neutral;
  const currentEmoji = emotionEmojis[currentEmotion] || "🌸";

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#F3F0F5]">

      {/* Header / Status */}
      <header className="w-full max-w-2xl p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {/* Avatar Container */}
          {!isAvatarZoomed && (
            <div
              className="relative w-12 h-12 border-2 border-white/50 shadow-sm rounded-full overflow-hidden cursor-pointer transition-all duration-300 ease-in-out"
              onClick={() => setIsAvatarZoomed(true)}
            >
              <img src="/avatar.png" alt="Megan" className="w-full h-full object-cover" />
            </div>
          )}
          
          {/* Zoomed Avatar - Centered */}
          {isAvatarZoomed && (
            <>
              <div
                className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none"
              >
                <div
                  className="w-80 h-80 shadow-2xl border-4 border-white rounded-full overflow-hidden cursor-pointer pointer-events-auto transition-all duration-300 ease-in-out"
                  onClick={() => setIsAvatarZoomed(false)}
                >
                  <img src="/avatar.png" alt="Megan" className="w-full h-full object-cover" />
                </div>
              </div>
            </>
          )}

          {/* Overlay for Zoom */}
          {isAvatarZoomed && (
            <div
              className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm"
              onClick={() => setIsAvatarZoomed(false)}
            />
          )}

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
        <div className="flex gap-2 items-center">
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

      {/* Chat Area */}
      <main className="flex-1 w-full max-w-2xl p-4 overflow-y-auto space-y-6 pb-32 scrollbar-hide">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-5 py-3 rounded-2xl shadow-sm backdrop-blur-sm text-sm leading-relaxed
                  ${msg.role === "user"
                    ? "bg-white/80 text-gray-800 rounded-br-none"
                    : "bg-white/60 text-gray-900 rounded-bl-none"
                  }`}
              >
                {msg.content}
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
      </main>

      {/* Input Area */}
      <footer className="w-full max-w-2xl p-4 fixed bottom-0 z-20">
        <div className="bg-white/80 backdrop-blur-xl p-2 rounded-3xl shadow-lg border border-white/20 flex items-center gap-2">
          <button className="p-3 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <Mic size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="請按此輸入文字..."
            className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 px-2"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3 rounded-full bg-rose-400 hover:bg-rose-500 text-white shadow-md transition-all disabled:opacity-50 disabled:hover:bg-rose-400"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-white/20">Powered by EL V3 & Lingya Soul</p>
        </div>
      </footer>
    </main>
  );
}
