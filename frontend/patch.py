import sys
import re

content = open('src/components/TradingChart.jsx', 'r', encoding='utf-8').read()

target1 = """              {LEVELS.map(l => {
                const y = p1.y + diffY * l.v
                const pr = p1.price + diffP * l.v
                return (
                  <g key={l.v}>
                    <line x1={sx} y1={y} x2={W} y2={y} stroke={l.c} strokeWidth={wid}/>
                    <text x={W - 10} y={y - 4} fill={l.c} fontSize="11" textAnchor="end" fontWeight="bold">
                      {(l.v * 100).toFixed(1)}% ({pr.toFixed(5)})
                    </text>
                  </g>
                )
              })}
            </g>
          )"""

replacement1 = """              {LEVELS.map(l => {
                const y = p1.y + diffY * l.v
                const pr = p1.price + diffP * l.v
                return (
                  <g key={l.v}>
                    <line x1={sx} y1={y} x2={W} y2={y} stroke={l.c} strokeWidth={wid}/>
                    <text x={W - 10} y={y - 4} fill={l.c} fontSize="11" textAnchor="end" fontWeight="bold">
                      {(l.v * 100).toFixed(1)}% ({pr.toFixed(5)})
                    </text>
                  </g>
                )
              })}
              <rect x={W-55} y={p1.y-10} width={55} height={20} fill={col} rx="2"/>
              <text x={W-27.5} y={p1.y+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
                {(p1.price||0).toFixed(2)}
              </text>
              <rect x={W-55} y={p2.y-10} width={55} height={20} fill={col} rx="2"/>
              <text x={W-27.5} y={p2.y+4} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">
                {(p2.price||0).toFixed(2)}
              </text>
            </g>
          )"""

target2 = """              {LEVELS.map(l => {
                const y = p3.y + diffY * l.v
                const pr = p3.price + diffP * l.v
                return (
                  <g key={l.v}>
                    <line x1={sx} y1={y} x2={W} y2={y} stroke={l.c} strokeWidth={wid}/>
                    <text x={W - 10} y={y - 4} fill={l.c} fontSize="11" textAnchor="end" fontWeight="bold">
                      {(l.v * 100).toFixed(1)}% ({pr.toFixed(5)})
                    </text>
                  </g>
                )
              })}
            </g>
          )"""

replacement2 = """              {LEVELS.map(l => {
                const y = p3.y + diffY * l.v
                const pr = p3.price + diffP * l.v
                return (
                  <g key={l.v}>
                    <line x1={sx} y1={y} x2={W} y2={y} stroke={l.c} strokeWidth={wid}/>
                    <text x={W - 10} y={y - 4} fill={l.c} fontSize="11" textAnchor="end" fontWeight="bold">
                      {(l.v * 100).toFixed(1)}% ({pr.toFixed(5)})
                    </text>
                  </g>
                )
              })}
              <rect x={W-55} y={p1.y-10} width={55} height={20} fill={col} rx="2"/>
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


c = content.replace(target1, replacement1)
c = c.replace(target2, replacement2)

if c != content:
    open('src/components/TradingChart.jsx', 'w', encoding='utf-8').write(c)
    print("Replaced!")
else:
    print("Targets not found!")
