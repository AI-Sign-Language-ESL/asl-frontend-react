import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import CameraPreview from '../components/CameraPreview';
import TranslationBox from '../components/TranslationBox';
import TranslationHistory from '../components/TranslationHistory';
import { speak } from '../utils/tts';
import { useMediaPipe } from '../hooks/useMediaPipe';
import { translationService } from '../services/api';

const HttpTranslationPage = () => {
  const webcamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const isAwaitingPredictionRef = useRef(false);
  const isTranslationActiveRef = useRef(false);
  const lastPredictionRef = useRef('');
  
  const TARGET_FPS = 30; // Must match the FPS used during model training
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

  const [videoEl, setVideoEl] = useState(null);

  // States: 'off', 'ready', 'collecting', 'predicting', 'cooldown', 'stopped', 'error'
  const [cameraState, setCameraState] = useState('off'); 
  const [frameCount, setFrameCount] = useState(0);

  const [gloss, setGloss] = useState('');
  const [translation, setTranslation] = useState('');
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');

  const { isReady: mediaPipeReady, error: mediaPipeError, processFrame, clearBuffer } = useMediaPipe(videoEl);

  const addToHistory = useCallback((glossText, translationText, confidence, latency) => {
    setHistory(prev => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        gloss: glossText,
        translation: translationText,
        confidence: confidence ? confidence.toFixed(2) : null,
        latency: latency ? `${latency}ms` : null,
      },
      ...prev,
    ].slice(0, 50));
  }, []);

  const toggleCamera = useCallback(async () => {
    if (cameraState !== 'off') {
      // Close Camera
      setCameraState('off');
      isTranslationActiveRef.current = false;
      setVideoEl(null);
      setGloss('');
      setTranslation('');
      setHistory([]);
      setError('');
      setCameraError('');
      setFrameCount(0);
      isAwaitingPredictionRef.current = false;
      lastPredictionRef.current = '';
      clearBuffer();
    } else {
      // Open Camera
      setCameraError('');
      setError('');
      setCameraState('ready');
      setFrameCount(0);
      isTranslationActiveRef.current = false;
    }
  }, [cameraState, clearBuffer]);

  const startTranslation = useCallback(() => {
    setGloss('');
    setTranslation('');
    setCameraState('collecting');
    setFrameCount(0);
    isTranslationActiveRef.current = true;
    isAwaitingPredictionRef.current = false;
    lastPredictionRef.current = '';
    clearBuffer();
  }, [clearBuffer]);

  const stopTranslation = useCallback(async () => {
    setCameraState('stopped');
    isTranslationActiveRef.current = false;
    isAwaitingPredictionRef.current = false;
    setFrameCount(0);
    
    // Process the accumulated gloss session
    setGloss(currentGloss => {
      if (!currentGloss) return currentGloss;
      
      const words = currentGloss.split(' ').filter(w => w.trim());
      
      if (words.length === 1) {
        setTranslation(currentGloss);
        addToHistory(currentGloss, currentGloss, null, null);
        speak(currentGloss);
      } else if (words.length >= 2) {
        setCameraState('predicting');
        translationService.translateGloss(currentGloss)
          .then(res => {
            const naturalSentence = res.data.text || currentGloss;
            setTranslation(naturalSentence);
            addToHistory(currentGloss, naturalSentence, null, null);
            speak(naturalSentence);
          })
          .catch(err => {
            console.error("NLP error:", err);
            toast.error("Failed to translate to natural sentence.");
            setTranslation(currentGloss); // fallback
            addToHistory(currentGloss, currentGloss, null, null);
          })
          .finally(() => {
            setCameraState('stopped');
          });
      }
      return currentGloss;
    });
  }, [addToHistory]);

  const clearTranslation = useCallback(() => {
    setTranslation('');
    setGloss('');
    setFrameCount(0);
    lastPredictionRef.current = '';
    clearBuffer();
  }, [clearBuffer]);

  const handleUserMedia = useCallback(() => {
    setTimeout(() => {
      if (webcamRef.current?.video) {
        setVideoEl(webcamRef.current.video);
      }
    }, 100);
  }, []);

  const handleUserMediaError = useCallback((err) => {
    const msg = err.name === 'NotAllowedError'
      ? 'Camera access denied. Please allow camera permissions.'
      : err.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : `Could not start camera: ${err.message || err}`;
    setCameraError(msg);
    toast.error(msg);
    setCameraState('error');
  }, []);

  const sendSequenceToHttp = async (sequence) => {
    if (!isTranslationActiveRef.current) return;

    try {
      const response = await translationService.predictModal(sequence);
      const { prediction, confidence } = response.data;

      // Duplicate prevention logic
      const isDuplicate = lastPredictionRef.current === prediction;
      if (isDuplicate && confidence < 0.6) {
        toast(`Ignored duplicate low-confidence prediction: ${prediction}`, { icon: '⚠️' });
      } else {
        if (prediction && prediction !== 'NO_SIGN') {
          setGloss(prev => prev ? `${prev} ${prediction}` : prediction);
          lastPredictionRef.current = prediction;
        }
      }
    } catch (err) {
      console.error("HTTP translation error:", err);
      const errMsg = err.response?.data?.error || err.message || 'HTTP Request failed';
      setError(errMsg);
      toast.error(`Prediction failed: ${errMsg}`);
    } finally {
      setFrameCount(0);
      
      if (isTranslationActiveRef.current) {
        setCameraState('cooldown');
        setTimeout(() => {
          if (isTranslationActiveRef.current) {
            isAwaitingPredictionRef.current = false;
            setCameraState('collecting');
          }
        }, 1500); // 1.5 seconds cooldown
      } else {
        isAwaitingPredictionRef.current = false;
      }
    }
  };

  const captureLoop = useCallback(() => {
    const isCameraActive = videoEl && mediaPipeReady;
    if (!isCameraActive) return;

    const timestamp = performance.now();
    
    if (timestamp - lastFrameTimeRef.current < FRAME_INTERVAL) {
      animationFrameRef.current = requestAnimationFrame(captureLoop);
      return;
    }
    lastFrameTimeRef.current = timestamp;

    const result = processFrame(timestamp);
    
    if (result && isTranslationActiveRef.current) {
      const { sequence, length } = result;

      if (!isAwaitingPredictionRef.current && cameraState === 'collecting') {
        setFrameCount(length);

        if (length === 96 && sequence && sequence.length === 96) {
          isAwaitingPredictionRef.current = true;
          setCameraState('predicting');
          sendSequenceToHttp(sequence);
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(captureLoop);
  }, [videoEl, mediaPipeReady, processFrame, FRAME_INTERVAL, cameraState, sendSequenceToHttp]);

  useEffect(() => {
    if (mediaPipeError) {
      setError(mediaPipeError);
      toast.error(mediaPipeError);
    }
  }, [mediaPipeError]);

  useEffect(() => {
    if (cameraState !== 'off' && videoEl && mediaPipeReady) {
      animationFrameRef.current = requestAnimationFrame(captureLoop);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraState, videoEl, mediaPipeReady, captureLoop]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 lg:flex-row pb-6">
      <div className="flex-1 flex flex-col gap-4">
        <CameraPreview
          ref={webcamRef}
          cameraState={cameraState === 'cooldown' ? 'predicting' : cameraState}
          error={cameraError || error}
          onToggleCamera={toggleCamera}
          onStartTranslation={startTranslation}
          onStopTranslation={stopTranslation}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          disabled={!mediaPipeReady && cameraState !== 'off'}
        />
        
        {cameraState !== 'off' && (
          <div className="glass p-4 rounded-2xl flex items-center justify-between border border-border-subtle shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm text-text-muted font-medium">HTTP Status</span>
              <span className="text-lg font-semibold text-primary capitalize">
                {cameraState === 'cooldown' ? 'Cooldown (1.5s)' : cameraState}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm text-text-muted font-medium">Frame Buffer</span>
              <span className="text-lg font-mono font-bold text-text-main">
                {frameCount} / 96
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        {!mediaPipeReady && cameraState !== 'off' && !mediaPipeError && (
          <div className="text-xs text-blue-500 text-center bg-blue-500/10 py-1.5 px-3 rounded-full animate-pulse">
            Loading AI Models...
          </div>
        )}

        <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">HTTP Translation</h2>
            <button
              onClick={clearTranslation}
              disabled={cameraState === 'off'}
              className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
        </div>

        <TranslationBox
          gloss={gloss}
          translation={translation}
          isTranslating={cameraState === 'predicting'}
          error={error}
          onSpeak={speak}
        />

        <TranslationHistory history={history} onSpeak={speak} />
      </div>
    </div>
  );
};

export default HttpTranslationPage;
