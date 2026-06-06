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
  const framesSinceLastPredict = useRef(15);
  const [videoEl, setVideoEl] = useState(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
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

  const startCamera = useCallback(async () => {
    setCameraError('');
    setError('');
    // Activate camera — react-webcam will call getUserMedia internally.
    // We must NOT call getUserMedia() ourselves first, because that would
    // lock the camera device (including virtual cameras like OBS/IruinCam)
    // and cause react-webcam to receive a black stream.
    setCameraActive(true);

    // Initialize WebSocket immediately (don't wait for video stream)
    if (!wsRef.current) {
      wsRef.current = new TranslationWebSocket();
      
      wsRef.current.on('gloss_received', (data) => {
        setGloss(data.gloss);
        setIsTranslating(true);
      });
      
      wsRef.current.on('translation_received', (data) => {
        setTranslation(data.text);
        addToHistory(data.gloss, data.text);
        speak(data.text);
        setIsTranslating(false);
      });
      
      wsRef.current.on('translation_error', (data) => {
        setError(data.message || data.error || 'Translation pipeline error');
        setIsTranslating(false);
      });

      let started = false;
      wsRef.current.on('connected', () => {
        if (!started) {
          started = true;
          wsRef.current.send({ action: "start", output_type: "text" });
        }
      });

      wsRef.current.connect();
    }
  }, [addToHistory]);

  const stopCamera = useCallback(() => {
    setCameraActive(false);
    setVideoEl(null);
    setGloss('');
    setTranslation('');
    setError('');
    setIsTranslating(false);
    framesSinceLastPredict.current = 0;
    clearBuffer();

    if (wsRef.current) {
      wsRef.current.send({ action: "stop" });
      setTimeout(() => {
        if (wsRef.current) {
          wsRef.current.disconnect();
          wsRef.current = null;
        }
      }, 500);
    }
  }, [clearBuffer]);

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
    setCameraActive(false);
  }, []);

  const sendSequenceToModal = async (sequence) => {
    if (!wsRef.current || !wsRef.current.isConnected) return;
    
    wsRef.current.send({
      action: "landmarks",
      sequence: sequence
    });
  };

  const captureLoop = useCallback(() => {
    if (!cameraActive || !videoEl || !mediaPipeReady) {
      return;
    }

    const timestamp = performance.now();
    const sequence = processFrame(timestamp);

    // If processFrame returns a sequence array of length 96, it's ready
    if (sequence && sequence.length === 96) {
      framesSinceLastPredict.current += 1;
      
      // Predict immediately on the first full buffer, or every 15 frames thereafter
      if (framesSinceLastPredict.current >= 15) {
        framesSinceLastPredict.current = 0;
        sendSequenceToModal(sequence);
      }
    }

    animationFrameRef.current = requestAnimationFrame(captureLoop);
  }, [cameraActive, videoEl, mediaPipeReady, processFrame, isTranslating]);

  useEffect(() => {
    if (mediaPipeError) {
      setError(mediaPipeError);
      toast.error(mediaPipeError);
    }
  }, [mediaPipeError]);

  useEffect(() => {
    if (cameraActive && videoEl && mediaPipeReady) {
      animationFrameRef.current = requestAnimationFrame(captureLoop);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraActive, videoEl, mediaPipeReady, captureLoop]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 lg:flex-row pb-6">
      <CameraPreview
        ref={webcamRef}
        isActive={cameraActive}
        error={cameraError || error}
        onStart={startCamera}
        onStop={stopCamera}
        onUserMedia={handleUserMedia}
        onUserMediaError={handleUserMediaError}
        disabled={!mediaPipeReady && cameraActive}
      />

      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        {!mediaPipeReady && cameraActive && !mediaPipeError && (
          <div className="text-xs text-blue-500 text-center bg-blue-500/10 py-1.5 px-3 rounded-full animate-pulse">
            Loading AI Models...
          </div>
        )}

        {isTranslating && (
          <div className="text-xs text-amber-500 text-center bg-amber-500/10 py-1.5 px-3 rounded-full animate-pulse">
            Predicting sequence...
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
