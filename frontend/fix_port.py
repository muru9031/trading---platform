import codecs

with codecs.open('src/pages/PortfolioPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = """  // -- Modals ---------------------------------------------------------------
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-slate-950">"""

replacement1 = """  // -- Modals ---------------------------------------------------------------
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
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-slate-950">"""

if target1 in content:
    content = content.replace(target1, replacement1)
    print("Patched handle functions successfully.")
else:
    print("Target 1 not found! Trying to repair missing content...")
    # Because replace_file_content deleted everything from line 154 to 170. Let's fix it manually.
