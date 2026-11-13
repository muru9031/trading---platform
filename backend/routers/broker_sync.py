from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import List
from utils.symbol_mapper import normalize_broker_symbol, map_to_internal_asset

router = APIRouter()

class BrokerTradePayload(BaseModel):
    symbol: str
    pnl: float

class BrokerSyncPayload(BaseModel):
    broker: str
    trades: List[BrokerTradePayload]

@router.post("/dummy")
async def dummy_broker_sync(payload: BrokerSyncPayload, request: Request):
    """
    Placeholder endpoint to simulate receiving a webhook/sync payload from a broker.
    Demonstrates the symbol normalization engine mapping external noise to internal assets.
    """
    # Access the shared in-memory instruments loaded at startup
    instruments_list = request.app.state.instruments
    
    results = []
    
    for trade in payload.trades:
        # 1. Normalize the raw symbol from the broker
        normalized = normalize_broker_symbol(trade.symbol, payload.broker)
        
        # 2. Map to our official internal asset structure
        mapped_asset = map_to_internal_asset(normalized, instruments_list)
        
        if mapped_asset:
            print(f"[SUCCESS] Broker sent '{trade.symbol}' -> Normalized to '{normalized}' -> Mapped to Internal: {mapped_asset['symbol']}")
            results.append({
                "raw": trade.symbol,
                "normalized": normalized,
                "mapped_internal_symbol": mapped_asset['symbol'],
                "status": "SUCCESS"
            })
        else:
            print(f"[FAILED] Broker sent '{trade.symbol}' -> Normalized to '{normalized}' -> NO INTERNAL MATCH FOUND")
            results.append({
                "raw": trade.symbol,
                "normalized": normalized,
                "status": "FAILED"
            })
            
    return {
        "message": "Broker sync processed",
        "broker": payload.broker,
        "results": results
    }
