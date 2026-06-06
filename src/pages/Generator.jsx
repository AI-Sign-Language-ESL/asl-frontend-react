import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, AlertCircle, Mic, MicOff, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { unityService } from '../services/api';
import ErrorBoundary from '../components/ErrorBoundary';
import { useUnity } from '../hooks/useUnity';
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
  const unityIframeRef = useRef(null);
  const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const { unityReady, sendMessage } = useUnity(unityIframeRef);

  const handleUnityGenerate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError('');
    setUnityAnimations([]);
    setUnitySource('');

    try {

      const response = await unityService.generateSign(inputText);
      const data = response.data;

      console.log(
        "DJANGO RESPONSE:",
        data
      );

      // =====================================
      // SEND ANIMATIONS TO UNITY
      // =====================================

      if (
        data.animations &&
        data.animations.length > 0
      ) {
        setUnityAnimations(data.animations);
        setUnitySource(data.source || 'django');

        console.log(
            "Unity Ready:", unityReady,
            "Sending message:", data.animations
        );

        sendMessage(
            "tpose",
            "ReceiveAnimations",
            JSON.stringify(
                data.animations
            )
        );
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
  const toggleSpeechRecognition = () => {
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in your browser. Please try using Chrome or Edge.");
      return;
    }

    if (speechListening) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setSpeechListening(false);
      return;
    }

    setError('');
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG';
      recognition.continuous = true;
      recognition.interimResults = true;

      const initialText = inputText.trim() ? inputText.trim() + " " : "";
      speechTranscriptRef.current = initialText;

      recognition.onstart = () => {
        setSpeechListening(true);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          speechTranscriptRef.current += finalTranscript + " ";
        }

        setInputText(speechTranscriptRef.current + interimTranscript);
      };

      recognition.onerror = (event) => {
        setSpeechListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Microphone access was denied. Please allow microphone permissions.');
        } else if (event.error !== 'no-speech') {
          setError(`Speech recognition failed: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setSpeechListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setError('Could not start speech recognition.');
      setSpeechListening(false);
    }
  };

  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
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
        <button
          onClick={toggleSpeechRecognition}
          className={classNames(
            "p-3 rounded-full transition-colors group relative",
            speechListening ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-bg-card hover:bg-bg-card/80 text-text-main"
          )}
          title={speechListening ? "Stop speech recognition" : "Start speech recognition"}
        >
          {speechListening ? (
            <>
              <MicOff className="w-5 h-5 relative z-10" />
              <span className="absolute inset-0 rounded-full animate-ping bg-red-500/40"></span>
            </>
          ) : (
            <Mic className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
          )}
        </button>
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