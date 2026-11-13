import re

filepath = r"c:\Users\muruganandham\Desktop\projects\trading platform\frontend\src\contexts\PortfolioContext.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix load data from Supabase
load_data_old = """    const fetchPortfolioData = async () => {
      try {
        // 1. Fetch connected brokers
        const { data: brokers, error: brokersError } = await supabase.from('broker_connections').select('*');
        if (brokersError) throw brokersError;
        if (brokers) {
          const brokerMap = {};
          brokers.forEach(b => {
            brokerMap[b.broker_name] = { connected: b.status === 'active', ...b };
          });
          setConnectedBrokers(brokerMap);
        }

        // 2. Fetch journal entries
        const { data: entries, error: entriesError } = await supabase.from('journal_entries').select('*');
        if (entriesError) throw entriesError;
        if (entries) {"""

load_data_new = """    const fetchPortfolioData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Do not fetch if not logged in

        // 1. Fetch connected brokers
        const { data: brokers, error: brokersError } = await supabase.from('broker_connections').select('*').eq('user_id', user.id);
        if (brokersError) throw brokersError;
        if (brokers) {
          const brokerMap = {};
          brokers.forEach(b => {
            brokerMap[b.broker_name] = { connected: b.status === 'active', ...b };
          });
          setConnectedBrokers(brokerMap);
        }

        // 2. Fetch journal entries
        const { data: entries, error: entriesError } = await supabase.from('journal_entries').select('*').eq('user_id', user.id);
        if (entriesError) throw entriesError;
        if (entries) {"""
content = content.replace(load_data_old, load_data_new)

# 2. Fix resetPortfolio
reset_old = """      try {
        // Delete all journal entries for this portfolio type
        const { error } = await supabase.from('journal_entries').delete().eq('portfolio_type', portfolioType);
        if (error) throw error;"""
reset_new = """      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        // Delete all journal entries for this portfolio type for this user
        const { error } = await supabase.from('journal_entries').delete().eq('user_id', user.id).eq('portfolio_type', portfolioType);
        if (error) throw error;"""
content = content.replace(reset_old, reset_new)

# 3. Fix saveJournalTrades (bulkImportTrades)
save_old = """      try {
        // 1. Delete existing manual trades for this date to replace them
        const { error: deleteError } = await supabase.from('journal_entries')
          .delete()
          .eq('date', dateStr)
          .eq('portfolio_type', portfolioType);
        
        if (deleteError) throw deleteError;

        if (toInsert.length > 0) {
          const { error: insertError } = await supabase.from('journal_entries').insert(toInsert);
          if (insertError) throw insertError;
        }"""
save_new = """      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        
        // 1. Delete existing manual trades for this date to replace them for this user
        const { error: deleteError } = await supabase.from('journal_entries')
          .delete()
          .eq('user_id', user.id)
          .eq('date', dateStr)
          .eq('portfolio_type', portfolioType);
        
        if (deleteError) throw deleteError;

        if (toInsert.length > 0) {
          const payload = toInsert.map(t => ({ ...t, user_id: user.id }));
          const { error: insertError } = await supabase.from('journal_entries').insert(payload);
          if (insertError) throw insertError;
        }"""
content = content.replace(save_old, save_new)

# 4. Fix syncBrokers data injection
bulk_import_old = """      const allInserts = Object.values(connectedBrokers)
        .filter(b => b.connected && b.trades)
        .flatMap(b => b.trades.map(t => ({
          ...t,
          portfolio_type: 'real',
          broker_id: b.id
        })));
        
      if (allInserts.length === 0) return;

      // 2. Insert validated trades
      const { error } = await supabase.from('journal_entries').insert(allInserts);
      if (error) throw error;"""
bulk_import_new = """      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const allInserts = Object.values(connectedBrokers)
        .filter(b => b.connected && b.trades)
        .flatMap(b => b.trades.map(t => ({
          ...t,
          portfolio_type: 'real',
          broker_id: b.id,
          user_id: user.id
        })));
        
      if (allInserts.length === 0) return;

      // 2. Insert validated trades
      const { error } = await supabase.from('journal_entries').insert(allInserts);
      if (error) throw error;"""
content = content.replace(bulk_import_old, bulk_import_new)

# 5. Fix connectBroker
connect_broker_old = """        // Insert to Supabase
        const { data, error } = await supabase.from('broker_connections').insert([payload]).select();
        if (error) throw error;"""
connect_broker_new = """        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        payload.user_id = user.id;

        // Insert to Supabase
        const { data, error } = await supabase.from('broker_connections').insert([payload]).select();
        if (error) throw error;"""
content = content.replace(connect_broker_old, connect_broker_new)

# 6. Fix disconnectBroker
disconnect_old = """        const broker = connectedBrokers[brokerName];
        if (broker && broker.id) {
          const { error } = await supabase.from('broker_connections').delete().eq('id', broker.id);
          if (error) throw error;
        }"""
disconnect_new = """        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        const broker = connectedBrokers[brokerName];
        if (broker && broker.id) {
          const { error } = await supabase.from('broker_connections').delete().eq('id', broker.id).eq('user_id', user.id);
          if (error) throw error;
        }"""
content = content.replace(disconnect_old, disconnect_new)


with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
    
print("Successfully patched PortfolioContext.jsx")
