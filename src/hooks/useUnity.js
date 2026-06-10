import { useState, useRef, useCallback, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// useUnity(iframeRef)
//
// Manages communication between React and a Unity WebGL build hosted in an
// <iframe>.  The iframe's index.html MUST post a message to its parent when
// Unity finishes loading:
//
//   window.parent.postMessage({ type: 'unityReady' }, '*');
//
// It must also expose the instance:
//
//   window.unityInstance = unityInstance;   // inside createUnityInstance().then(...)
//
// This hook will:
//   1. Listen for that 'unityReady' message and flip unityReady → true.
//   2. Queue any sendMessage() calls that arrive before Unity is ready.
//   3. Flush the queue automatically once Unity is ready.
//   4. Send future messages immediately when Unity is already ready.
// ─────────────────────────────────────────────────────────────────────────────

export function useUnity(iframeRef) {
  const [unityReady, setUnityReady] = useState(false);

  // Use a ref so we can read the latest value inside callbacks without
  // re-creating them (avoids stale-closure bugs).
  const unityReadyRef = useRef(false);

  // Message queue – stored in a ref so it survives re-renders without
  // triggering them.
  const pendingMessages = useRef([]);

  // Guard against duplicate 'unityReady' events (e.g. HMR, fast refresh).
  const readyHandled = useRef(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Resolve the unityInstance from the iframe's contentWindow. */
  const resolveUnityInstance = useCallback(() => {
    try {
      const iframeWindow = iframeRef?.current?.contentWindow;
      if (iframeWindow?.unityInstance) {
        console.log('[useUnity] ✅ unityInstance resolved from iframe.contentWindow');
        return iframeWindow.unityInstance;
      }
    } catch (e) {
      // Cross-origin frames will throw; we fall through to window.unityInstance.
      console.warn('[useUnity] Could not access iframe.contentWindow (cross-origin?):', e.message);
    }

    if (window.unityInstance) {
      console.log('[useUnity] ✅ unityInstance resolved from window.unityInstance');
      return window.unityInstance;
    }

    console.error('[useUnity] ❌ unityInstance not found on iframe.contentWindow or window');
    return null;
  }, [iframeRef]);

  /** Immediately dispatch a SendMessage call to the Unity runtime. */
  const dispatchMessage = useCallback((gameObject, method, argument) => {
    const unityInstance = resolveUnityInstance();
    if (!unityInstance) return;

    console.log(
      `[useUnity] 📤 SendMessage → gameObject="${gameObject}" method="${method}" argument=${argument}`
    );
    try {
      unityInstance.SendMessage(gameObject, method, argument);
      console.log('[useUnity] ✅ SendMessage delivered successfully');
    } catch (err) {
      console.error('[useUnity] ❌ SendMessage threw an error:', err);
    }
  }, [resolveUnityInstance]);

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * sendMessage(gameObject, method, argument)
   *
   * Call this from anywhere in your React tree.
   * - If Unity is ready  → message is dispatched immediately.
   * - If Unity is NOT yet ready → message is added to the queue and will be
   *   flushed automatically when 'unityReady' is received.
   */
  const sendMessage = useCallback((gameObject, method, argument) => {
    const payload = { gameObject, method, argument };

    if (!unityReadyRef.current) {
      console.log(
        `[useUnity] ⏳ Unity NOT ready — queuing message (queue length after push: ${pendingMessages.current.length + 1}):`,
        payload
      );
      pendingMessages.current.push(payload);
      return;
    }

    dispatchMessage(gameObject, method, argument);
  }, [dispatchMessage]);

  /** Flush every message that was queued before Unity was ready. */
  const flushQueue = useCallback(() => {
    const queue = pendingMessages.current.splice(0); // drain atomically
    if (queue.length === 0) {
      console.log('[useUnity] 🔄 Flush called but queue is empty — nothing to send');
      return;
    }

    console.log(`[useUnity] 🚀 Flushing ${queue.length} queued message(s)…`);
    queue.forEach((msg, i) => {
      console.log(`[useUnity]   [${i + 1}/${queue.length}]`, msg);
      dispatchMessage(msg.gameObject, msg.method, msg.argument);
    });
    console.log('[useUnity] ✅ Queue flush complete');
  }, [dispatchMessage]);

  /** Reset the hook — useful when the iframe is reloaded. */
  const reset = useCallback(() => {
    console.log('[useUnity] 🔄 reset() called — clearing ready state and queue');
    readyHandled.current = false;
    unityReadyRef.current = false;
    setUnityReady(false);
    pendingMessages.current = [];
  }, []);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Listen for the 'unityReady' postMessage from the iframe.
  useEffect(() => {
    function handleMessage(event) {
      // ── Detailed logging for every incoming message ──
      // (remove or guard behind a debug flag in production)
      if (event.data && typeof event.data === 'object') {
        console.log('[useUnity] 📨 window message received:', event.data, 'origin:', event.origin);
      }

      if (!event.data || event.data.type !== 'unityReady') return;

      if (readyHandled.current) {
        console.log('[useUnity] ℹ️ unityReady already handled — ignoring duplicate');
        return;
      }

      readyHandled.current = true;
      unityReadyRef.current = true;

      console.log('[useUnity] 🎉 Received "unityReady" from iframe — setting unityReady = true');
      console.log(`[useUnity] 📋 Pending queue has ${pendingMessages.current.length} message(s)`);

      setUnityReady(true);
    }

    console.log('[useUnity] 👂 Attaching window "message" listener for unityReady signal');
    window.addEventListener('message', handleMessage);

    return () => {
      console.log('[useUnity] 🗑️ Removing window "message" listener');
      window.removeEventListener('message', handleMessage);
    };
  }, []); // intentionally empty — we only register once

  // When unityReady transitions to true, flush the pending queue.
  // NOTE: We intentionally do NOT include sendMessage in deps because we
  // read the queue via the ref and call dispatchMessage directly through
  // flushQueue — avoiding stale closure problems.
  useEffect(() => {
    if (unityReady) {
      console.log('[useUnity] 🔔 unityReady state is now TRUE — triggering queue flush');
      flushQueue();
    }
  }, [unityReady, flushQueue]);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    /** true once Unity has posted the 'unityReady' message */
    unityReady,
    /** Queue a message (auto-flushes when Unity loads) */
    sendMessage,
    /** Manually flush the queue (rarely needed) */
    flushQueue,
    /** Reset the hook — call this if the iframe is reloaded */
    reset,
  };
}
