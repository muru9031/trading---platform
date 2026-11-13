import requests
import csv
import json
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'instruments.json')

def fetch_assets():
    assets = []
    
    print("Fetching Zerodha Kite Instruments (NSE & MCX)...")
    try:
        res = requests.get('https://api.kite.trade/instruments')
        res.raise_for_status()
        csv_data = res.text.splitlines()
        reader = csv.DictReader(csv_data)
        
        nse_count = 0
        mcx_count = 0
        
        for row in reader:
            segment = row.get('segment')
            inst_type = row.get('instrument_type')
            
            # TASK 3: Indian Equity
            if segment == 'NSE' and inst_type == 'EQ':
                # Skip SME/Bonds which often have dashes or different series
                symbol = row['tradingsymbol']
                if '-' in symbol and len(symbol.split('-')[-1]) == 2:
                    continue
                name_val = row['name'] if row['name'] else symbol
                assets.append({
                    "symbol": name_val if name_val != symbol else symbol, # Clean UI string
                    "name": name_val,
                    "fetch_symbol": f"{symbol}.NS",
                    "exchange": "NSE",
                    "type": "EQUITY",
                    "region": "IN",
                    "category": "indian"
                })
                nse_count += 1
                
            # TASK 3: Commodities (MCX)
            elif row.get('exchange') == 'MCX' and inst_type == 'FUT':
                name_val = row['name'] # e.g. CRUDEOIL
                trading_symbol = row['tradingsymbol']
                assets.append({
                    "symbol": name_val,
                    "name": trading_symbol,
                    "fetch_symbol": trading_symbol,
                    "exchange": "MCX",
                    "type": "COMMODITY",
                    "region": "IN",
                    "category": "commodity"
                })
                mcx_count += 1
                
        print(f"Added {nse_count} NSE Equities and {mcx_count} MCX Commodities.")
    except Exception as e:
        print(f"Error fetching Kite data: {e}")

    print("Fetching Full US Market (SEC EDGAR)...")
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        res = requests.get('https://www.sec.gov/files/company_tickers.json', headers=headers)
        res.raise_for_status()
        sec_data = res.json()
        
        us_count = 0
        for item in sec_data.values():
            ticker = item['ticker']
            title = item['title']
            assets.append({
                "symbol": ticker,
                "name": title,
                "fetch_symbol": ticker,
                "exchange": "NYSE/NASDAQ",
                "type": "EQUITY_US",
                "region": "US",
                "category": "us"
            })
            us_count += 1
        print(f"Added {us_count} US Equities from SEC.")
    except Exception as e:
        print(f"Error fetching SEC data: {e}")

    print("Fetching Binance Active Trading Pairs...")
    try:
        res = requests.get('https://api.binance.com/api/v3/exchangeInfo')
        res.raise_for_status()
        data = res.json()
        
        crypto_count = 0
        for item in data.get('symbols', []):
            if item.get('status') == 'TRADING' and item.get('quoteAsset') == 'USDT':
                base = item['baseAsset']
                assets.append({
                    "symbol": f"{base}/USDT",
                    "name": f"{base} Crypto",
                    "fetch_symbol": f"{base}-USD",
                    "exchange": "BINANCE",
                    "type": "CRYPTO",
                    "region": "CRYPTO",
                    "category": "crypto"
                })
                crypto_count += 1
        print(f"Added {crypto_count} Crypto Pairs.")
    except Exception as e:
        print(f"Error fetching Binance data: {e}")

    print("Adding Major Forex Pairs...")
    forex_pairs = [
        "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD", 
        "EURGBP", "EURJPY", "GBPJPY", "AUDJPY", "EURCHF", "GBPCHF", "AUDCAD",
        "CADJPY", "NZDJPY", "EURAUD", "GBPAUD", "EURNZD", "GBPNZD", "AUDNZD",
        "AUDCHF", "NZDCHF", "CADCHF", "USDCNH", "USDMXN", "USDZAR", "USDTRY",
        "USDSEK", "USDNOK"
    ]
    for pair in forex_pairs:
        base, quote = pair[:3], pair[3:]
        assets.append({
            "symbol": f"{base}/{quote}",
            "name": f"{base} to {quote}",
            "fetch_symbol": f"{pair}=X",
            "exchange": "GLOBAL",
            "type": "FOREX",
            "region": "FX",
            "category": "forex"
        })
    print(f"Added {len(forex_pairs)} Forex Pairs.")

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(assets, f)
        
    print(f"\nSuccessfully saved {len(assets)} assets to {OUTPUT_FILE}")

if __name__ == '__main__':
    fetch_assets()
