import { youtubeService } from './api';

const SUPPORTED_LANGS = ['ar', 'ar-EG', 'en', 'en-US'];

export function extractVideoId(url) {
  try {
    const u = new URL(url);
    let vid = u.searchParams.get('v');
    if (!vid && u.pathname.startsWith('/embed/')) {
      vid = u.pathname.split('/')[2];
    }
    if (!vid && u.pathname.startsWith('/shorts/')) {
      vid = u.pathname.split('/')[2];
    }
    if (!vid && u.hostname === 'youtu.be') {
      vid = u.pathname.slice(1).split('?')[0];
    }
    return vid && /^[0-9A-Za-z_-]{11}$/.test(vid) ? vid : null;
  } catch {
    return null;
  }
}

export function isValidYoutubeUrl(url) {
  return extractVideoId(url) !== null;
}

/**
 * Fetches transcript from the Tafahom backend.
 * The backend uses youtube-transcript-api server-side and falls back
 * to yt-dlp + Whisper if captions are unavailable.
 */
export async function fetchTranscript(videoId) {
  try {
    const response = await youtubeService.fetchTranscript(videoId);
    const data = response.data;

    if (!data.success) {
      throw new TranscriptError(
        data.error || 'No transcript available for this video',
        'TRANSCRIPT_NOT_FOUND'
      );
    }

    const segments = (data.segments || []).map((seg, i) => ({
      start: seg.start ?? 0,
      duration: seg.duration ?? 0,
      text: (seg.text || '').replace(/[\s\n\r]+/g, ' ').trim(),
      index: i,
    })).filter(s => s.text.length > 0);

    if (segments.length === 0 && !data.transcript) {
      throw new TranscriptError('Transcript is empty', 'EMPTY_TRANSCRIPT');
    }

    return {
      segments,
      transcript: data.transcript || segments.map(s => s.text).join(' '),
      source: data.source || 'transcript',
      duration: data.duration || 0,
    };
  } catch (err) {
    if (err instanceof TranscriptError) throw err;
    if (err.response?.status === 404) {
      throw new TranscriptError(
        'No transcript available for this video',
        'TRANSCRIPT_NOT_FOUND'
      );
    }
    throw new TranscriptError(
      err.response?.data?.error || err.message || 'Failed to fetch transcript',
      'FETCH_FAILED'
    );
  }
}

export async function fetchTranscriptWithFallback(videoId) {
  let lastError = null;

  // The backend handles language fallback internally,
  // but we try multiple langs here as a safety net
  for (const lang of SUPPORTED_LANGS) {
    try {
      // The backend endpoint accepts language param
      const response = await youtubeService.fetchTranscript(videoId, lang);
      const data = response.data;

      if (data.success) {
        const segments = (data.segments || []).map((seg, i) => ({
          start: seg.start ?? 0,
          duration: seg.duration ?? 0,
          text: (seg.text || '').replace(/[\s\n\r]+/g, ' ').trim(),
          index: i,
        })).filter(s => s.text.length > 0);

        return {
          segments,
          transcript: data.transcript || segments.map(s => s.text).join(' '),
          source: data.source || 'transcript',
          duration: data.duration || 0,
        };
      }
      lastError = new TranscriptError(data.error || 'No transcript', 'TRANSCRIPT_NOT_FOUND');
    } catch (err) {
      lastError = err instanceof TranscriptError ? err : new TranscriptError(err.message, 'FETCH_FAILED');
      if (lastError.code !== 'TRANSCRIPT_NOT_FOUND') throw lastError;
    }
  }

  throw lastError || new TranscriptError('No transcript available for any supported language', 'NO_TRANSCRIPT');
}

export async function getVideoMeta(videoId) {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || null,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        author: data.author_name || null,
      };
    }
  } catch {
    // silent
  }
  return {
    title: null,
    thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    author: null,
  };
}

export class TranscriptError extends Error {
  constructor(message, code = 'UNKNOWN') {
    super(message);
    this.name = 'TranscriptError';
    this.code = code;
  }
}
