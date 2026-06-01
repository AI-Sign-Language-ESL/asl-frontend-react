import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, Clock, FileText, AlertCircle, ChevronDown, ChevronUp, Send, X } from 'lucide-react';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TranscriptPreview({ segments, transcript, videoMeta, videoId, onSubmit, submitting, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const [showAllSegments, setShowAllSegments] = useState(false);

  const wordCount = useMemo(() => transcript ? transcript.split(/\s+/).filter(Boolean).length : 0, [transcript]);
  const charCount = useMemo(() => transcript ? transcript.length : 0, [transcript]);
  const duration = useMemo(() => {
    if (!segments || segments.length === 0) return 0;
    const last = segments[segments.length - 1];
    return last.start + last.duration;
  }, [segments]);

  const displaySegments = showAllSegments ? segments : segments?.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl border border-white/10 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="font-bold text-text-main">Transcript Extracted</h3>
              {videoMeta?.title && (
                <p className="text-xs text-text-muted truncate max-w-[300px]">{videoMeta.title}</p>
              )}
            </div>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="p-2 rounded-lg hover:bg-white/5 text-text-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-text-muted">
            <FileText className="w-3.5 h-3.5" />
            {wordCount} words
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(duration)}
          </div>
          {videoId && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-text-muted">
              ID: {videoId}
            </div>
          )}
        </div>

        <div
          className="p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-text-muted uppercase tracking-wider">Transcript Preview</p>
            {expanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
          </div>
          <div className="text-sm text-text-main leading-relaxed line-clamp-3" dir="auto">
            {transcript}
          </div>
        </div>

        <AnimatePresence>
          {expanded && segments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 max-h-64 overflow-y-auto space-y-1">
                {displaySegments.map((seg) => (
                  <div key={seg.index} className="flex gap-3 text-sm py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-text-muted text-xs font-mono shrink-0 w-12 pt-0.5">
                      {formatTime(seg.start)}
                    </span>
                    <span className="text-text-main" dir="auto">{seg.text}</span>
                  </div>
                ))}
                {segments.length > 5 && !showAllSegments && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowAllSegments(true); }}
                    className="w-full py-2 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Show all {segments.length} segments
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 pb-6">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Translate to Sign Language ({charCount > 5000 ? `${charCount} chars` : `${wordCount} words`})
            </>
          )}
        </button>
        {charCount > 5000 && (
          <p className="mt-2 text-xs text-yellow-500 flex items-center gap-1 justify-center">
            <AlertCircle className="w-3 h-3" />
            Long transcript ({charCount} chars). May be truncated during processing.
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default TranscriptPreview;
