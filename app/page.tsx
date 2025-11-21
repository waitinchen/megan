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

  const bgGradient = emotionColors[currentEmotion] || emotionColors.neutral;
  const currentEmoji = emotionEmojis[currentEmotion] || "🌸";

  return (
    <div className={`flex min-h-screen flex-col items-center justify-between bg-gradient-to-br ${bgGradient} transition-colors duration-1000 ease-in-out`}>

      {/* Header / Status */}
      <header className="w-full max-w-2xl p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div
              animate={{ scale: isPlaying ? [1, 1.1, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-12 h-12 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center text-2xl shadow-sm"
            >
              {currentEmoji}
            </motion.div>
            {isPlaying && (
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg">花小軟</h1>
            <p className="text-xs text-gray-500 font-medium">
              {isPlaying ? "正在說話..." : "聆聽中..."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
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
            placeholder="和花小軟說說話..."
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
          <p className="text-[10px] text-gray-400">Powered by ElevenLabs V3 & Lingya Soul</p>
        </div>
      </footer>
    </div>
  );
}

