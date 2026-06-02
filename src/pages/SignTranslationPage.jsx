import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import CameraPreview from '../components/CameraPreview';
import TranslationBox from '../components/TranslationBox';
import TranslationHistory from '../components/TranslationHistory';
import TranslationWebSocket from '../services/translationWebSocket';

const SignTranslationPage = () => {
  const webcamRef = useRef(null);
  const wsRef = useRef(null);
  const frameIntervalRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [gloss, setGloss] = useState('');
  const [translation, setTranslation] = useState('');
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [isReconnecting, setIsReconnecting] = useState(false);

  const speak = useCallback((text) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const addToHistory = useCallback((glossText, translationText) => {
    setHistory(prev => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        gloss: glossText,
        translation: translationText,
      },
      ...prev,
    ].slice(0, 50));
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    setError('');
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraActive(true);
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera access denied. Please allow camera permissions.'
        : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : `Could not start camera: ${err.message}`;
      setCameraError(msg);
      toast.error(msg);
    }
  }, []);

  const stopCamera = useCallback(() => {
    setCameraActive(false);
    setGloss('');
    setTranslation('');
    setError('');
    setIsTranslating(false);
  }, []);

  const connectWebSocket = useCallback(() => {
    wsRef.current = new TranslationWebSocket();

    const unsubConnected = wsRef.current.on('connected', () => {
      setWsConnected(true);
      setIsReconnecting(false);
    });

    const unsubDisconnected = wsRef.current.on('disconnected', () => {
      setWsConnected(false);
    });

    const unsubReconnecting = wsRef.current.on('reconnecting', ({ attempt, maxRetries }) => {
      setIsReconnecting(true);
      toast(`Reconnecting... (${attempt}/${maxRetries})`, { id: 'ws-reconnect' });
    });

    const unsubTranslationStarted = wsRef.current.on('translation_started', () => {
      setIsTranslating(true);
      setError('');
      setGloss('');
      setTranslation('');
    });

    const unsubGlossReceived = wsRef.current.on('gloss_received', (data) => {
      setGloss(data.gloss || data.text || '');
    });

    const unsubTranslationReceived = wsRef.current.on('translation_received', (data) => {
      const text = data.translation || data.text || '';
      const glossText = data.gloss || '';
      setIsTranslating(false);
      setTranslation(text);
      setGloss(glossText);
      addToHistory(glossText, text);
      speak(text);
    });

    const unsubError = wsRef.current.on('translation_error', (data) => {
      const msg = data.message || data.detail || 'Translation failed';
      setIsTranslating(false);
      setError(msg);
      toast.error(msg);
    });

    const unsubSocketError = wsRef.current.on('error', (err) => {
      if (err?.message?.includes('No authentication token')) {
        toast.error('Please sign in to use real-time translation');
      } else if (err?.message?.includes('Max reconnection')) {
        setIsReconnecting(false);
        toast.error('Connection lost. Please restart.');
      }
    });

    wsRef.current.connect();

    return () => {
      unsubConnected();
      unsubDisconnected();
      unsubReconnecting();
      unsubTranslationStarted();
      unsubGlossReceived();
      unsubTranslationReceived();
      unsubError();
      unsubSocketError();
      wsRef.current?.disconnect();
      wsRef.current = null;
    };
  }, [addToHistory, speak]);

  const startFrameCapture = useCallback(() => {
    if (frameIntervalRef.current) return;

    frameIntervalRef.current = setInterval(() => {
      if (webcamRef.current && wsRef.current?.isConnected) {
        const screenshot = webcamRef.current.getScreenshot();
        if (screenshot) {
          wsRef.current.send({ type: 'frame', data: screenshot });
        }
      }
    }, 2000);
  }, []);

  const stopFrameCapture = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!cameraActive) {
      stopFrameCapture();
      return;
    }
    const cleanup = connectWebSocket();
    startFrameCapture();
    return () => {
      cleanup();
      stopFrameCapture();
      setIsTranslating(false);
      setIsReconnecting(false);
    };
  }, [cameraActive, connectWebSocket, startFrameCapture, stopFrameCapture]);

  const handleStart = useCallback(() => {
    startCamera();
  }, [startCamera]);

  const handleStop = useCallback(() => {
    stopCamera();
  }, [stopCamera]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 lg:flex-row pb-6">
      <CameraPreview
        ref={webcamRef}
        isActive={cameraActive}
        error={cameraError}
        onStart={handleStart}
        onStop={handleStop}
      />

      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        {isReconnecting && (
          <div className="text-xs text-amber-500 text-center bg-amber-500/10 py-1.5 px-3 rounded-full">
            Reconnecting...
          </div>
        )}

        <TranslationBox
          gloss={gloss}
          translation={translation}
          isTranslating={isTranslating}
          error={error}
          onSpeak={speak}
        />

        <TranslationHistory history={history} onSpeak={speak} />
      </div>
    </div>
  );
};

export default SignTranslationPage;
