import sys
import re

content = open('src/components/TradingChart.jsx', 'r', encoding='utf-8').read()

def inject_y_axis(match):
    suffix = match.group(1)
    if "fib_ext" in match.string[:match.start()][-500:]:
        return suffix + """              <rect x={W-55} y={p1.y-10} width={55} height={20} fill={col} rx="2"/>
              <text x={W-27.5} y={p1.y+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
                {(p1.price||0).toFixed(2)}
              </text>
              <rect x={W-55} y={p2.y-10} width={55} height={20} fill={col} rx="2"/>
              <text x={W-27.5} y={p2.y+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
                {(p2.price||0).toFixed(2)}
              </text>
              <rect x={W-55} y={p3.y-10} width={55} height={20} fill={col} rx="2"/>
              <text x={W-27.5} y={p3.y+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
                {(p3.price||0).toFixed(2)}
              </text>
            </g>
          )"""
    else:
        return suffix + """              <rect x={W-55} y={p1.y-10} width={55} height={20} fill={col} rx="2"/>
              <text x={W-27.5} y={p1.y+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
                {(p1.price||0).toFixed(2)}
              </text>
              <rect x={W-55} y={p2.y-10} width={55} height={20} fill={col} rx="2"/>
              <text x={W-27.5} y={p2.y+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
                {(p2.price||0).toFixed(2)}
              </text>
            </g>
          )"""

pattern = re.compile(r'(\s*\)\s*\}\)\s*)\<\/g\>\s*\)\s*(?=\s*handles =|\s*break)', re.MULTILINE)
c = pattern.sub(inject_y_axis, content)

if c != content:
    open('src/components/TradingChart.jsx', 'w', encoding='utf-8').write(c)
    print("Replaced!")
else:
    print("Targets not found!")
