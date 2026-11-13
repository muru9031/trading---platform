import codecs

with codecs.open('src/pages/PortfolioPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """        if (isAllTab) {
          if (allTabCurrency === 'INR' && tSym === '$') pnl *= liveUsdInr
          if (allTabCurrency === 'USD' && tSym === '?') pnl /= liveUsdInr
        }
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">"""

replacement = """        if (isAllTab) {
          if (allTabCurrency === 'INR' && tSym === '$') pnl *= liveUsdInr
          if (allTabCurrency === 'USD' && tSym === '?') pnl /= liveUsdInr
        }
        allTrades.push({ ...t, pnl, timestamp: d.toISOString() })
      })
    })
    return allTrades
  }, [journalEntries, category, isAllTab, allTabCurrency, liveUsdInr])

  // -- Modals ---------------------------------------------------------------
  const handleDayClick = (day) => {
    setSelectedDay(day)
    setDayTrades(journalEntries[day] || [])
    setIsModalOpen(true)
  }

  const handleAddTrade = () => {
    if (dayTrades.length >= 5) return alert("Maximum 5 trades allowed per day.")
    setDayTrades([...dayTrades, { id: Date.now().toString(), asset: '', entry: '', exit: '', tp: '', sl: '', directPnl: '', brokeragePaid: '', market: category === 'All' ? 'Indian Market' : category, screenshot: '' }])
  }

  const handleRemoveTrade = (id) => setDayTrades(dayTrades.filter(t => t.id !== id))
  const handleTradeChange = (id, field, value) => setDayTrades(dayTrades.map(t => t.id === id ? { ...t, [field]: value } : t))

  const saveEntry = () => {
    const cleaned = dayTrades.map(t => ({
      ...t,
      entry: parseFloat(t.entry) || 0,
      exit: parseFloat(t.exit) || 0,
      tp: parseFloat(t.tp) || 0,
      sl: parseFloat(t.sl) || 0,
      directPnl: (t.directPnl !== '' && t.directPnl !== null && t.directPnl !== undefined) ? (parseFloat(t.directPnl) || 0) : null,
      brokeragePaid: parseFloat(t.brokeragePaid) || 0,
      screenshot: t.screenshot || ''
    })).filter(t => t.entry > 0 || t.exit > 0 || t.directPnl !== null)

    setJournalEntries(prev => ({ ...prev, [selectedDay]: cleaned }))
    setIsModalOpen(false)
  }

  const daysInMonth = 31

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-slate-950">
      
      {/* -- Page Header -- */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex-shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">"""

if target in content:
    content = content.replace(target, replacement)
    with codecs.open('src/pages/PortfolioPage.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Repaired missing handle functions!")
else:
    print("Target not found.")

