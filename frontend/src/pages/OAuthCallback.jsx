import React, { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useToast } from '../contexts/ToastContext';

export default function OAuthCallback() {
  const [status, setStatus] = useState('authenticating'); // 'authenticating' | 'success' | 'error'
  const { connectBroker } = usePortfolio();
  const { showToast } = useToast();

  useEffect(() => {
    const processCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const stateParam = urlParams.get('state');

      if (!code) {
        setStatus('error');
        showToast("Authorization failed: Missing code.", "error");
        setTimeout(() => window.location.href = '/', 2000);
        return;
      }

      try {
        const state = JSON.parse(decodeURIComponent(stateParam || '{}'));
        const { broker = 'Unknown Broker', market = 'All' } = state;

        // Mock 2-second backend token exchange
        setTimeout(async () => {
          // Instead of calling a real backend, we mock the success and use context directly
          const mockToken = `oauth_token_${Math.random().toString(36).substr(2, 9)}`;
          await connectBroker(broker, { token: mockToken }, market);
          
          setStatus('success');
          // Redirect back seamlessly
          setTimeout(() => window.location.href = '/', 1500);
        }, 2000);

      } catch (err) {
        setStatus('error');
        showToast("Invalid state parameter during OAuth flow.", "error");
        setTimeout(() => window.location.href = '/', 2000);
      }
    };

    processCallback();
  }, [connectBroker, showToast]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0b0e14]">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center flex flex-col items-center">
        
        {status === 'authenticating' && (
          <>
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Authenticating...</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Securely connecting your broker account.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={64} className="text-emerald-500 mb-6 animate-bounce" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Connected Successfully!</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Redirecting you back to your portfolio...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={64} className="text-red-500 mb-6" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Connection Failed</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Redirecting you back to your portfolio...</p>
          </>
        )}

      </div>
    </div>
  );
}
