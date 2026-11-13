import os
import re

FILE_PATH = r"c:\Users\muruganandham\Desktop\projects\trading platform\frontend\src\components\LogTradesModal.jsx"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

old_use_effect = """
  useEffect(() => {
    if (isOpen) {
      if (dayTrades && dayTrades.length > 0) {
        setTrades(JSON.parse(JSON.stringify(dayTrades)));
      } else {
        setTrades([getEmptyTrade()]);
      }
    }
  }, [isOpen, dayTrades]);
"""

new_use_effect = """
  useEffect(() => {
    if (isOpen) {
      if (dayTrades && dayTrades.length > 0) {
        const safeTrades = JSON.parse(JSON.stringify(dayTrades)).map(t => ({
          ...t,
          side: t.side || 'Buy',
          pnlType: t.pnlType || 'Profit',
          source: t.source || ''
        }));
        setTrades(safeTrades);
      } else {
        setTrades([getEmptyTrade()]);
      }
    }
  }, [isOpen, dayTrades]);
"""

content = content.replace(old_use_effect.strip(), new_use_effect.strip())

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched LogTradesModal.jsx useEffect successfully")
