import re

files = [
    'src/pages/GlobalMarkets.jsx',
    'src/pages/Rankings.jsx',
    'src/components/Sidebar.jsx',
    'src/pages/PortfolioPage.jsx',
    'src/pages/PaperPortfolio.jsx'
]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        c = f.read()

    # Clean up the mangled imports
    # Remove any line that contains import AssetLogo
    new_lines = []
    has_asset_logo_import = False
    for line in c.splitlines():
        if 'import AssetLogo' in line:
            # We skip this line
            continue
        new_lines.append(line)

    c_clean = '\n'.join(new_lines)

    # Insert AssetLogo import right after the first `import React` or `import {`
    # We can just put it at the very top, but let's put it after the first line.
    
    import_stmt = "import AssetLogo from '../components/AssetLogo.jsx'"
    if 'Sidebar' in file:
        import_stmt = "import AssetLogo from './AssetLogo.jsx'"

    # insert at the top
    final_c = import_stmt + "\n" + c_clean

    with open(file, 'w', encoding='utf-8') as f:
        f.write(final_c)

print("Fixed imports")
