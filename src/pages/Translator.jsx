import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import { Volume2, Power, History, Activity, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { translatorService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const dataURLtoBlob = (dataurl) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
};

const Translator = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState([]);
  const [currentTextKey, setCurrentTextKey] = useState("translator.waiting");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const webcamRef = useRef(null);

  const captureAndSend = async (videoBlob) => {
    setLoading(true);
    setError('');
    try {
      const response = await translatorService.translate(videoBlob);
      const { text, confidence } = response.data;
      setCurrentTextKey(text);
      setLogs(prev => [
        { time: new Date().toLocaleTimeString(), sign: text, confidence },
        ...prev
      ].slice(0, 15));
    } catch (err) {
      setError(err.response?.data?.message || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (isActive && webcamRef.current) {
      setCurrentTextKey("translator.translating");
      interval = setInterval(() => {
        if (webcamRef.current) {
          const screenshot = webcamRef.current.getScreenshot();
          if (screenshot) {
            const blob = dataURLtoBlob(screenshot);
            captureAndSend(blob);
          }
        }
      }, 3000);
    } else {
      setCurrentTextKey("translator.waiting");
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 lg:flex-row pb-6">
      
      {/* LEFT: Camera Area */}
      <div className="flex-1 glass rounded-3xl overflow-hidden flex flex-col relative border border-border-subtle">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-bg-card/50">
          <div className="flex items-center gap-3">
            <div className={classNames("w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]", isActive ? "bg-success text-success animate-pulse" : "bg-text-muted text-text-muted")} />
            <span className="font-semibold text-sm tracking-wide text-text-main">
              {isActive ? t('translator.active') : t('translator.offline')}
            </span>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          </div>
          <button 
            onClick={() => setIsActive(!isActive)}
            disabled={!isAuthenticated}
            className={classNames(
              "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all",
              !isAuthenticated && "opacity-50 cursor-not-allowed",
              isActive ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-primary text-white hover:bg-secondary shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            )}
          >
            <Power className="w-4 h-4" />
            {isActive ? t('translator.stop') : t('translator.start')}
          </button>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {isActive ? (
            <>
              <Webcam 
                ref={webcamRef}
                audio={false} 
                className="w-full h-full object-cover opacity-80"
                mirrored={true}
              />
              
              {/* Scanning Overlay */}
              <motion.div 
                animate={{ y: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-primary/20 to-transparent border-b border-primary/50 pointer-events-none"
              />

              {/* Hand Tracking Points (Mock) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
                <motion.circle cx="30%" cy="50%" r="4" fill="#60A5FA" animate={{ r: [3,6,3] }} transition={{ repeat: Infinity, duration: 1 }} />
                <motion.circle cx="32%" cy="45%" r="4" fill="#60A5FA" animate={{ r: [3,6,3] }} transition={{ repeat: Infinity, duration: 1.2 }} />
                <motion.circle cx="28%" cy="55%" r="4" fill="#60A5FA" animate={{ r: [3,6,3] }} transition={{ repeat: Infinity, duration: 0.8 }} />
                <line x1="30%" y1="50%" x2="32%" y2="45%" stroke="#3B82F6" strokeWidth="1.5" />
                <line x1="30%" y1="50%" x2="28%" y2="55%" stroke="#3B82F6" strokeWidth="1.5" />
              </svg>

              {/* Corner brackets */}
              <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-white/20 rounded-tl-xl" />
              <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-white/20 rounded-tr-xl" />
              <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-white/20 rounded-bl-xl" />
              <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-white/20 rounded-br-xl" />
            </>
          ) : (
            <div className="text-text-muted flex flex-col items-center gap-4">
              <Activity className="w-16 h-16 opacity-20" />
              <p>{t('translator.cam_off')}</p>
              {!isAuthenticated && (
                <a href="/login" className="text-primary hover:underline text-sm">Sign in to translate</a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Output & Logs */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        
        {/* Output Panel */}
        <div className="glass p-6 rounded-3xl border border-border-subtle flex flex-col relative overflow-hidden group">
          <div className="absolute -inset-2 bg-gradient-to-r from-primary/10 to-secondary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex justify-between items-start mb-6 z-10">
            <h3 className="font-semibold text-text-muted text-sm uppercase tracking-wider">{t('translator.live')}</h3>
            <button
              onClick={() => !currentTextKey.startsWith('translator.') && handleSpeak(currentTextKey)}
              className="p-2 rounded-full bg-bg-card hover:bg-bg-card/80 text-text-main transition-colors cursor-pointer group/btn disabled:opacity-50"
              disabled={currentTextKey.startsWith('translator.')}
            >
              <Volume2 className="w-5 h-5 group-hover/btn:text-primary transition-colors" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[120px] z-10">
            <AnimatePresence mode="wait">
              <motion.p 
                key={currentTextKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={classNames(
                  "text-3xl font-bold text-center",
                  isActive ? "text-text-main" : "text-text-muted"
                )}
              >
                {currentTextKey.startsWith('translator.') ? t(currentTextKey) : currentTextKey}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Logs Panel */}
        <div className="glass rounded-3xl border border-border-subtle flex-1 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border-subtle flex items-center gap-2 bg-bg-card/50">
            <History className="w-4 h-4 text-text-muted" />
            <span className="font-semibold text-sm text-text-main">{t('translator.log')}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                {t('translator.no_detect')}
              </div>
            ) : (
              logs.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-bg-card transition-colors text-sm"
                >
                  <div className="flex items-center gap-3 text-text-main">
                    <span className="text-text-muted text-xs font-mono">{log.time}</span>
                    <span className="font-medium">{log.sign}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-success">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="font-mono text-xs">{log.confidence}%</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Translator;