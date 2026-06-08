import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import CameraPreview from '../components/CameraPreview';
import TranslationBox from '../components/TranslationBox';
import TranslationHistory from '../components/TranslationHistory';
import { speak } from '../utils/tts';
import { useMediaPipe } from '../hooks/useMediaPipe';
import TranslationWebSocket from '../services/translationWebSocket';

const SignTranslationPage = () => {
  const webcamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const framesSinceLastPredict = useRef(0); // start at 0 — wait for WS to be ready first
  const lastFrameTimeRef = useRef(0);
  const isAwaitingPredictionRef = useRef(false);
  const heartbeatIntervalRef = useRef(null);
  const TARGET_FPS = 30; // IMPORTANT: Must match the FPS used during model training
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

  const [videoEl, setVideoEl] = useState(null);

  const [cameraState, setCameraState] = useState('off'); // 'off', 'ready', 'collecting', 'predicting', 'active', 'stopped'
  const isTranslationActiveRef = useRef(false);

  const [gloss, setGloss] = useState('');
  const [translation, setTranslation] = useState('');
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  
  const wsRef = useRef(null);

  const { isReady: mediaPipeReady, error: mediaPipeError, processFrame, clearBuffer } = useMediaPipe(videoEl);

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
      isAwaitingPredictionRef.current = false;
      framesSinceLastPredict.current = 0;
      clearBuffer();

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    } else {
      // Open Camera
      setCameraError('');
      setError('');
      setCameraState('ready');
      isTranslationActiveRef.current = false;
    }
  }, [cameraState, clearBuffer]);

  const startTranslation = useCallback(() => {
    setGloss('');
    setTranslation('');
    setHistory([]);
    setCameraState('collecting');
    isTranslationActiveRef.current = true;
    clearBuffer();

    if (!wsRef.current) {
      wsRef.current = new TranslationWebSocket();
      
      wsRef.current.on('gloss_received', (data) => {
        setGloss(data.gloss);
      });
      
      wsRef.current.on('translation_received', (data) => {
        if (data.gloss === 'NO_SIGN') {
          setTranslation('No Sign Detected');
          setGloss('');
        } else {
          setTranslation(data.text);
          addToHistory(data.gloss, data.text);
          speak(data.text);
        }
        clearBuffer();
        framesSinceLastPredict.current = 0;
        isAwaitingPredictionRef.current = false;
        setCameraState(prev => (prev !== 'off' && prev !== 'stopped') ? 'collecting' : prev);
      });
      
      wsRef.current.on('translation_error', (data) => {
        setError(data.message || data.error || 'Translation pipeline error');
        clearBuffer();
        framesSinceLastPredict.current = 0;
        isAwaitingPredictionRef.current = false;
        setCameraState(prev => (prev !== 'off' && prev !== 'stopped') ? 'collecting' : prev);
      });

      const wsSentStartRef = { current: false };

      wsRef.current.on('connected', () => {
        wsSentStartRef.current = true;
        isAwaitingPredictionRef.current = false;
        framesSinceLastPredict.current = 0;
        wsRef.current.send({ action: "start", output_type: "text" });

        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.isConnected) {
            wsRef.current.send({ type: 'ping' });
          }
        }, 20000);
      });

      wsRef.current.on('disconnected', () => {
        isAwaitingPredictionRef.current = false;
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      });

      wsRef.current.connect();
    }
  }, [addToHistory, clearBuffer]);

  const stopTranslation = useCallback(() => {
    setCameraState('stopped');
    isTranslationActiveRef.current = false;
    isAwaitingPredictionRef.current = false;
    framesSinceLastPredict.current = 0;

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.send({ action: "stop" });
      wsRef.current.disconnect();
      wsRef.current = null;
    }
  }, []);

  // Called by CameraPreview's Webcam component when the stream is actually ready.
  // This guarantees videoEl is the live <video> element, not a black placeholder.
  const handleUserMedia = useCallback(() => {
    setTimeout(() => {
      if (webcamRef.current?.video) {
        setVideoEl(webcamRef.current.video);
      }
    }, 100);
  }, []);

  // Called when the user's browser blocks camera permission.
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

  const sendSequenceToModal = async (sequence) => {
    if (!wsRef.current || !wsRef.current.isConnected) return;

    // --- Frontend diagnostic: log sequence stats before transmission ---
    // Compare these numbers with the backend's sequence_diagnostic log.
    // If they match, the data is correct at source. If backend numbers differ,
    // the data is corrupted in transit (JSON serialization issue, packet loss).
    if (process.env.NODE_ENV !== 'production') {
      const flat = sequence.flat(2);
      const nonZero = flat.filter(v => v !== 0).length;
      const mean = flat.reduce((a, b) => a + b, 0) / flat.length;
      const std = Math.sqrt(flat.reduce((a, b) => a + (b - mean) ** 2, 0) / flat.length);
      const frameZeros = sequence.filter(frame =>
        frame.every(landmark => landmark.every(v => v === 0))
      ).length;
      console.info(
        '[sendSeq] shape=(%d,27,3) | zero_frames=%d | non_zero=%d | mean=%.4f | std=%.4f',
        sequence.length, frameZeros, nonZero, mean, std
      );
      // Expected (healthy detection): zero_frames < 20, mean ≈ 0.3-0.6, std ≈ 0.1-0.3
      // Problem signs: zero_frames > 50 → MediaPipe not detecting
      //                mean ≈ 0, std ≈ 0  → all-zero input, model will output dominant class
    }
    
    wsRef.current.send({
      action: "landmarks",
      sequence: sequence
    });
  };

  const captureLoop = useCallback(() => {
    const isCameraActive = videoEl && mediaPipeReady; // Don't rely on cameraState closure
    if (!isCameraActive) {
      return;
    }

    const timestamp = performance.now();
    
    if (timestamp - lastFrameTimeRef.current < FRAME_INTERVAL) {
      animationFrameRef.current = requestAnimationFrame(captureLoop);
      return;
    }
    lastFrameTimeRef.current = timestamp;

    const result = processFrame(timestamp);
    
    if (result && isTranslationActiveRef.current) {
      const { sequence, length } = result;

      if (length < 96) {
        setCameraState(prev => (prev !== 'off' && prev !== 'collecting') ? 'collecting' : prev);
      } else if (sequence && sequence.length === 96) {
        if (!isAwaitingPredictionRef.current) {
          isAwaitingPredictionRef.current = true;
          setCameraState(prev => (prev !== 'off' && prev !== 'stopped') ? 'predicting' : prev);
          sendSequenceToModal(sequence);
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(captureLoop);
  }, [videoEl, mediaPipeReady, processFrame, FRAME_INTERVAL]);

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
      <CameraPreview
        ref={webcamRef}
        cameraState={cameraState}
        error={cameraError || error}
        onToggleCamera={toggleCamera}
        onStartTranslation={startTranslation}
        onStopTranslation={stopTranslation}
        onUserMedia={handleUserMedia}
        onUserMediaError={handleUserMediaError}
        disabled={!mediaPipeReady && cameraState !== 'off'}
      />

      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        {!mediaPipeReady && cameraState !== 'off' && !mediaPipeError && (
          <div className="text-xs text-blue-500 text-center bg-blue-500/10 py-1.5 px-3 rounded-full animate-pulse">
            Loading AI Models...
          </div>
        )}

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

export default SignTranslationPage;
