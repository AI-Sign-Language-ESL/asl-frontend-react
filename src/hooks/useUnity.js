import { useState, useRef, useCallback, useEffect } from 'react';

export function useUnity(iframeRef) {
  const [unityReady, setUnityReady] = useState(false);
  const pendingMessages = useRef([]);
  const readyHandled = useRef(false);

  useEffect(() => {
    function handleMessage(event) {
      if (event.data && event.data.type === 'unityReady') {
        if (readyHandled.current) return;
        readyHandled.current = true;
        console.log('[useUnity] Received unityReady from iframe');
        setUnityReady(true);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const sendMessage = useCallback((gameObject, method, argument) => {
    const payload = { gameObject, method, argument };

    if (!unityReady) {
      console.log('[useUnity] Unity NOT ready — queuing message:', payload);
      pendingMessages.current.push(payload);
      return;
    }

    console.log('[useUnity] Sending message:', payload);
    try {
      const unityWindow = iframeRef?.current?.contentWindow;
      if (unityWindow && unityWindow.unityInstance) {
        window.unityInstance = unityWindow.unityInstance;
      }
      if (window.unityInstance) {
        window.unityInstance.SendMessage(gameObject, method, argument);
        console.log('[useUnity] Message sent successfully');
      } else {
        console.error('[useUnity] unityInstance not found even though ready');
      }
    } catch (err) {
      console.error('[useUnity] SendMessage failed:', err);
    }
  }, [unityReady, iframeRef]);

  useEffect(() => {
    if (unityReady && pendingMessages.current.length > 0) {
      const queue = pendingMessages.current.splice(0);
      console.log(`[useUnity] Flushing ${queue.length} queued messages`);
      queue.forEach((msg) => {
        sendMessage(msg.gameObject, msg.method, msg.argument);
      });
    }
  }, [unityReady, sendMessage]);

  const reset = useCallback(() => {
    readyHandled.current = false;
    setUnityReady(false);
    pendingMessages.current = [];
  }, []);

  return { unityReady, sendMessage, reset };
}
