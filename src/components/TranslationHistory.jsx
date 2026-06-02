import React from 'react';
import { motion } from 'framer-motion';
import { History, CheckCircle2, Volume2 } from 'lucide-react';

const TranslationHistory = ({ history, onSpeak }) => {
  return (
    <div className="glass rounded-3xl border border-border-subtle flex-1 flex flex-col overflow-hidden">
      <div className="p-5 border-b border-border-subtle flex items-center gap-2 bg-bg-card/50">
        <History className="w-4 h-4 text-text-muted" />
        <span className="font-semibold text-sm text-text-main">Translation History</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-muted text-sm">
            No translations yet
          </div>
        ) : (
          history.map((entry, i) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={entry.id ?? i}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-bg-card transition-colors text-sm"
            >
              <div className="flex items-center gap-3 text-text-main min-w-0">
                <span className="text-text-muted text-xs font-mono shrink-0">{entry.timestamp}</span>
                <div className="min-w-0">
                  {entry.gloss && (
                    <div className="text-xs text-text-muted truncate">{entry.gloss}</div>
                  )}
                  <div className="font-medium truncate">{entry.translation}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onSpeak?.(entry.translation)}
                  className="p-1.5 rounded-full hover:bg-bg-card/80 text-text-muted hover:text-primary transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1.5 text-success">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TranslationHistory;
