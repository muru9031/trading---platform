import re

def normalize_broker_symbol(raw_symbol: str, broker: str = None) -> str:
    """
    Strips out common broker-specific noise from asset symbols to normalize them.
    Examples: 
      - "HDFCBANK-EQ" -> "HDFCBANK"
      - "RELIANCE.NS" -> "RELIANCE"
      - "BTC-USDT" -> "BTCUSDT"
      - "TCS_EQ" -> "TCS"
    """
    if not raw_symbol:
        return ""
        
    normalized = raw_symbol.upper().strip()
    
    # Remove common suffixes
    suffixes_to_remove = [
        r'-EQ$', r'_EQ$', r'\.NS$', r'\.BO$', r'-FUT$', r'_FUT$'
    ]
    
    for pattern in suffixes_to_remove:
        normalized = re.sub(pattern, '', normalized)
        
    # Remove spaces and special hyphens
    normalized = normalized.replace(' ', '').replace('-', '')
    
    return normalized


def map_to_internal_asset(normalized_symbol: str, instruments_list: list) -> dict:
    """
    Attempts to map a normalized symbol to our internal structured asset object.
    Uses exact match first, then fallback to fuzzy/substring matching.
    """
    # 1. Exact Match on fetch_symbol or symbol
    for asset in instruments_list:
        if asset.get('fetch_symbol') == normalized_symbol or asset.get('symbol') == normalized_symbol:
            return asset
            
    # 2. Exact match after stripping our own suffix (e.g. if internal is HDFCBANK.NS and broker sent HDFCBANK)
    for asset in instruments_list:
        internal_symbol = asset.get('fetch_symbol', '').split('.')[0]
        if internal_symbol == normalized_symbol:
            return asset
            
    # 3. Substring match fallback (e.g. internal is "HDFC BANK" and broker is "HDFCBANK")
    for asset in instruments_list:
        name_no_spaces = asset.get('name', '').replace(' ', '').upper()
        if normalized_symbol in name_no_spaces or name_no_spaces in normalized_symbol:
            return asset
            
    # No match found
    return None
