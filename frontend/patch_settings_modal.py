import re

file_path = "src/components/TradingChart.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = """<SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                selectedDrawing={selDrawing}
                onSave={updateDrawing}
              />"""

replacement = """<SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                selectedDrawing={selDrawing}
                onSave={updateDrawing}
                onUpdate={updateDrawing}
              />"""

if target in content:
    content = content.replace(target, replacement)
else:
    # Try Regex
    content = re.sub(r'<SettingsModal[^>]*onSave=\{updateDrawing\}[^>]*/>', replacement, content, flags=re.MULTILINE|re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
