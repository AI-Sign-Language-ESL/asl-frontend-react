import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, Loader2, AlertCircle } from 'lucide-react';
import classNames from 'classnames';

const TranslationBox = ({ gloss, translation, isTranslating, error, onSpeak }) => {
  const hasGloss = Boolean(gloss);
  const hasTranslation = Boolean(translation);

  return (
    <div className="glass p-6 rounded-3xl border border-border-subtle flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 z-10">
        <h3 className="font-semibold text-text-muted text-sm uppercase tracking-wider">Live Translation</h3>
        {isTranslating && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
      </div>

      <div className="flex-1 flex flex-col gap-4 z-10 min-h-[160px]">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-500 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}

        {hasGloss && (
          <div>
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Gloss</span>
            <AnimatePresence mode="wait">
              <motion.p
                key={gloss}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-semibold text-text-main mt-1"
              >
                {gloss}
              </motion.p>
            </AnimatePresence>
          </div>
        )}

        {hasTranslation ? (
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Translation</span>
              <button
                onClick={() => onSpeak?.(translation)}
                className="p-2 rounded-full bg-bg-card hover:bg-bg-card/80 text-text-main transition-colors cursor-pointer group/btn"
              >
                <Volume2 className="w-5 h-5 group-hover/btn:text-primary transition-colors" />
              </button>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={translation}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-3xl font-bold text-text-main mt-1"
              >
                {translation}
              </motion.p>
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className={classNames(
              "text-center",
              isTranslating ? "text-text-muted" : "text-text-muted/60"
            )}>
              {isTranslating ? 'Translating...' : 'Waiting for input...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationBox;
