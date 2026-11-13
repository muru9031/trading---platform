import re

FILE_PATH = r"c:\Users\muruganandham\Desktop\projects\trading platform\frontend\src\pages\GlobalPortfolio.jsx"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove activeView state
content = content.replace("const [activeTab, setActiveTab] = useState('overview')\n  const [activeView, setActiveView] = useState('calendar')", "const [activeTab, setActiveTab] = useState('overview')")

# 2. Restore Tabs
old_tabs = "{['overview', 'monthly', 'calendar', 'detailed', 'history'].map(tab => ("
new_tabs = "{['overview', 'monthly', 'detailed', 'history'].map(tab => ("
content = content.replace(old_tabs, new_tabs)

old_tab_names = "{tab === 'overview' ? 'Overview' : tab === 'monthly' ? 'Monthly Analysis' : tab === 'calendar' ? 'Calendar Journal' : tab === 'detailed' ? 'Detailed Analysis' : 'Trade History'}"
new_tab_names = "{tab === 'overview' ? 'Overview' : tab === 'monthly' ? 'Monthly Analysis' : tab === 'detailed' ? 'Detailed Analysis' : 'Trade History'}"
content = content.replace(old_tab_names, new_tab_names)

# 3. Remove calendar block
calendar_block_match = re.search(r"(\{activeTab === 'calendar' && \(\s*<>\{activeView === 'calendar' \? \(\s*<div className=\"card p-6\">.*?\)\}</>\)} \{/\* End activeTab===calendar \*/\}\s*)", content, re.DOTALL)

if calendar_block_match:
    content = content.replace(calendar_block_match.group(1), "")
else:
    print("Could not find calendar block to remove.")

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("GlobalPortfolio.jsx reverted to pre-patch state.")
