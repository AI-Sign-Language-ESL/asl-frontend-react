import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, Loader2, AlertCircle, Play, RotateCcw, Upload, FileVideo, CheckCircle2, X, FileWarning, ExternalLink, Search, Terminal } from 'lucide-react';
import { youtubeService } from '../services/api';
import { useYoutubeTranscript } from '../hooks/useYoutubeTranscript';
import { useUnity } from '../hooks/useUnity';
import { isValidYoutubeUrl } from '../services/youtubeTranscriptService';
import TranscriptPreview from '../components/TranscriptPreview';
import TranscriptErrorBoundary from '../components/TranscriptErrorBoundary';

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
    <path d="M23.498 6.186a3.01 3.01 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.01 3.01 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.01 3.01 0 0 0 2.122 2.136c1.871.505 9.377.505 9.377.505s7.505 0 9.377-.505a3.01 3.01 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const YouTubeTranslate = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [submitState, setSubmitState] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Transcript');
  const [submitting, setSubmitting] = useState(false);

  // Upload states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStepIndex, setProcessingStepIndex] = useState(-1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const unityIframeRef = useRef(null);
  const fileInputRef = useRef(null);

  const { unityReady, sendMessage } = useUnity(unityIframeRef);

  const {
    state: transcriptState,
    segments,
    transcript,
    error: transcriptError,
    details: transcriptDetails,
    videoId,
    videoMeta,
    extract: extractTranscript,
    reset: resetTranscript,
    retry: retryTranscript,
  } = useYoutubeTranscript();

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

  const handleExtractTranscript = (e) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }
    if (!isValidYoutubeUrl(youtubeUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }
    setError('');
    setSubmitState('idle');
    setResult(null);
    resetTranscript();
    extractTranscript(youtubeUrl);
  };

  const handleSubmitToBackend = async () => {
    if (!transcript) return;

    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.tafahom.io (default)';
    console.log('[YouTubeTranslate] Submitting browser transcript...');
    console.log('[YouTubeTranslate] API URL:', apiUrl);
    console.log('[YouTubeTranslate] Authenticated:', !!token);
    console.log('[YouTubeTranslate] Transcript length:', transcript?.length);
    console.log('[YouTubeTranslate] Segments:', segments?.length);
    console.log('[YouTubeTranslate] Video ID:', videoId);

    if (!token) {
      setError('You must be logged in to translate. Please log in first.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await youtubeService.submitBrowserTranscript({
        video_id: videoId || '',
        title: videoMeta?.title || '',
        transcript,
        segments: segments || [],
        language: 'ar',
      });

      console.log('[YouTubeTranslate] Backend response:', response.status, response.data);

      const data = response.data;

      if (!data.success) {
        setError(data.error || 'Translation failed.');
        setSubmitting(false);
        return;
      }

      setResult({
        transcript: data.transcript || transcript,
        gloss: data.gloss || [],
        animations: data.animations || [],
        source: 'YouTube (Browser)',
      });
      setSubmitState('success');
      setSubmitting(false);

      setTimeout(() => playAnimations(data.animations), 500);
    } catch (err) {
      console.error('[YouTubeTranslate] Submit error:', err);
      console.error('[YouTubeTranslate] Response:', err.response?.status, err.response?.data);
      console.error('[YouTubeTranslate] Network:', err.code, err.message);
      const data = err.response?.data;
      const status = err.response?.status;
      if (status === 401) {
        setError('Authentication failed. Please log out and log back in.');
      } else if (status === 403) {
        setError(data?.error || data?.detail || 'Your plan does not support this feature. Please upgrade.');
      } else if (status === 413) {
        setError('Transcript is too large for the server.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Cannot reach the server. Check if the backend is running and VITE_API_URL is correct.');
      } else {
        setError(data?.error || data?.detail || 'Failed to submit transcript. Please try again.');
      }
      setSubmitting(false);
    }
  };

  const handleFallbackUpload = () => {
    resetTranscript();
    setSubmitState('upload_required');
  };

  const handleRetryExtraction = () => {
    retryTranscript();
  };

  const playAnimations = (animations) => {
    if (!animations || animations.length === 0) return;
    console.log("Unity Ready:", unityReady, "Sending message:", animations);
    sendMessage("hope", "ReceiveAnimations", JSON.stringify(animations));
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

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    setFileError('');
    setError('');
    setSubmitState('uploading');
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
        setSubmitState('upload_required');
        setError(data.error || 'Upload processing failed.');
        return;
      }

      setSubmitState('processing');
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
      setSubmitState('success');
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
      setSubmitState('upload_required');
    }
  };

  const showUploadFallback = () => {
    return submitState === 'upload_required' || (transcriptState === 'error' && transcriptError?.includes('upload'));
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

        {(submitState === 'idle' || submitState === 'upload_required') && transcriptState !== 'extracting' && transcriptState !== 'success' && (
          <div className="glass rounded-3xl border border-white/10 p-6 mb-6">
            <form onSubmit={handleExtractTranscript} className="space-y-4">
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
                  />
                  <button
                    type="submit"
                    disabled={!youtubeUrl.trim()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Extract
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Transcript Extraction States */}
        {transcriptState === 'extracting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-3xl border border-white/10 p-12 mb-6"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <p className="text-text-muted text-lg">Extracting transcript from YouTube...</p>
              <p className="text-text-muted text-sm">Transcript is fetched server-side for reliability.</p>
            </div>
          </motion.div>
        )}

        {/* Success → Show Transcript Preview */}
        {transcriptState === 'success' && transcript && (
          <div className="mb-6">
            <TranscriptPreview
              segments={segments}
              transcript={transcript}
              videoMeta={videoMeta}
              videoId={videoId}
              onSubmit={handleSubmitToBackend}
              submitting={submitting}
              onCancel={() => resetTranscript()}
            />
          </div>
        )}

        {/* Error State */}
        {transcriptState === 'error' && (
          <div className="mb-6">
            <TranscriptErrorBoundary
              error={transcriptError}
              details={transcriptDetails}
              onRetry={handleRetryExtraction}
              onFallbackUpload={handleFallbackUpload}
            />
          </div>
        )}

        {/* Error message — always visible when set */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* UPLOAD FALLBACK UI */}
        {showUploadFallback() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl border border-white/10 p-8 mb-6"
          >
            <div className="text-center mb-6">
              <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-text-main mb-2">
                {transcriptState === 'error'
                  ? 'Transcript extraction failed'
                  : 'This video cannot be processed directly from YouTube.'}
              </h3>
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
                {(youtubeUrl || videoId) && (
                  <a
                    href={`https://youtube.com/watch?v=${videoId || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-4 rounded-xl bg-white/5 text-text-main hover:bg-white/10 text-sm font-bold transition-all flex items-center justify-center gap-2 border border-white/10"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Open Transcript Manually
                  </a>
                )}
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
                        onClick={handleUploadSubmit}
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

          </motion.div>
        )}

        {/* UPLOAD PROGRESS */}
        {submitState === 'uploading' && (
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

        {/* PROCESSING STAGES */}
        {submitState === 'processing' && (
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
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${i < processingStepIndex
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
                    <span className={`text-sm ${i <= processingStepIndex ? 'text-text-main font-medium' : 'text-text-muted'
                      }`}>
                      {stage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* SUCCESS RESULT */}
        {submitState === 'success' && result && (
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
                      Source: {result.source || 'YouTube'} &bull; Browser-extracted transcript
                    </p>
                  </div>
                </div>

                <div className="flex gap-1 mb-4 bg-white/5 rounded-xl p-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab
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

        {/* IDLE STATE */}
        {submitState === 'idle' && transcriptState === 'idle' && (
          <div className="glass rounded-3xl border border-white/10 p-6">
            <h3 className="font-bold text-text-main mb-4">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: 1, icon: <YoutubeIcon className="w-5 h-5" />, title: 'Paste URL', desc: 'Enter a YouTube video URL with Arabic speech' },
                { step: 2, icon: <Search className="w-5 h-5" />, title: 'Extract Transcript', desc: 'Transcript is extracted server-side with automatic fallback' },
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
