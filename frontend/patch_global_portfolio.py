import re
import sys

FILE_PATH = r"c:\Users\muruganandham\Desktop\projects\trading platform\frontend\src\pages\GlobalPortfolio.jsx"
PORTFOLIO_DASHBOARD_PATH = r"c:\Users\muruganandham\Desktop\projects\trading platform\frontend\src\components\PortfolioDashboard.jsx"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add activeView state
if "const [activeView, setActiveView]" not in content:
    content = content.replace(
        "const [activeTab, setActiveTab] = useState('overview')",
        "const [activeTab, setActiveTab] = useState('overview')\n  const [activeView, setActiveView] = useState('calendar')"
    )

# 2. Update Tabs
old_tabs = "{['overview', 'monthly', 'detailed', 'history'].map(tab => ("
new_tabs = "{['overview', 'monthly', 'calendar', 'detailed', 'history'].map(tab => ("
content = content.replace(old_tabs, new_tabs)

old_tab_names = "{tab === 'overview' ? 'Overview' : tab === 'monthly' ? 'Monthly Analysis' : tab === 'detailed' ? 'Detailed Analysis' : 'Trade History'}"
new_tab_names = "{tab === 'overview' ? 'Overview' : tab === 'monthly' ? 'Monthly Analysis' : tab === 'calendar' ? 'Calendar Journal' : tab === 'detailed' ? 'Detailed Analysis' : 'Trade History'}"
content = content.replace(old_tab_names, new_tab_names)

# 3. Read calendar logic from PortfolioDashboard.jsx
with open(PORTFOLIO_DASHBOARD_PATH, 'r', encoding='utf-8') as f:
    pd_content = f.read()

calendar_block_match = re.search(r"(\{activeTab === 'calendar' && \(\s*<>\{activeView === 'calendar' \? \(\s*<div className=\"card p-6\">.*?)\{/\* End activeTab===calendar \*/\}", pd_content, re.DOTALL)

if calendar_block_match:
    calendar_block = calendar_block_match.group(1) + "{/* End activeTab===calendar */}\n"
    # we need to inject this calendar block after Monthly Analysis
    injection_marker = "{activeTab === 'monthly' && (\n          <div className=\"mt-4\">\n            <MonthlyAnalysisTab trades={dashboardTrades} sym={sym} monthlyDeposits={monthlyDeposits} />\n          </div>\n        )}\n"
    
    if injection_marker in content:
        content = content.replace(injection_marker, injection_marker + "\n        " + calendar_block + "\n")
    else:
        print("Could not find injection marker")
else:
    print("Could not extract calendar block from PortfolioDashboard.jsx")

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Calendar restored in GlobalPortfolio.jsx")
