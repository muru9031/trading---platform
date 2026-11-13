import re
import os

def apply_regex(filepath, pattern, repl, import_stmt):
    if not os.path.exists(filepath):
        print(f"File {filepath} not found.")
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        c = f.read()

    if import_stmt not in c:
        imports = re.findall(r'^import .*$', c, flags=re.MULTILINE)
        if imports:
            c = c.replace(imports[-1], imports[-1] + "\n" + import_stmt)
        else:
            c = import_stmt + "\n" + c

    new_c, count = re.subn(pattern, repl, c)
    if count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_c)
        print(f"Regex patched {filepath} {count} times.")
    else:
        print(f"Regex failed for {filepath}")

# 1. Sidebar.jsx
# <div className="font-semibold text-slate-200">{item.symbol}</div>
# or similar
apply_regex(
    'src/components/Sidebar.jsx',
    r'<div className="font-semibold text-slate-200">(.*?)</div>',
    r'<div className="flex items-center gap-2"><AssetLogo symbol={\1} type="equity" className="w-5 h-5" /><span className="font-semibold text-slate-200">\1</span></div>',
    "import AssetLogo from './AssetLogo.jsx'"
)

# 2. GlobalMarkets.jsx
# <td className="px-4 py-3 font-medium text-slate-200">{m.symbol}</td>
apply_regex(
    'src/pages/GlobalMarkets.jsx',
    r'<td className="px-4 py-3 font-medium text-slate-200">\s*\{m\.symbol\}\s*</td>',
    r'<td className="px-4 py-3 font-medium text-slate-200"><div className="flex items-center gap-2"><AssetLogo symbol={m.symbol} type={m.type || "equity"} className="w-6 h-6" /><span>{m.symbol}</span></div></td>',
    "import AssetLogo from '../components/AssetLogo.jsx'"
)

# 3. Rankings.jsx
# <span className="font-semibold text-slate-200 block">{s.symbol}</span>
apply_regex(
    'src/pages/Rankings.jsx',
    r'<span className="font-semibold text-slate-200 block">\{s\.symbol\}</span>',
    r'<div className="flex items-center gap-2"><AssetLogo symbol={s.symbol} type="equity" className="w-6 h-6" /><span className="font-semibold text-slate-200 block">{s.symbol}</span></div>',
    "import AssetLogo from '../components/AssetLogo.jsx'"
)

# 4. PortfolioPage.jsx & PaperPortfolio.jsx
# <div className="font-semibold text-slate-200">{pos.symbol}</div>
apply_regex(
    'src/pages/PortfolioPage.jsx',
    r'<div className="font-semibold text-slate-200">\{pos\.symbol\}</div>',
    r'<div className="flex items-center gap-2"><AssetLogo symbol={pos.symbol} type="equity" className="w-6 h-6" /><div className="font-semibold text-slate-200">{pos.symbol}</div></div>',
    "import AssetLogo from '../components/AssetLogo.jsx'"
)
apply_regex(
    'src/pages/PaperPortfolio.jsx',
    r'<div className="font-semibold text-slate-200">\{pos\.symbol\}</div>',
    r'<div className="flex items-center gap-2"><AssetLogo symbol={pos.symbol} type="equity" className="w-6 h-6" /><div className="font-semibold text-slate-200">{pos.symbol}</div></div>',
    "import AssetLogo from '../components/AssetLogo.jsx'"
)
