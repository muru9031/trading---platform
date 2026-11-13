import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function WelcomeOverlay({ user, onClose }) {
  useEffect(() => {
    // Fire confetti on mount
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        zIndex: 9999
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        zIndex: 9999
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getDisplayName = () => {
    if (!user) return 'Trader';
    if (user.user_metadata && user.user_metadata.full_name) return user.user_metadata.full_name;
    if (user.email) return user.email.split('@')[0];
    return 'Trader';
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-opacity duration-1000 animate-in fade-in zoom-in">
      <div className="text-center translate-y-[-10vh]">
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4 drop-shadow-lg animate-in slide-in-from-bottom-4 duration-700">
          Welcome Trader,
        </h1>
        <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-md animate-in slide-in-from-bottom-4 duration-1000 delay-150">
          {getDisplayName()}!
        </h2>
      </div>
    </div>
  );
}
