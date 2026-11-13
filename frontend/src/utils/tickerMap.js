// tickerMap.js

// 1. Grouped by Market for strict UI filtering
export const TICKER_MAP = {
  "US Market": [
    'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'META', 'AMZN', 'AMD', 'INTC', 'CRM',
    'NFLX', 'ADBE', 'CSCO', 'PEP', 'AVGO', 'COST', 'TMUS', '^GSPC', '^DJI', '^IXIC'
  ],
  "Indian Market": [
    'TATAPOWER.NS', 'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
    'WIPRO.NS', 'KOTAKBANK.NS', 'LT.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS',
    'HINDUNILVR.NS', 'AXISBANK.NS', 'BAJFINANCE.NS', 'MARUTI.NS', 'HCLTECH.NS',
    'SUNPHARMA.NS', 'TITAN.NS', 'ULTRACEMCO.NS', 'ASIANPAINT.NS', 'M&M.NS',
    'TATAMOTORS.NS', 'TATASTEEL.NS', 'BAJAJFINSV.NS', 'POWERGRID.NS', 'NTPC.NS',
    '^NSEI', '^BSESN'
  ],
  "Crypto": [
    'BTC-USD', 'ETH-USD', 'BNB-USD', 'SOL-USD', 'ADA-USD', 'XRP-USD', 'DOT-USD', 'DOGE-USD'
  ],
  "Forex": [
    'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'USDCAD=X', 'USDCHF=X'
  ],
  "Commodity": [
    'GC=F', 'SI=F', 'CL=F', 'NG=F', 'ZW=F', 'ZC=F', 'ZS=F'
  ]
};

// 2. Metadata for Logos and Display Names
export const TICKER_DETAILS = {
  // US Top Tech
  'AAPL': { name: 'Apple Inc.', domain: 'apple.com' },
  'TSLA': { name: 'Tesla Inc.', domain: 'tesla.com' },
  'NVDA': { name: 'NVIDIA Corp.', domain: 'nvidia.com' },
  'MSFT': { name: 'Microsoft Corp.', domain: 'microsoft.com' },
  'GOOGL': { name: 'Alphabet Inc.', domain: 'abc.xyz' },
  'META': { name: 'Meta Platforms Inc.', domain: 'meta.com' },
  'AMZN': { name: 'Amazon.com Inc.', domain: 'amazon.com' },
  'AMD': { name: 'Advanced Micro Devices', domain: 'amd.com' },
  'INTC': { name: 'Intel Corporation', domain: 'intel.com' },
  'CRM': { name: 'Salesforce Inc.', domain: 'salesforce.com' },
  'NFLX': { name: 'Netflix Inc.', domain: 'netflix.com' },
  'ADBE': { name: 'Adobe Inc.', domain: 'adobe.com' },
  'CSCO': { name: 'Cisco Systems', domain: 'cisco.com' },
  'PEP': { name: 'PepsiCo Inc.', domain: 'pepsico.com' },
  'AVGO': { name: 'Broadcom Inc.', domain: 'broadcom.com' },
  'COST': { name: 'Costco Wholesale', domain: 'costco.com' },
  'TMUS': { name: 'T-Mobile US', domain: 't-mobile.com' },
  '^GSPC': { name: 'S&P 500', domain: 'spglobal.com' },
  '^DJI': { name: 'Dow Jones', domain: 'spglobal.com' },
  '^IXIC': { name: 'NASDAQ Composite', domain: 'nasdaq.com' },

  // Top India (NSE/BSE)
  'TATAPOWER.NS': { name: 'Tata Power Co Ltd', domain: 'tatapower.com' },
  'RELIANCE.NS': { name: 'Reliance Industries', domain: 'ril.com' },
  'TCS.NS': { name: 'Tata Consultancy Services', domain: 'tcs.com' },
  'INFY.NS': { name: 'Infosys Ltd', domain: 'infosys.com' },
  'HDFCBANK.NS': { name: 'HDFC Bank Ltd', domain: 'hdfcbank.com' },
  'ICICIBANK.NS': { name: 'ICICI Bank Ltd', domain: 'icicibank.com' },
  'WIPRO.NS': { name: 'Wipro Ltd', domain: 'wipro.com' },
  'KOTAKBANK.NS': { name: 'Kotak Mahindra Bank', domain: 'kotak.com' },
  'LT.NS': { name: 'Larsen & Toubro Ltd', domain: 'larsentoubro.com' },
  'SBIN.NS': { name: 'State Bank of India', domain: 'sbi.co.in' },
  'BHARTIARTL.NS': { name: 'Bharti Airtel Ltd', domain: 'airtel.in' },
  'ITC.NS': { name: 'ITC Limited', domain: 'itcportal.com' },
  'HINDUNILVR.NS': { name: 'Hindustan Unilever', domain: 'hul.co.in' },
  'AXISBANK.NS': { name: 'Axis Bank Ltd', domain: 'axisbank.com' },
  'BAJFINANCE.NS': { name: 'Bajaj Finance', domain: 'bajajfinserv.in' },
  'MARUTI.NS': { name: 'Maruti Suzuki', domain: 'marutisuzuki.com' },
  'HCLTECH.NS': { name: 'HCL Technologies', domain: 'hcltech.com' },
  'SUNPHARMA.NS': { name: 'Sun Pharma', domain: 'sunpharma.com' },
  'TITAN.NS': { name: 'Titan Company', domain: 'titan.co.in' },
  'ULTRACEMCO.NS': { name: 'UltraTech Cement', domain: 'ultratechcement.com' },
  'ASIANPAINT.NS': { name: 'Asian Paints', domain: 'asianpaints.com' },
  'M&M.NS': { name: 'Mahindra & Mahindra', domain: 'mahindra.com' },
  'TATAMOTORS.NS': { name: 'Tata Motors', domain: 'tatamotors.com' },
  'TATASTEEL.NS': { name: 'Tata Steel', domain: 'tatasteel.com' },
  'BAJAJFINSV.NS': { name: 'Bajaj Finserv', domain: 'bajajfinserv.in' },
  'POWERGRID.NS': { name: 'Power Grid Corp', domain: 'powergrid.in' },
  'NTPC.NS': { name: 'NTPC Limited', domain: 'ntpc.co.in' },
  '^NSEI': { name: 'Nifty 50', domain: 'nseindia.com' },
  '^BSESN': { name: 'BSE Sensex', domain: 'bseindia.com' },

  // Crypto
  'BTC-USD': { name: 'Bitcoin', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg' },
  'ETH-USD': { name: 'Ethereum', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' },
  'BNB-USD': { name: 'BNB', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg' },
  'SOL-USD': { name: 'Solana', icon: 'https://cryptologos.cc/logos/solana-sol-logo.svg' },
  'ADA-USD': { name: 'Cardano', icon: 'https://cryptologos.cc/logos/cardano-ada-logo.svg' },
  'XRP-USD': { name: 'XRP', icon: 'https://cryptologos.cc/logos/xrp-xrp-logo.svg' },
  'DOT-USD': { name: 'Polkadot', icon: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.svg' },
  'DOGE-USD': { name: 'Dogecoin', icon: 'https://cryptologos.cc/logos/dogecoin-doge-logo.svg' },

  // Forex
  'EURUSD=X': { name: 'EUR/USD', icon: 'https://flagcdn.com/w40/eu.png' },
  'GBPUSD=X': { name: 'GBP/USD', icon: 'https://flagcdn.com/w40/gb.png' },
  'USDJPY=X': { name: 'USD/JPY', icon: 'https://flagcdn.com/w40/us.png' },
  'AUDUSD=X': { name: 'AUD/USD', icon: 'https://flagcdn.com/w40/au.png' },
  'USDCAD=X': { name: 'USD/CAD', icon: 'https://flagcdn.com/w40/ca.png' },
  'USDCHF=X': { name: 'USD/CHF', icon: 'https://flagcdn.com/w40/ch.png' },
  
  // Commodities
  'GC=F': { name: 'Gold', icon: 'https://ui-avatars.com/api/?name=Gold&background=ffd700&color=fff' },
  'SI=F': { name: 'Silver', icon: 'https://ui-avatars.com/api/?name=Silver&background=c0c0c0&color=fff' },
  'CL=F': { name: 'Crude Oil', icon: 'https://ui-avatars.com/api/?name=Oil&background=000&color=fff' },
  'NG=F': { name: 'Natural Gas', icon: 'https://ui-avatars.com/api/?name=Gas&background=3b82f6&color=fff' },
  'ZW=F': { name: 'Wheat', icon: 'https://ui-avatars.com/api/?name=Wheat&background=d97706&color=fff' },
  'ZC=F': { name: 'Corn', icon: 'https://ui-avatars.com/api/?name=Corn&background=eab308&color=fff' },
  'ZS=F': { name: 'Soybean', icon: 'https://ui-avatars.com/api/?name=Soy&background=84cc16&color=fff' }
};

export function getFriendlyName(ticker) {
  if (!ticker) return 'Unknown';
  if (TICKER_DETAILS[ticker] && TICKER_DETAILS[ticker].name) return TICKER_DETAILS[ticker].name;
  return ticker;
}
