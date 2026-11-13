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

# 1. Rankings.jsx
rn_old = """                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-teal-400 group-hover:text-teal-300">
                      {row.ticker.replace('.NS', '')}
                    </span>
                  </td>"""
rn_new = """                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <AssetLogo symbol={row.ticker} className="w-5 h-5" />
                      <span className="font-mono font-bold text-teal-400 group-hover:text-teal-300">
                        {row.ticker.replace('.NS', '')}
                      </span>
                    </div>
                  </td>"""
patch_file('src/pages/Rankings.jsx', rn_old, rn_new, "import AssetLogo from '../components/AssetLogo.jsx'")

# 2. PortfolioPage.jsx
port_old = """                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">{pos.ticker}</div>
                      <div className="text-[10px] text-slate-500">{pos.name}</div>
                    </div>"""
port_new = """                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AssetLogo symbol={pos.ticker} className="w-6 h-6" />
                      <div>
                        <div className="font-semibold text-slate-200">{pos.ticker}</div>
                        <div className="text-[10px] text-slate-500">{pos.name}</div>
                      </div>
                    </div>"""
patch_file('src/pages/PortfolioPage.jsx', port_old, port_new, "import AssetLogo from '../components/AssetLogo.jsx'")

# 3. PaperPortfolio.jsx
paper_old = """                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">{pos.ticker}</div>
                      <div className="text-[10px] text-slate-500">{pos.name}</div>
                    </div>"""
paper_new = """                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AssetLogo symbol={pos.ticker} className="w-6 h-6" />
                      <div>
                        <div className="font-semibold text-slate-200">{pos.ticker}</div>
                        <div className="text-[10px] text-slate-500">{pos.name}</div>
                      </div>
                    </div>"""
patch_file('src/pages/PaperPortfolio.jsx', paper_old, paper_new, "import AssetLogo from '../components/AssetLogo.jsx'")
