import re
import os

def patch_file(filepath, pattern, replacement, import_stmt):
    if not os.path.exists(filepath):
        print(f"File {filepath} not found.")
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        c = f.read()

    if 'import AssetLogo' not in c:
        imports = re.findall(r'^import .*$', c, flags=re.MULTILINE)
        if imports:
            c = c.replace(imports[-1], imports[-1] + "\n" + import_stmt)
        else:
            c = import_stmt + "\n" + c

    if pattern in c:
        c = c.replace(pattern, replacement)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f"Patched {filepath}")
    else:
        print(f"Failed to patch {filepath}: Pattern not found")

# 1. GlobalMarkets.jsx
gm_old = """                    <div>
                      <p className="font-mono font-bold text-sm text-teal-400 group-hover:text-teal-300">
                        {a.ticker.replace(/\.(NS|BO)$/, '')}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{a.name}</p>
                    </div>"""
gm_new = """                    <div className="flex items-center gap-2">
                      <AssetLogo symbol={a.ticker} type={a.category === 'Crypto' ? 'crypto' : a.category === 'Forex' ? 'forex' : 'equity'} className="w-8 h-8" />
                      <div>
                        <p className="font-mono font-bold text-sm text-teal-400 group-hover:text-teal-300">
                          {a.ticker.replace(/\.(NS|BO)$/, '')}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{a.name}</p>
                      </div>
                    </div>"""
patch_file('src/pages/GlobalMarkets.jsx', gm_old, gm_new, "import AssetLogo from '../components/AssetLogo.jsx'")

# 2. Sidebar.jsx
sb_old = """          <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-teal-500/20' : 'bg-slate-700'}`}>
          </div>
          <div className="min-w-0">"""
sb_new = """          <AssetLogo symbol={item.ticker} type={item.region === 'CRYPTO' ? 'crypto' : item.region === 'FX' ? 'forex' : 'equity'} className="w-6 h-6 flex-shrink-0" />
          <div className="min-w-0">"""
patch_file('src/components/Sidebar.jsx', sb_old, sb_new, "import AssetLogo from './AssetLogo.jsx'")

