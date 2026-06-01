import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, Loader2, AlertCircle, Play, RotateCcw, Upload, FileVideo, CheckCircle2, X, Image, FileWarning, ExternalLink } from 'lucide-react';
import { youtubeService } from '../services/api';

const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
const MAX_FILE_SIZE = 500 * 1024 * 1024;

const UPLOAD_STAGES = [
  'Uploading',
  'Extracting Audio',
  'Speech to Text',
  'Generating Gloss',
  'Preparing Avatar',
];

const TABS = ['Transcript', 'Gloss', 'Avatar'];

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
  const [activeTab, setActiveTab] = useState('Transcript');

  // Upload states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStepIndex, setProcessingStepIndex] = useState(-1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const unityIframeRef = useRef(null);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Invalid file type (${ext}). Supported: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum: 500 MB`;
    }
    return null;
  };

  const handleFileSelect = useCallback((file) => {
    setFileError('');
    const validationError = validateFile(file);
    if (validationError) {
      setFileError(validationError);
      return;
    }
    setSelectedFile(file);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  };

  const extractVideoId = (url) => {
    try {
      const u = new URL(url);
      let vid = u.searchParams.get('v');
      if (!vid && u.pathname.startsWith('/embed/')) {
        vid = u.pathname.split('/')[2];
      }
      if (!vid && u.pathname.startsWith('/shorts/')) {
        vid = u.pathname.split('/')[2];
      }
      return vid || null;
    } catch {
      return null;
    }
  };

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

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      setError('Could not extract video ID from URL');
      return;
    }

    setLoading(true);
    setError('');
    setState('checking');
    setResult(null);
    setSelectedFile(null);
    setFileError('');

    try {
      const response = await youtubeService.checkTranscript(videoId);
      const data = response.data;

      if (data.transcript && data.transcript.length >= 10) {
        // Transcript available from server
        setResult({
          transcript: data.transcript,
          gloss: data.gloss || [],
          animations: data.animations || [],
          source: 'YouTube',
        });
        setState('success');
        setLoading(false);
        setTimeout(() => playAnimations(data.animations), 500);
        return;
      }

      // No transcript or too short → fallback
      setState('upload_required');
      setLoading(false);
    } catch (err) {
      const status = err.response?.status;
      if (status === 403 || status === 451) {
        setState('upload_required');
      } else {
        setState('upload_required');
        setError(err.response?.data?.error || 'YouTube processing unavailable.');
      }
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setFileError('');
    setError('');
    setState('uploading');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video_file', selectedFile);

    try {
      const response = await youtubeService.uploadVideo(formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
        timeout: 600000,
      });

      const data = response.data;

      if (!data.success) {
        setState('upload_required');
        setError(data.error || 'Upload processing failed.');
        return;
      }

      // Transition to processing stages
      setState('processing');
      setProcessingStepIndex(1);

      for (let i = 1; i < UPLOAD_STAGES.length; i++) {
        setProcessingStepIndex(i);
        await new Promise((r) => setTimeout(r, 1500));
      }

      setResult({
        transcript: data.transcript || '',
        gloss: data.gloss || [],
        animations: data.animations || [],
        source: 'Upload',
      });
      setState('success');
      setActiveTab('Transcript');

      setTimeout(() => playAnimations(data.animations), 500);
    } catch (err) {
      const data = err.response?.data;
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Upload timed out. Please try a smaller file or check your connection.');
      } else if (err.response?.status === 413) {
        setError('File too large for server. Maximum: 500 MB.');
      } else {
        setError(data?.error || data?.detail || 'Upload failed. Please try another file.');
      }
      setState('upload_required');
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

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setFileError('');
    setUploadProgress(0);
    setProcessingStepIndex(-1);
  };

  const getFileExtension = (name) => {
    return name.split('.').pop().toUpperCase();
  };

  const getVideoIdFromUrl = () => extractVideoId(youtubeUrl);

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
                      Checking...
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

        {error && (state === 'idle' || state === 'checking') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}

        {state === 'checking' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-3xl border border-white/10 p-12 mb-6"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <p className="text-text-muted text-lg">Checking YouTube access...</p>
            </div>
          </motion.div>
        )}

        {state === 'upload_required' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl border border-white/10 p-8 mb-6"
          >
            <div className="text-center mb-6">
              <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-text-main mb-2">This video cannot be processed directly from YouTube.</h3>
              <p className="text-text-muted text-sm">Choose an alternative method below.</p>
            </div>

            {!selectedFile ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload Video
                </button>
                <a
                  href={`https://youtube.com/watch?v=${getVideoIdFromUrl() || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-4 rounded-xl bg-white/5 text-text-main hover:bg-white/10 text-sm font-bold transition-all flex items-center justify-center gap-2 border border-white/10"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open Transcript Manually
                </a>
              </div>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              className="hidden"
              onChange={handleInputFileChange}
            />

            {selectedFile && (
              <div className="mt-6">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className="rounded-2xl border-2 border-dashed p-8 text-center transition-all border-success/50 bg-success/5"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                      <FileVideo className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-text-main font-bold">{selectedFile.name}</p>
                      <p className="text-text-muted text-sm">{formatFileSize(selectedFile.size)} &bull; {getFileExtension(selectedFile.name)}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleUpload}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload & Process
                      </button>
                      <button
                        type="button"
                        onClick={resetUpload}
                        className="px-4 py-2.5 rounded-xl bg-white/5 text-text-muted hover:bg-white/10 text-sm font-bold transition-all flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Change
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {fileError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2"
              >
                <FileWarning className="w-4 h-4 shrink-0" />
                {fileError}
              </motion.div>
            )}

            {/* Also allow drag-drop anywhere in this card */}
            {!selectedFile && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="mt-6 rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer border-white/20 hover:border-white/40 bg-white/[0.02]"
                onClick={handleBrowseClick}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-text-main font-bold text-lg">Drop video file here</p>
                    <p className="text-text-muted text-sm mt-1">or click to browse</p>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Supported: MP4, MOV, AVI, MKV, WEBM &bull; Max: 500 MB
                  </p>
                </div>
              </div>
            )}

            {error && state === 'upload_required' && !fileError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </motion.div>
        )}

        {state === 'uploading' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl border border-white/10 p-8 mb-6"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <FileVideo className="w-6 h-6 text-primary" />
              </div>
              <div className="w-full max-w-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-muted">Uploading...</span>
                  <span className="text-text-main font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
              </div>
              {selectedFile && (
                <p className="text-xs text-text-muted">
                  {selectedFile.name} &bull; {formatFileSize(selectedFile.size)}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {state === 'processing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl border border-white/10 p-8 mb-6"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <div className="w-full max-w-md space-y-4">
                {UPLOAD_STAGES.map((stage, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      i < processingStepIndex
                        ? 'bg-success/20 text-success'
                        : i === processingStepIndex
                          ? 'bg-primary/20 text-primary'
                          : 'bg-white/5 text-text-muted'
                    }`}>
                      {i < processingStepIndex ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : i === processingStepIndex ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <span className={`text-sm ${
                      i <= processingStepIndex ? 'text-text-main font-medium' : 'text-text-muted'
                    }`}>
                      {stage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
                    <p className="text-xs text-text-muted">
                      Source: {result.source || 'YouTube'}
                    </p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-4 bg-white/5 rounded-xl p-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeTab === tab
                          ? 'bg-primary/20 text-primary shadow-sm'
                          : 'text-text-muted hover:text-text-main hover:bg-white/5'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === 'Transcript' && result.transcript && (
                    <motion.div
                      key="transcript"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <p className="text-xs text-text-muted mb-2 uppercase tracking-wider">Transcript</p>
                      <div className="text-sm text-text-main leading-relaxed" dir="rtl">
                        {result.transcript}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'Gloss' && result.gloss && result.gloss.length > 0 && (
                    <motion.div
                      key="gloss"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="p-4 rounded-xl bg-white/5 border border-white/10"
                    >
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
                    </motion.div>
                  )}

                  {activeTab === 'Avatar' && (
                    <motion.div
                      key="avatar"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      <div className="flex gap-2 mb-4">
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
                    </motion.div>
                  )}
                </AnimatePresence>
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