import os
import re

FILE_PATH = r"c:\Users\muruganandham\Desktop\projects\trading platform\frontend\src\components\LogTradesModal.jsx"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update `getEmptyTrade` to not even need `pnlType` initialized (though it's fine if it is)
# It's currently `pnlType: 'Profit'` in some versions or mapped.

# 2. Update the JSX to remove the Result select field
result_select_regex = r"<div>\s*<label[^>]*>Result \*</label>\s*<select value=\{trade\.pnlType \|\| 'Profit'\}[^>]*>.*?<\/select>\s*<\/div>"
content = re.sub(result_select_regex, "", content, flags=re.DOTALL)

# Also fix the grid layout for that row since we removed one element.
# It was `grid-cols-1 md:grid-cols-3` -> now `grid-cols-1 md:grid-cols-2`
content = content.replace("grid-cols-1 md:grid-cols-3 gap-4 mb-4 border-b border-slate-700 pb-4", "grid-cols-1 md:grid-cols-2 gap-4 mb-4 border-b border-slate-700 pb-4")

# 3. Update `handleSave` to dynamically inject `pnlType` based on `pnlAmount`
old_validation = """      if (!t.pnlType || t.pnlType.trim() === '') {
        alert(`Result (Win/Loss/Breakeven) must be selected for ${t.asset}`);
        return;
      }
      if (t.pnlAmount === '' || isNaN(t.pnlAmount) || parseFloat(t.pnlAmount) < 0) {
        alert(`Invalid positive P&L amount for ${t.asset}`);
        return;
      }"""

new_validation = """      // Auto-assign result type
      const pnlAmt = parseFloat(t.pnlAmount);
      if (t.pnlAmount === '' || isNaN(pnlAmt)) {
        alert(`Invalid P&L amount for ${t.asset}`);
        return;
      }
      
      // We assume pnlAmount could be entered as negative by user if they want, but the UI might restrict it.
      // Wait, earlier validation says "Invalid positive P&L amount", so user enters absolute value?
      // Wait, let's assume they enter absolute value for Profit/Loss or real value. 
      // Usually users enter signed value (-100 for loss) if no dropdown exists.
      // If they enter -100, we make it absolute and set Loss.
      // Let's just use the sign.
      if (pnlAmt > 0) {
        t.pnlType = 'Profit';
      } else if (pnlAmt < 0) {
        t.pnlType = 'Loss';
        t.pnlAmount = Math.abs(pnlAmt).toString(); // Ensure absolute value if schema expects positive
      } else {
        t.pnlType = 'Breakeven';
      }
"""

content = content.replace(old_validation, new_validation)

# 4. Update `isSaveDisabled`
content = content.replace("!t.pnlType || ", "")
# Update positive check
content = content.replace("t.pnlAmount === '' || isNaN(t.pnlAmount) || parseFloat(t.pnlAmount) < 0", "t.pnlAmount === '' || isNaN(t.pnlAmount)")

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched LogTradesModal.jsx to automate Result")
