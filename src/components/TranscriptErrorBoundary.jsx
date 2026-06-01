import React from 'react';
import { AlertCircle, RefreshCw, Upload } from 'lucide-react';

function TranscriptErrorBoundary({ error, details, onRetry, onFallbackUpload }) {
  const isNetworkError = details === 'FETCH_FAILED' || error?.includes('fetch') || error?.includes('network');
  const isNoTranscript = details === 'TRANSCRIPT_NOT_FOUND' || details === 'NO_TRANSCRIPT' || details === 'EMPTY_TRANSCRIPT';

  return (
    <div className="glass rounded-3xl border border-white/10 p-8">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-text-main mb-2">Transcript Extraction Failed</h3>
        <p className="text-text-muted text-sm max-w-md mx-auto">
          {isNetworkError
            ? 'We could not reach the transcript service. This might be due to your network or YouTube restrictions.'
            : isNoTranscript
              ? 'This video does not have captions available. You can upload the video file instead.'
              : error || 'An unexpected error occurred while extracting the transcript.'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-3 rounded-xl bg-white/5 text-text-main hover:bg-white/10 text-sm font-bold transition-all flex items-center justify-center gap-2 border border-white/10"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
        {onFallbackUpload && (
          <button
            onClick={onFallbackUpload}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Video Instead
          </button>
        )}
      </div>
    </div>
  );
}

export default TranscriptErrorBoundary;
