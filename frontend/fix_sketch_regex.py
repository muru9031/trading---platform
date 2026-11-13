import codecs
import re

with codecs.open('src/components/TradingChart.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r"if\s*\(activeToolRef\.current\s*!==\s*'sketch'\)\s*return;\s*e\.stopPropagation\(\);")
replacement = "if (activeToolRef.current !== 'sketch') return;\n                    e.stopPropagation();\n                    e.preventDefault();"

if pattern.search(content):
    content = pattern.sub(replacement, content, count=1)
    with codecs.open('src/components/TradingChart.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed sketch preventDefault with regex!")
else:
    print("Regex match not found in TradingChart.jsx")
