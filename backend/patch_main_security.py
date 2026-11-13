import re
import os

MAIN_PY = r"c:\Users\muruganandham\Desktop\projects\trading platform\backend\main.py"

with open(MAIN_PY, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add slowapi and Request imports
if "from slowapi import Limiter, _rate_limit_exceeded_handler" not in code:
    code = code.replace(
        "from fastapi import FastAPI, HTTPException",
        "from fastapi import FastAPI, HTTPException, Request\nfrom fastapi.responses import JSONResponse\nfrom slowapi import Limiter, _rate_limit_exceeded_handler\nfrom slowapi.util import get_remote_address\nfrom slowapi.errors import RateLimitExceeded\nimport logging\n\nlogger = logging.getLogger(__name__)\n"
    )

# 2. Add Limiter init and Global Exception Handlers
if "limiter = Limiter(key_func=get_remote_address)" not in code:
    init_block = """
app = FastAPI(title="DemoTrade API", version="2.0.0")

# ─── SECURITY & CRASH PREVENTION ──────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Internal Server Error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error: Service temporarily unavailable"}
    )
"""
    code = code.replace('app = FastAPI(title="DemoTrade API", version="2.0.0")', init_block.strip())

# 3. Patch all endpoints to include @limiter and request: Request
def patch_endpoint(match):
    full_match = match.group(0)
    decorator = match.group(1) # @app.get(...)
    def_line = match.group(2) # async def my_func(...)
    
    if "@limiter.limit" in full_match:
        return full_match
    
    # Inject request: Request into the def args
    if "(" in def_line:
        if "(request: Request" not in def_line and "(request:Request" not in def_line:
            def_line = def_line.replace("(", "(request: Request, ", 1)
            def_line = def_line.replace(", )", ")") # cleanup if empty args
    
    return f"{decorator}\n@limiter.limit('100/minute')\n{def_line}"

# Matches decorators and def lines like:
# @app.get("/something")
# async def some_func(ticker: str):
pattern = re.compile(r'(@app\.(?:get|post)\(.*?\))\n(async def [a-zA-Z0-9_]+\(.*?\):)', re.MULTILINE)
code = pattern.sub(patch_endpoint, code)

with open(MAIN_PY, "w", encoding="utf-8") as f:
    f.write(code)

print("Patched main.py successfully with SlowAPI and Global Exception Handler")
