import { useState, useRef, useCallback } from 'react';
import {
  extractVideoId,
  fetchTranscriptWithFallback,
  getVideoMeta,
  TranscriptError,
} from '../services/youtubeTranscriptService';

const INITIAL_STATE = {
  state: 'idle',
  segments: null,
  transcript: null,
  error: null,
  videoId: null,
  videoMeta: null,
  details: null,
};

export function useYoutubeTranscript() {
  const [state, setState] = useState(INITIAL_STATE);
  const lastUrlRef = useRef(null);
  const abortRef = useRef(null);

  const extract = useCallback(async (url) => {
    if (!url || url.trim().length === 0) {
      setState(s => ({ ...s, state: 'error', error: 'Please enter a YouTube URL' }));
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      setState(s => ({ ...s, state: 'error', error: 'Could not extract video ID from URL' }));
      return;
    }

    lastUrlRef.current = url;

    if (abortRef.current) {
      abortRef.current.abort();
    }

    setState({
      state: 'extracting',
      segments: null,
      transcript: null,
      error: null,
      videoId,
      videoMeta: null,
      details: 'Checking transcript availability...',
    });

    try {
      const [meta, transcriptResult] = await Promise.all([
        getVideoMeta(videoId),
        fetchTranscriptWithFallback(videoId),
      ]);

      setState({
        state: 'success',
        segments: transcriptResult.segments,
        transcript: transcriptResult.transcript,
        error: null,
        videoId,
        videoMeta: meta,
        details: null,
      });
    } catch (err) {
      const msg = err instanceof TranscriptError
        ? getErrorMessage(err.code)
        : err.message || 'Failed to extract transcript';

      setState(s => ({
        ...s,
        state: 'error',
        error: msg,
        details: err instanceof TranscriptError ? err.code : 'UNKNOWN',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    lastUrlRef.current = null;
  }, []);

  const retry = useCallback(() => {
    if (lastUrlRef.current) {
      extract(lastUrlRef.current);
    }
  }, [extract]);

  return {
    ...state,
    extract,
    reset,
    retry,
  };
}

function getErrorMessage(code) {
  switch (code) {
    case 'TRANSCRIPT_NOT_FOUND':
      return 'No transcript (captions) available for this video. Try a different video or upload the file.';
    case 'EMPTY_TRANSCRIPT':
      return 'The transcript for this video is empty.';
    case 'NO_TRANSCRIPT':
      return 'No transcript available for any supported language. Try uploading the video file instead.';
    case 'FETCH_FAILED':
      return 'Failed to fetch transcript. Check your connection and try again.';
    default:
      return 'Could not retrieve transcript. Try uploading the video manually.';
  }
}
