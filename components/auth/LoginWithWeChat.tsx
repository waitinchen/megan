'use client';

/**
 * WeChat Login Button (Placeholder - Display Only)
 * 
 * This is a placeholder component that shows the WeChat login button UI
 * but does not trigger any functionality. All WeChat OAuth functionality
 * has been disabled to avoid runtime conflicts.
 * 
 * When ready to implement full WeChat login, restore the functionality
 * and uncomment the API routes.
 */

interface LoginWithWeChatButtonProps {
  className?: string;
  text?: string;
  variant?: 'default' | 'compact';
}

export function LoginWithWeChatButton({ 
  className, 
  text = '微信登入（開發中）',
  variant = 'default' 
}: LoginWithWeChatButtonProps = {}) {
  // All functionality disabled - button is display-only
  // const loginWithWeChat = () => {
  //   // DISABLED: WeChat login functionality
  //   // This would have triggered /api/auth/wechat/login
  // };

  const defaultClassName = variant === 'compact'
    ? "px-4 py-2 bg-[#07C160] text-white border border-[#06AD56] rounded-lg shadow hover:shadow-md opacity-60 cursor-default transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-sm"
    : "w-full px-6 py-4 bg-[#07C160] text-white border-2 border-[#06AD56] rounded-xl shadow-md opacity-60 cursor-default transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium";

  return (
    <button
      disabled
      className={className || defaultClassName}
      title="微信登入功能開發中，敬請期待"
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
