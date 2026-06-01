const YOUTUBETRANSCRIPT_URL = 'https://youtubetranscript.com';

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

export async function fetchTranscript(videoId, lang = 'ar') {
  const url = `${YOUTUBETRANSCRIPT_URL}/?v=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(lang)}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new TranscriptError(
        lang === 'ar' ? 'No Arabic transcript available' : 'No transcript available for this language',
        'TRANSCRIPT_NOT_FOUND'
      );
    }
    throw new TranscriptError(
      `Failed to fetch transcript (${response.status})`,
      'FETCH_FAILED'
    );
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new TranscriptError('Transcript is empty', 'EMPTY_TRANSCRIPT');
  }

  const segments = data.map((seg, i) => ({
    start: seg.offset ?? 0,
    duration: seg.duration ?? 0,
    text: (seg.text || '').replace(/[\s\n\r]+/g, ' ').trim(),
    index: i,
  })).filter(s => s.text.length > 0);

  if (segments.length === 0) {
    throw new TranscriptError('Transcript is empty', 'EMPTY_TRANSCRIPT');
  }

  return {
    segments,
    transcript: segments.map(s => s.text).join(' '),
  };
}

export async function fetchTranscriptWithFallback(videoId) {
  let lastError = null;

  for (const lang of SUPPORTED_LANGS) {
    try {
      return await fetchTranscript(videoId, lang);
    } catch (err) {
      lastError = err;
      if (err.code === 'TRANSCRIPT_NOT_FOUND' || err.code === 'EMPTY_TRANSCRIPT') continue;
      throw err;
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
