import codecs

with codecs.open('src/components/TradingChart.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "if (activeToolRef.current !== 'sketch') return;\n                    e.stopPropagation();"
replacement = "if (activeToolRef.current !== 'sketch') return;\n                    e.stopPropagation();\n                    e.preventDefault();"

if target in content:
    content = content.replace(target, replacement)
    with codecs.open('src/components/TradingChart.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed sketch preventDefault successfully.")
else:
    print("Target string not found in TradingChart.jsx")
