const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/PaperTrading.jsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /export default function PaperTradeConsole\(\{ activeTicker, livePrice, onClose \}\) \{/,
  'export default function PaperTradeConsole({ activeTicker, livePrice, marketOpen, onClose }) {'
);

content = content.replace(
  /const \[tp, setTp\]               = useState\(''\)/,
  `const [tp, setTp]               = useState('')
  const [toast, setToast]           = useState(null)`
);

content = content.replace(
  /addOrder\(order\)\n    if \(onClose\) onClose\(\)/,
  `addOrder(order)
    setToast('Order Placed Successfully!')
    setTimeout(() => {
      setToast(null)
      if (onClose) onClose()
    }, 2000)`
);

content = content.replace(
  /disabled=\{entryPrice <= 0 \|\| \(orderType === 'BUY' && \(totalCost \+ previewBrokerage\) > capital\)\}/,
  "disabled={entryPrice <= 0 || !marketOpen || (orderType === 'BUY' && (totalCost + previewBrokerage) > capital)}"
);

content = content.replace(
  /\{orderType === 'BUY' \? '▲ CONFIRM BUY' : '▼ CONFIRM SELL'\} × \{qty\}/,
  `{toast ? <span className="text-white font-black animate-pulse">{toast}</span> : !marketOpen ? 'MARKET CLOSED' : (orderType === 'BUY' ? '▲ CONFIRM BUY' : '▼ CONFIRM SELL') + ' × ' + qty}`
);

fs.writeFileSync(file, content);
console.log('Fixed PaperTrading');
