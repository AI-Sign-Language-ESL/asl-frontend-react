import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Youtube, Languages, Video, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { youtubeService } from '../services/api';

const YouTubeTranslate = () => {
  const { user } = useAuth();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleTranslate = async (e) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    // Basic YouTube URL validation
    if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await youtubeService.translate(youtubeUrl);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Translation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center pt-12 pb-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
            <Youtube className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-main mb-2">YouTube Translation</h1>
          <p className="text-text-muted max-w-md mx-auto">
            Paste a YouTube video URL and watch it translated to sign language
          </p>
        </div>

        {/* Input Form */}
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
                      Processing...
                    </>
                  ) : (
                    <>
                      <Languages className="w-4 h-4" />
                      Translate
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-text-muted mt-2">
                Costs 15 tokens • Supports Arabic speech
              </p>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl border border-white/10 overflow-hidden"
          >
            {/* Success Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="font-bold text-text-main">Translation Complete!</h3>
                  <p className="text-xs text-text-muted">Your video has been translated to sign language</p>
                </div>
              </div>

              {/* Transcribed Text */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-text-muted mb-1">Transcribed Text:</p>
                <p className="text-sm text-text-main">{result.transcribed_text}</p>
              </div>
            </div>

            {/* Sign Language Video */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-4 h-4 text-primary" />
                <h4 className="font-bold text-text-main">Sign Language Translation</h4>
              </div>
              <div className="rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                <video
                  controls
                  className="w-full h-full object-contain"
                  src={result.video}
                >
                  Your browser does not support video playback.
                </video>
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-text-muted">
                  Remaining tokens: <span className="text-primary font-bold">{result.remaining_tokens}</span>
                </p>
                <a
                  href={result.video}
                  download
                  className="text-xs text-primary hover:text-secondary transition-colors"
                >
                  Download Video
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* How It Works */}
        {!result && (
          <div className="glass rounded-2xl border border-white/10 p-6">
            <h3 className="font-bold text-text-main mb-4">How It Works</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { step: 1, icon: <Youtube className="w-5 h-5" />, title: 'Paste URL', desc: 'Enter a YouTube video URL with Arabic speech' },
                { step: 2, icon: <Languages className="w-5 h-5" />, title: 'Transcribe', desc: 'Audio is extracted and converted to text' },
                { step: 3, icon: <Video className="w-5 h-5" />, title: 'Translate', desc: 'Text is translated to sign language video' },
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
