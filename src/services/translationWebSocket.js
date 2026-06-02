const WS_URL = import.meta.env.VITE_WS_URL || 'wss://api.tafahom.io';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;

class TranslationWebSocket {
  constructor() {
    this.ws = null;
    this.retryCount = 0;
    this.retryDelay = INITIAL_RETRY_DELAY;
    this.retryTimer = null;
    this.isConnected = false;
    this.isDestroyed = false;
    this.listeners = {};
  }

  connect() {
    if (this.isDestroyed) return;

    const token = localStorage.getItem('token');
    if (!token) {
      this._emit('error', new Error('No authentication token found'));
      return;
    }

    try {
      this.ws = new WebSocket(`${WS_URL}/ws/translation/stream?token=${token}`);
    } catch (err) {
      this._emit('error', err);
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.isConnected = true;
      this.retryCount = 0;
      this.retryDelay = INITIAL_RETRY_DELAY;
      this._emit('connected');
    };

    this.ws.onclose = (event) => {
      this.isConnected = false;
      this.ws = null;
      if (event.code !== 1000 && !this.isDestroyed) {
        this._emit('disconnected');
        this._scheduleReconnect();
      }
    };

    this.ws.onerror = () => {};

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type } = data;

        switch (type) {
          case 'translation_started':
            this._emit('translation_started', data.data);
            break;
          case 'gloss_received':
            this._emit('gloss_received', data.data);
            break;
          case 'translation_received':
            this._emit('translation_received', data.data);
            break;
          case 'translation_error':
            this._emit('translation_error', data.data);
            break;
          default:
            this._emit('message', data);
        }
      } catch {
        this._emit('message', event.data);
      }
    };
  }

  disconnect() {
    this.isDestroyed = true;
    this._clearRetryTimer();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close(1000);
      this.ws = null;
    }
    this.isConnected = false;
    this.listeners = {};
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  _emit(event, data) {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`TranslationWebSocket: Error in ${event} listener:`, err);
        }
      });
    }
  }

  _scheduleReconnect() {
    if (this.isDestroyed || this.retryCount >= MAX_RETRIES) {
      if (this.retryCount >= MAX_RETRIES) {
        this._emit('error', new Error(`Max reconnection retries (${MAX_RETRIES}) reached`));
      }
      return;
    }

    this._clearRetryTimer();

    this.retryTimer = setTimeout(() => {
      if (!this.isDestroyed) {
        this.retryCount++;
        this._emit('reconnecting', {
          attempt: this.retryCount,
          maxRetries: MAX_RETRIES,
          delay: this.retryDelay,
        });
        this.connect();
        this.retryDelay = Math.min(this.retryDelay * 2, MAX_RETRY_DELAY);
      }
    }, this.retryDelay);
  }

  _clearRetryTimer() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }
}

export default TranslationWebSocket;
