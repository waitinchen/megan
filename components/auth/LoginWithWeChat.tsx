'use client';

interface LoginWithWeChatButtonProps {
  className?: string;
  text?: string;
  variant?: 'default' | 'compact';
}

export function LoginWithWeChatButton({ 
  className, 
  text = '使用微信登入',
  variant = 'default' 
}: LoginWithWeChatButtonProps = {}) {
  const loginWithWeChat = () => {
    const ua = navigator.userAgent.toLowerCase();
    const inWeChat = ua.includes('micromessenger');

    const fallback = () => {
      // fallback 到原本的 Website Login QR 掃碼流程
      window.location.href = '/api/auth/wechat/login';
    };

    if (inWeChat) {
      // 在微信內瀏覽器，直接使用 scheme
      window.location.href = 'weixin://dl/login';
      return;
    }

    // 試圖喚起微信 App
    const openWeChat = () => {
      const scheme = 'weixin://dl/login';
      const start = Date.now();
      
      window.location.href = scheme;

      // 監測是否成功啟動 App（瀏覽器進入背景）
      setTimeout(() => {
        const stayed = !document.hidden;
        const cost = Date.now() - start;

        // stayed = true → 用戶仍在瀏覽器 → App 沒被喚起
        // cost < 500 → 代表沒有跳轉 (App scheme 被阻擋)
        if (stayed || cost < 500) {
          fallback();
        }
      }, 600);
    };

    openWeChat();
  };

  const defaultClassName = variant === 'compact'
    ? "px-4 py-2 bg-[#07C160] text-white border border-[#06AD56] rounded-lg shadow hover:shadow-md hover:bg-[#06AD56] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-sm"
    : "w-full px-6 py-4 bg-[#07C160] text-white border-2 border-[#06AD56] rounded-xl shadow-md hover:shadow-lg hover:bg-[#06AD56] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium";

  return (
    <button
      onClick={loginWithWeChat}
      className={className || defaultClassName}
    >
      <img
        src="/wechat-logo.png"
        alt="WeChat"
        className={variant === 'compact' ? 'w-5 h-5' : 'w-6 h-6'}
      />
      {text}
    </button>
  );
}

