import re
import os

def patch_file(filepath, import_stmt, replacements):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        c = f.read()

    if import_stmt not in c:
        imports = re.findall(r'^import .*$', c, flags=re.MULTILINE)
        if imports:
            c = c.replace(imports[-1], imports[-1] + "\n" + import_stmt)
        else:
            c = import_stmt + "\n" + c

    for pattern, repl in replacements:
        c = c.replace(pattern, repl)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(c)

# 1. Rankings.jsx
# <td className="py-3 px-4">
#   <span className="font-mono font-bold text-teal-400 group-hover:text-teal-300">
#     {row.ticker.replace('.NS', '')}
#   </span>
# </td>
patch_file('src/pages/Rankings.jsx', "import AssetLogo from '../components/AssetLogo.jsx'", [
    (
        """<span className="font-mono font-bold text-teal-400 group-hover:text-teal-300">\n                      {row.ticker.replace('.NS', '')}\n                    </span>""",
        """<div className="flex items-center gap-2">\n                      <AssetLogo symbol={row.ticker} type={row.sector === 'Major' || row.sector === 'Emerging' || row.sector === 'Cross' ? 'forex' : row.sector === 'Layer 1' || row.sector === 'Exchange' || row.sector === 'Oracle' || row.sector === 'Meme' || row.sector === 'Payments' || row.sector === 'Layer 0' ? 'crypto' : 'equity'} className="w-5 h-5" />\n                      <span className="font-mono font-bold text-teal-400 group-hover:text-teal-300">\n                        {row.ticker.replace('.NS', '')}\n                      </span>\n                    </div>"""
    )
])

# 2. PaperPortfolio.jsx
patch_file('src/pages/PaperPortfolio.jsx', "import AssetLogo from '../components/AssetLogo.jsx'", [
    (
        """<span className="font-mono font-bold text-slate-200 text-[11px]">{o.ticker}</span>""",
        """<div className="flex items-center gap-1.5"><AssetLogo symbol={o.ticker} className="w-4 h-4" /><span className="font-mono font-bold text-slate-200 text-[11px]">{o.ticker}</span></div>"""
    ),
    (
        """<td className="py-3 px-4 whitespace-nowrap font-medium text-slate-200">{o.ticker}</td>""",
        """<td className="py-3 px-4 whitespace-nowrap font-medium text-slate-200"><div className="flex items-center gap-1.5"><AssetLogo symbol={o.ticker} className="w-5 h-5" />{o.ticker}</div></td>"""
    )
])
