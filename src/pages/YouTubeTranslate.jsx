import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Languages, Loader2, AlertCircle, Play, RotateCcw, Upload } from 'lucide-react';
import { youtubeService } from '../services/api';

const YoutubeIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.01 3.01 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.01 3.01 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.01 3.01 0 0 0 2.122 2.136c1.871.505 9.377.505 9.377.505s7.505 0 9.377-.505a3.01 3.01 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const YouTubeTranslate = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const unityIframeRef = useRef(null);

  const handleTranslate = async (e) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);
    setError('');
    setState('loading');
    setResult(null);

    try {
      const response = await youtubeService.signTranslate(youtubeUrl);
      const data = response.data;

      if (!data.success) {
        setState('upload_required');
        setError(data.error || 'Unable to process this YouTube video.');
        setLoading(false);
        return;
      }

      setResult(data);
      setState('success');
      setLoading(false);

      setTimeout(() => playAnimations(data.animations), 500);
    } catch (err) {
      const data = err.response?.data;
      if (data && !data.success && data.requires_upload) {
        setState('upload_required');
        setError(data.error || 'Unable to process this YouTube video.');
      } else {
        setState('idle');
        setError(data?.error || data?.detail || 'Translation failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const playAnimations = (animations) => {
    if (!animations || animations.length === 0) return;
    const unityWindow = unityIframeRef.current?.contentWindow;
    if (unityWindow && unityWindow.unityInstance) {
      window.unityInstance = unityWindow.unityInstance;
    }
    if (window.unityInstance) {
      window.unityInstance.SendMessage("tpose", "ReceiveAnimations", JSON.stringify(animations));
    } else {
      setTimeout(() => playAnimations(animations), 500);
    }
  };

  const handleReplay = () => {
    if (result?.animations) {
      playAnimations(result.animations);
    }
  };

  const handleUploadRedirect = () => {
    window.location.href = '/upload';
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center pt-12 pb-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
            <YoutubeIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-main mb-2">YouTube Sign Translation</h1>
          <p className="text-text-muted max-w-md mx-auto">
            Paste an Arabic YouTube video URL and watch the avatar perform sign language
          </p>
        </div>

        <div className="glass rounded-3xl border border-white/10 p-6 mb-6">
          <form onSubmit={handleTranslate} className="space-y-4">
            <div>
              <label className="text-xs text-text-muted mb-2 block uppercase tracking-wider">
                YouTube URL
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !youtubeUrl.trim()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Languages className="w-4 h-4" />
                      Translate
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {error && (state !== 'upload_required') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}

        {state === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-3xl border border-white/10 p-12 mb-6"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <p className="text-text-muted text-lg">Processing Arabic Transcript...</p>
            </div>
          </motion.div>
        )}

        {state === 'upload_required' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl border border-white/10 p-12 mb-6 text-center"
          >
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-text-main mb-2">Upload Required</h3>
            <p className="text-text-muted mb-6 max-w-md mx-auto">
              {error || "This video cannot currently be processed. Please upload the video directly."}
            </p>
            <button
              onClick={handleUploadRedirect}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 mx-auto"
            >
              <Upload className="w-4 h-4" />
              Upload Video
            </button>
          </motion.div>
        )}

        {state === 'success' && result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass rounded-3xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                    <Languages className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-main">Translation Complete</h3>
                    <p className="text-xs text-text-muted">Source: {result.source}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-text-muted mb-1 uppercase tracking-wider">Transcript</p>
                    <p className="text-sm text-text-main" dir="rtl">{result.transcript}</p>
                  </div>

                  {result.gloss && result.gloss.length > 0 && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs text-text-muted mb-2 uppercase tracking-wider">Gloss</p>
                      <div className="flex flex-wrap gap-2">
                        {result.gloss.map((word, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleReplay}
                      className="px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                      <Play className="w-4 h-4" /> Play
                    </button>
                    <button
                      onClick={handleReplay}
                      className="px-4 py-2 bg-white/5 text-text-muted hover:bg-white/10 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" /> Replay
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative" style={{ minHeight: '400px' }}>
                <iframe
                  ref={unityIframeRef}
                  src="/unity/index.html"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  title="Unity Avatar"
                  allow="autoplay; fullscreen"
                />
              </div>
            </div>
          </motion.div>
        )}

        {state === 'idle' && (
          <div className="glass rounded-3xl border border-white/10 p-6">
            <h3 className="font-bold text-text-main mb-4">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: 1, icon: <YoutubeIcon className="w-5 h-5" />, title: 'Paste URL', desc: 'Enter a YouTube video URL with Arabic speech' },
                { step: 2, icon: <Languages className="w-5 h-5" />, title: 'Transcribe & Gloss', desc: 'Arabic transcript is extracted and converted to sign gloss' },
                { step: 3, icon: <Play className="w-5 h-5" />, title: 'Animate', desc: 'Text is translated to sign language avatar animations' },
              ].map((item) => (
                <div key={item.step} className="text-center p-4 rounded-xl bg-white/[0.02]">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary">
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-text-main text-sm mb-1">Step {item.step}: {item.title}</h4>
                  <p className="text-[11px] text-text-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default YouTubeTranslate;