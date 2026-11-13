import React, { useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../contexts/ToastContext';

export default function ChatWidget({ lessonTitle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{
    id: 1,
    role: 'ai',
    content: `Hi! I'm your AI Mentor. Ask me anything about "${lessonTitle}".`
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [questionsLeft, setQuestionsLeft] = useState(5);
  const { showToast } = useToast();

  const handleSend = () => {
    if (!input.trim()) return;
    if (questionsLeft <= 0) {
      showToast("You've reached your free daily limit. Upgrade to Premium for unlimited questions.", "error");
      return;
    }

    const newMsg = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);
    setQuestionsLeft(prev => prev - 1);

    // Stub AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'ai',
        content: `That's a great question about ${lessonTitle}! In trading, it's crucial to understand the context. Make sure you backtest this concept before applying it live.`
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] hover:shadow-[0_0_25px_rgba(37,99,235,0.7)] transition-all z-40 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-80 md:w-96 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden h-[500px] max-h-[80vh]"
          >
            {/* Header */}
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-yellow-300" />
                <div>
                  <h3 className="font-bold text-sm">AI Trading Mentor</h3>
                  <p className="text-[10px] text-blue-200">Free Tier: {questionsLeft}/5 Questions Remaining Today</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-blue-200 hover:text-white transition-colors p-1">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-[#0b0e14] space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-700 rounded-bl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-full px-4 py-2 border border-gray-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a question..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 dark:text-slate-200 placeholder-gray-500"
                  disabled={questionsLeft <= 0}
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || questionsLeft <= 0}
                  className="text-blue-600 disabled:text-gray-400 transition-colors p-1"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
