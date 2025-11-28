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
      <svg
        className={variant === 'compact' ? 'w-5 h-5' : 'w-6 h-6'}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.349-8.596-6.349zM5.785 6.141c.642 0 1.162.529 1.162 1.18 0 .653-.52 1.18-1.162 1.18-.642 0-1.162-.527-1.162-1.18 0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18 0 .653-.52 1.18-1.162 1.18-.642 0-1.162-.527-1.162-1.18 0-.651.52-1.18 1.162-1.18z"
          fill="currentColor"
        />
        <path
          d="M18.784 5.305C17.313 3.711 15.365 2.83 13.26 2.83c-3.997 0-7.254 2.91-7.543 6.593-.324 4.125 2.235 6.636 5.096 7.52.26.081.527.14.801.174.976-.705 2.301-1.504 3.349-2.633a.902.902 0 0 1 .692-.283c.11.008.222.013.333.013 3.997 0 7.255-2.91 7.544-6.593.101-1.29-.176-2.498-.748-3.518-1.12-1.998-3.032-3.092-4.792-3.092zm-4.346 4.847c-.53 0-.96.436-.96.974 0 .537.43.974.96.974.531 0 .96-.437.96-.974 0-.538-.429-.974-.96-.974zm3.786 0c-.53 0-.96.436-.96.974 0 .537.43.974.96.974.531 0 .96-.437.96-.974 0-.538-.429-.974-.96-.974z"
          fill="currentColor"
        />
      </svg>
      {text}
    </button>
  );
}

