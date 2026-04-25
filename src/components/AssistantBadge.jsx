import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

const AssistantBadge = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: t('assistant.welcome'), isBot: true, isTranslationKey: true }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const suggestions = [t('assistant.sug1'), t('assistant.sug2'), t('assistant.sug3')];

  const handleSend = (text) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { text, isBot: false }]);
    setInput("");
    setIsTyping(true);

    // Mock response
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { text: t('assistant.bot_response'), isBot: true, isTranslationKey: true }]);
    }, 1500);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 bg-primary hover:bg-secondary rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(59,130,246,0.4)] group transition-colors"
            >
              <MessageSquare className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[350px] h-[500px] glass rounded-3xl border border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-primary text-white flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold">{t('assistant.title')}</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.map((msg, i) => (
                <div key={i} className={classNames("max-w-[85%] rounded-2xl p-3 text-sm", msg.isBot ? "bg-bg-card self-start rounded-tl-sm text-text-main border border-border-subtle" : "bg-primary self-end rounded-tr-sm text-white")}>
                  {msg.isTranslationKey ? t(msg.text === t('assistant.welcome') ? 'assistant.welcome' : 'assistant.bot_response') : msg.text}
                </div>
              ))}
              {isTyping && (
                <div className="bg-bg-card self-start rounded-2xl rounded-tl-sm p-3 flex gap-1 w-12 justify-center border border-border-subtle">
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-text-muted rounded-full" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-text-muted rounded-full" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-text-muted rounded-full" />
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
              {suggestions.map((sug, i) => (
                <button key={i} onClick={() => handleSend(sug)} className="shrink-0 text-xs bg-bg-card hover:bg-white/10 border border-border-subtle px-3 py-1.5 rounded-full text-text-muted hover:text-text-main transition-colors">
                  {sug}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-black/5 border-t border-border-subtle">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                  placeholder={t('assistant.placeholder')}
                  className="w-full bg-bg-card border border-border-subtle rounded-full pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:border-primary text-text-main"
                />
                <button onClick={() => handleSend(input)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary hover:bg-secondary rounded-full text-white transition-colors">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AssistantBadge;
