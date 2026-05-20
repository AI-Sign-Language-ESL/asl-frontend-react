import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, AlertCircle, Mic, MicOff, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { unityService } from '../services/api';
import ErrorBoundary from '../components/ErrorBoundary';
import classNames from 'classnames';

const Generator = () => {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unityAnimations, setUnityAnimations] = useState([]);
  const [unitySource, setUnitySource] = useState('');

  // Speech-to-text states
  const [speechListening, setSpeechListening] = useState(false);
  const speechRecognitionRef = useRef(null);
  const speechTranscriptRef = useRef("");
  const speechRestartTimeoutRef = useRef(null);
  const unityIframeRef = useRef(null);
  const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const handleUnityGenerate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError('');
    setUnityAnimations([]);
    setUnitySource('');

    try {

      // =====================================
      // CALL DJANGO
      // =====================================

      const response = await fetch(
        "https://api.tafahom.io/api/v1/translation/unity-sign/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: inputText,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "DJANGO RESPONSE:",
        data
      );

      // =====================================
      // CHECK UNITY & SYNC
      // =====================================

      const unityWindow =
        unityIframeRef.current?.contentWindow;

      if (unityWindow && unityWindow.unityInstance) {
        window.unityInstance = unityWindow.unityInstance;
      }

      // =====================================
      // SEND ANIMATIONS TO UNITY
      // =====================================

      if (
        data.animations &&
        data.animations.length > 0
      ) {
        setUnityAnimations(data.animations);
        setUnitySource(data.source || 'django');

        if (window.unityInstance)
        {
            console.log(
                "SENDING TO UNITY:",
                data.animations
            );

            window.unityInstance.SendMessage(
                "tpose",
                "ReceiveAnimations",
                JSON.stringify(
                    data.animations
                )
            );
        }
        else
        {
            console.error(
                "UNITY INSTANCE NOT READY"
            );
        }
      }

    } catch (err) {

      console.error(
        "UNITY GENERATE ERROR:",
        err
      );
      setError(err.message || 'Unity generation failed');

    } finally {
      setLoading(false);
    }
  };

  // Speech-to-text functions
  const isArabic = (text) => /[\u0600-\u06FF]/.test(text);

  const createRecognition = (lang) => {
    if (!SpeechRecognition) return null;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        speechTranscriptRef.current += finalTranscript;
      }

      const fullText = speechTranscriptRef.current + interimTranscript;
      setInputText(fullText);

      if (finalTranscript) {
        const newLang = isArabic(finalTranscript) ? "ar-EG" : "en-US";
        if (recognition.lang !== newLang) {
          clearTimeout(speechRestartTimeoutRef.current);
          speechRestartTimeoutRef.current = setTimeout(() => restartSpeechRecognition(newLang), 500);
        }
      }
    };

    recognition.onerror = (e) => {
      if (e.error === "not-allowed") setSpeechListening(false);
    };

    return recognition;
  };

  const startSpeechListening = () => {
    if (!SpeechRecognition) return;
    speechTranscriptRef.current = "";
    setInputText("");
    const rec = createRecognition("en-US");
    if (rec) {
      rec.start();
      speechRecognitionRef.current = rec;
      setSpeechListening(true);
    }
  };

  const stopSpeechListening = () => {
    speechRecognitionRef.current?.stop();
    speechRecognitionRef.current = null;
    clearTimeout(speechRestartTimeoutRef.current);
    setSpeechListening(false);
    speechTranscriptRef.current = inputText;
  };

  const restartSpeechRecognition = (lang) => {
    if (!speechListening) return;
    speechRecognitionRef.current?.stop();
    setTimeout(() => {
      const rec = createRecognition(lang);
      if (rec) {
        rec.start();
        speechRecognitionRef.current = rec;
      }
    }, 300);
  };

  useEffect(() => {
    return () => {
      speechRecognitionRef.current?.stop();
      clearTimeout(speechRestartTimeoutRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 max-w-5xl mx-auto w-full pb-6">

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Input Area */}
      <div className="glass p-4 rounded-3xl flex gap-3 border border-border-subtle items-center drop-shadow-xl relative z-10">
        {SpeechRecognition && (
          <button
            onClick={speechListening ? stopSpeechListening : startSpeechListening}
            className={classNames(
              "p-3 rounded-full transition-colors group",
              speechListening ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-bg-card hover:bg-bg-card/80 text-text-main"
            )}
            title={speechListening ? "Stop speech recognition" : "Start speech recognition"}
          >
            {speechListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />}
          </button>
        )}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUnityGenerate()}
          placeholder={speechListening ? "Listening..." : "Enter text to translate into sign language..."}
          disabled={loading}
          className="flex-1 bg-transparent outline-none text-text-main placeholder:text-text-muted/50 text-lg disabled:opacity-50"
        />
        <button
          onClick={handleUnityGenerate}
          disabled={loading || !inputText.trim()}
          className="px-6 py-3 bg-primary hover:bg-secondary text-white rounded-full font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>Generate</span>
        </button>
        <button
          onClick={handleUnityGenerate}
          disabled={loading || !inputText.trim()}
          title="Send to Unity sign matcher"
          className={classNames(
            "p-3 rounded-full transition-colors",
            unityAnimations.length
              ? "bg-green-500/20 text-green-500"
              : "bg-bg-card hover:bg-bg-card/80 text-text-muted hover:text-primary"
          )}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Gamepad2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Unity Animation Results */}
      {unityAnimations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-4 rounded-2xl border border-border-subtle"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted uppercase tracking-wider font-medium">
              Unity Animations {unitySource && `(${unitySource})`}
            </span>
            <span className="text-xs text-text-muted">{unityAnimations.length} clips</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unityAnimations.map((name, i) => (
              <span
                key={i}
                className="px-3 py-1.5 text-sm rounded-lg bg-primary/10 text-primary font-medium"
              >
                {name}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* 3D Canvas Area */}
      <div className="flex-1 glass rounded-3xl border border-border-subtle relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        <div className="flex-1 w-full relative" style={{ minHeight: '500px' }}>
          <iframe
            ref={unityIframeRef}
            src="/unity/index.html"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            title="Unity Avatar"
            allow="autoplay; fullscreen"
          />


        </div>
      </div>

    </div>
  );
};

export default Generator;