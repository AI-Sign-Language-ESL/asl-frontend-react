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
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraActive(true);
      // Give react-webcam a moment to attach the video element
      setTimeout(() => {
        if (webcamRef.current?.video) {
          setVideoEl(webcamRef.current.video);
        }
      }, 500);

      // Initialize WebSocket
      if (!wsRef.current) {
        wsRef.current = new TranslationWebSocket();
        
        wsRef.current.on('gloss_received', (data) => {
          setGloss(data.gloss);
          setIsTranslating(true); // show translating state while waiting for text
        });
        
        wsRef.current.on('translation_received', (data) => {
          setTranslation(data.text);
          addToHistory(data.gloss, data.text);
          speak(data.text);
          setIsTranslating(false);
        });
        
        wsRef.current.on('translation_error', (data) => {
          setError(data.error || 'Translation pipeline error');
          setIsTranslating(false);
        });

        wsRef.current.connect();
        // Send a start control message
        setTimeout(() => {
          if (wsRef.current) {
             wsRef.current.send({ action: "start", output_type: "text" });
          }
        }, 1000);
      }
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
        disabled={!mediaPipeReady && cameraActive} // Disable buttons while models load
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
