import re
import os

def patch_file(filepath, pattern, replacement, import_stmt):
    if not os.path.exists(filepath):
        print(f"File {filepath} not found.")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        c = f.read()

    if 'import AssetLogo' not in c:
        # Find the last import
        imports = re.findall(r'^import .*$', c, flags=re.MULTILINE)
        if imports:
            last_import = imports[-1]
            c = c.replace(last_import, last_import + "\n" + import_stmt)
        else:
            c = import_stmt + "\n" + c

    if pattern in c:
        c = c.replace(pattern, replacement)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f"Patched {filepath}")
    else:
        # fuzzy match
        print(f"Could not find exact pattern in {filepath}. Attempting regex.")
        # fallback for specific files if needed
        pass

# 1. Sidebar.jsx (Watchlist)
sidebar_pattern = """<div className="font-semibold text-slate-200">{item.symbol}</div>"""
sidebar_repl = """<div className="flex items-center gap-2"><AssetLogo symbol={item.symbol} type={item.type || 'equity'} className="w-5 h-5" /><span className="font-semibold text-slate-200">{item.symbol}</span></div>"""
patch_file('src/components/Sidebar.jsx', sidebar_pattern, sidebar_repl, "import AssetLogo from './AssetLogo.jsx'")

# 2. GlobalMarkets.jsx
markets_pattern = """<td className="px-4 py-3 font-medium text-slate-200">{m.symbol}</td>"""
markets_repl = """<td className="px-4 py-3 font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <AssetLogo symbol={m.symbol} type={m.type || 'equity'} className="w-6 h-6" />
                        <span>{m.symbol}</span>
                      </div>
                    </td>"""
patch_file('src/pages/GlobalMarkets.jsx', markets_pattern, markets_repl, "import AssetLogo from '../components/AssetLogo.jsx'")

# 3. Rankings.jsx
rankings_pattern = """<span className="font-semibold text-slate-200 block">{s.symbol}</span>"""
rankings_repl = """<div className="flex items-center gap-2"><AssetLogo symbol={s.symbol} type="equity" className="w-6 h-6" /><span className="font-semibold text-slate-200 block">{s.symbol}</span></div>"""
patch_file('src/pages/Rankings.jsx', rankings_pattern, rankings_repl, "import AssetLogo from '../components/AssetLogo.jsx'")

# 4. PortfolioPage.jsx
port_pattern = """<div className="font-semibold text-slate-200">{pos.symbol}</div>"""
port_repl = """<div className="flex items-center gap-2"><AssetLogo symbol={pos.symbol} type="equity" className="w-6 h-6" /><div className="font-semibold text-slate-200">{pos.symbol}</div></div>"""
patch_file('src/pages/PortfolioPage.jsx', port_pattern, port_repl, "import AssetLogo from '../components/AssetLogo.jsx'")

# 5. PaperPortfolio.jsx
paper_pattern = """<div className="font-semibold text-slate-200">{pos.symbol}</div>"""
paper_repl = """<div className="flex items-center gap-2"><AssetLogo symbol={pos.symbol} type="equity" className="w-6 h-6" /><div className="font-semibold text-slate-200">{pos.symbol}</div></div>"""
patch_file('src/pages/PaperPortfolio.jsx', paper_pattern, paper_repl, "import AssetLogo from '../components/AssetLogo.jsx'")
