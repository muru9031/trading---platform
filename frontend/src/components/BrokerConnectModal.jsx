import React, { useState } from 'react';
import { X, ExternalLink, ShieldCheck, Loader2 } from 'lucide-react';

const BROKERS = [
  { id: 'zerodha', name: 'Zerodha', color: '#ff5722', url: 'https://kite.zerodha.com' },
  { id: 'dhan', name: 'Dhan', color: '#16a34a', url: 'https://dhan.co' },
  { id: 'upstox', name: 'Upstox', color: '#8b5cf6', url: 'https://upstox.com' },
  { id: 'fyers', name: 'Fyers', color: '#0ea5e9', url: 'https://fyers.in' },
  { id: 'angelone', name: 'Angel One', color: '#ea580c', url: 'https://angelone.in' },
];

export default function BrokerConnectModal({ isOpen, onClose, onConnect }) {
  const [connectingTo, setConnectingTo] = useState(null);

  if (!isOpen) return null;

  const handleConnect = (broker) => {
    setConnectingTo(broker.id);
    // Simulate OAuth redirect / connection delay
    setTimeout(() => {
      onConnect(broker.name);
      setConnectingTo(null);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="text-teal-500" size={24} />
              Connect Your Broker
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              Link your trading account to access real-time market data and execute paper trades based on live conditions.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 p-1.5 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        {/* Broker Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            {BROKERS.map((broker) => (
              <button
                key={broker.id}
                onClick={() => handleConnect(broker)}
                disabled={connectingTo !== null}
                className={`group relative overflow-hidden flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 
                  ${connectingTo === broker.id 
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' 
                    : 'border-gray-200 dark:border-slate-700 bg-gray-50 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-md'
                  }`}
                style={{ '--hover-color': broker.color }}
              >
                {/* Custom hover border color injection */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" 
                  style={{ backgroundColor: broker.color }} 
                />
                
                {connectingTo === broker.id ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-teal-500" size={24} />
                    <span className="text-xs font-medium text-teal-600 dark:text-teal-400">Connecting...</span>
                  </div>
                ) : (
                  <>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{broker.name}</span>
                    <span className="mt-1 flex items-center text-[10px] text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300 transition-colors">
                      Connect <ExternalLink size={10} className="ml-1" />
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
            <p className="text-center text-[11px] text-gray-400 dark:text-slate-500">
              We only require read-only access. Your funds and trades remain 100% secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
