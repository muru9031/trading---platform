import React, { useState } from 'react';
import { TICKER_DETAILS } from '../utils/tickerMap';

export default function AssetLogo({ symbol, type, className = "w-6 h-6" }) {
  const [hasError, setHasError] = useState(false);

  if (!symbol) return null;

  const getInitials = (sym) => {
    return sym.replace('.NS', '').replace('.BO', '').substring(0, 2).toUpperCase();
  };

  const renderFallback = () => (
    <div className={`flex items-center justify-center rounded-full bg-blue-500/20 text-blue-500 font-bold border border-blue-500/30 ${className}`} style={{ fontSize: '0.65rem' }}>
      {getInitials(symbol)}
    </div>
  );

  // Use icon directly from TICKER_DETAILS if defined
  if (TICKER_DETAILS[symbol] && TICKER_DETAILS[symbol].icon) {
    if (hasError) return renderFallback();
    return (
      <img 
        src={TICKER_DETAILS[symbol].icon} 
        alt={symbol} 
        className={`rounded-full bg-gray-100 dark:bg-slate-800 object-contain p-[1px] border border-gray-200 dark:border-slate-700 ${className}`}
        onError={() => setHasError(true)}
      />
    );
  }

  // Automatically infer type if not provided
  let inferredType = type;
  if (!inferredType) {
     if (symbol.includes('=X') || symbol.includes('=F')) inferredType = 'forex';
     else if (symbol.includes('-USD') || symbol.includes('-BTC')) inferredType = 'crypto';
     else inferredType = 'equity';
  }

  const getFlagCode = (currency) => {
    const map = {
      'eur': 'eu', 'usd': 'us', 'gbp': 'gb', 'jpy': 'jp', 'aud': 'au',
      'cad': 'ca', 'chf': 'ch', 'nzd': 'nz', 'inr': 'in', 'cny': 'cn'
    };
    return map[currency.toLowerCase()] || currency.toLowerCase().substring(0,2);
  }

  if (inferredType === 'forex') {
    const baseCurrency = symbol.substring(0, 3).toLowerCase();
    const quoteCurrency = symbol.substring(3, 6).toLowerCase();
    const baseFlag = `https://flagcdn.com/w40/${getFlagCode(baseCurrency)}.png`;
    const quoteFlag = `https://flagcdn.com/w40/${getFlagCode(quoteCurrency)}.png`;

    if (hasError) return renderFallback();
    return (
      <div className="flex items-center -space-x-2 shrink-0">
        <img src={baseFlag} className={`rounded-full bg-gray-100 dark:bg-slate-800 object-cover border border-gray-300 dark:border-slate-700 z-10 ${className}`} alt={baseCurrency} onError={() => setHasError(true)} />
        <img src={quoteFlag} className={`rounded-full bg-gray-100 dark:bg-slate-800 object-cover border border-gray-300 dark:border-slate-700 z-0 ${className}`} alt={quoteCurrency} onError={() => setHasError(true)} />
      </div>
    );
  }
  let src = '';
  if (inferredType === 'crypto') {
    let clean = symbol.toLowerCase().replace('-usd', '').replace('usd', '');
    if (clean === 'btc') clean = 'bitcoin';
    if (clean === 'eth') clean = 'ethereum';
    if (clean === 'sol') clean = 'solana';
    if (clean === 'doge') clean = 'dogecoin';
    src = `https://assets.coincap.io/assets/icons/${clean}@2x.png`;
  } 
  else {
    const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
    src = `https://ui-avatars.com/api/?name=${cleanSymbol}&background=random&color=fff&bold=true`;
  }

  if (hasError) return renderFallback();

  return (
    <img 
      src={src} 
      alt={symbol} 
      className={`rounded-full bg-gray-100 dark:bg-slate-800 object-contain p-[1px] border border-gray-200 dark:border-slate-700 ${className}`}
      onError={() => setHasError(true)}
    />
  );
}


