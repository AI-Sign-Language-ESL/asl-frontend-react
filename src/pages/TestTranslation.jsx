import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Loader2, AlertCircle, Volume2, CheckCircle2 } from 'lucide-react';
import { translationService } from '../services/api';
import { speak } from '../utils/tts';

const SAMPLE_GLOSS = 'سبب رغبه شراء';

const TestTranslation = () => {
  const [gloss, setGloss] = useState(SAMPLE_GLOSS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTest = useCallback(async () => {
    const trimmed = gloss.trim();
    if (!trimmed) {
      setError('Please enter a gloss to test');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await translationService.testGloss(trimmed);
      setResult(response.data);
      speak(response.data.translation);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        'Translation test failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [gloss, speak]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] pb-6 max-w-2xl mx-auto pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-3xl border border-border-subtle"
      >
        <div className="flex items-center gap-3 mb-6">
          <FlaskConical className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-text-main">Test Translation Pipeline</h2>
        </div>

        <p className="text-sm text-text-muted mb-6">
          Send a gloss to the NLP model and verify the translation pipeline end-to-end.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">
              Gloss (Arabic)
            </label>
            <input
              type="text"
              value={gloss}
              onChange={(e) => setGloss(e.target.value)}
              placeholder="Enter Arabic gloss text..."
              className="w-full px-4 py-3 rounded-xl bg-bg-card border border-border-subtle text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg text-right dir-rtl"
              dir="rtl"
            />
          </div>

          <button
            onClick={handleTest}
            disabled={loading || !gloss.trim()}
            className="w-full px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Testing...</>
            ) : (
              <><FlaskConical className="w-5 h-5" /> Test Translation</>
            )}
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center gap-2 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-500 text-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-sm text-success mb-3">
              <CheckCircle2 className="w-4 h-4" />
              Translation successful
            </div>

            <div className="p-4 rounded-xl bg-bg-card border border-border-subtle">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Gloss</span>
              <p className="text-lg font-semibold text-text-main mt-1 text-right" dir="rtl">
                {result.gloss}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-bg-card border border-border-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Translation</span>
                <button
                  onClick={() => speak(result.translation)}
                  className="p-2 rounded-full hover:bg-bg-card/80 text-text-muted hover:text-primary transition-colors"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
              <p className="text-2xl font-bold text-text-main mt-1 text-right" dir="rtl">
                {result.translation}
              </p>
            </div>

            {result.winner_model && (
              <div className="p-4 rounded-xl bg-bg-card border border-border-subtle border-l-4 border-l-purple-500">
                <span className="text-xs font-medium text-purple-500 uppercase tracking-wider">Debug Analytics</span>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex-1">
                    <p className="text-sm text-text-muted">Winning Model</p>
                    <p className="font-semibold text-text-main capitalize">{result.winner_model}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-text-muted">Latency</p>
                    <p className="font-semibold text-text-main">{result.latency_ms} ms</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TestTranslation;
