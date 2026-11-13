import re

content = open('src/components/TradingChart.jsx', 'r', encoding='utf-8').read()

target = """        <div className="flex flex-col flex-1 min-w-0 relative">
  
          {selDrawing && toolbarPixelPos && (
            <FloatingToolbar
              drawing={selDrawing}
              onUpdate={(u) => updateDrawing(selectedId, u)}
              onDelete={() => deleteDrawing(selectedId)}
              onClose={() => setSelectedId(null)}
              initialPos={toolbarPixelPos}
            />
          )}"""

replacement = """        <div className="flex flex-col flex-1 min-w-0 relative">
  
          {selDrawing && toolbarPixelPos && (
            <>
              <FloatingToolbar
                drawing={selDrawing}
                onUpdate={(u) => updateDrawing(selectedId, u)}
                onDelete={() => deleteDrawing(selectedId)}
                onClose={() => setSelectedId(null)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                initialPos={toolbarPixelPos}
              />
              <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                selectedDrawing={selDrawing}
                onSave={updateDrawing}
              />
            </>
          )}"""

c = content.replace(target, replacement)
if c != content:
    open('src/components/TradingChart.jsx', 'w', encoding='utf-8').write(c)
    print("Replaced!")
else:
    print("Not found! Let's try regex.")
    c = re.sub(r'<FloatingToolbar([^>]*?)initialPos=\{toolbarPixelPos\}\s*/>', r'<FloatingToolbar\1onOpenSettings={() => setIsSettingsModalOpen(true)}\n              initialPos={toolbarPixelPos}\n            />\n            <SettingsModal\n              isOpen={isSettingsModalOpen}\n              onClose={() => setIsSettingsModalOpen(false)}\n              selectedDrawing={selDrawing}\n              onSave={updateDrawing}\n            />', content)
    if c != content:
        open('src/components/TradingChart.jsx', 'w', encoding='utf-8').write(c)
        print("Replaced with regex!")
    else:
        print("Regex not found!")
