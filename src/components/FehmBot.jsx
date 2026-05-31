import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, AlertCircle, Mic, MicOff, Square, Play, Trash2, Upload, Video, BookOpen, CreditCard, Users, ExternalLink } from 'lucide-react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { chatbotService } from '../services/api';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useSpeechToText } from '../hooks/useSpeechToText';

const formatDuration = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const cardIcons = {
  meeting_created: Users,
  upgrade_required: CreditCard,
  continue_learning: BookOpen,
  translator: Video,
};

const cardDefaultActions = {
  meeting_created: { labelKey: 'fehm.action_join', action: '' },
  upgrade_required: { labelKey: 'fehm.action_upgrade', action: 'navigate:/pricing' },
  continue_learning: { labelKey: 'fehm.action_open', action: '' },
  translator: { labelKey: 'fehm.action_open', action: 'navigate:/translator' },
};

const ActionCard = ({ card, onAction }) => {
  const { t } = useTranslation();
  const Icon = cardIcons[card.type] || Sparkles;
  const defaults = cardDefaultActions[card.type] || { labelKey: 'fehm.action_open', action: '' };
  const buttonLabel = card.button?.label || t(defaults.labelKey);
  const buttonAction = card.button?.action || defaults.action;

  return (
    <div className="glass rounded-2xl border border-white/10 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-main truncate">{card.title}</p>
          {card.description && (
            <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{card.description}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => onAction(buttonAction, card)}
        className="w-full py-2 rounded-xl bg-primary hover:bg-secondary text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        {buttonLabel}
      </button>
    </div>
  );
};

const AudioMessage = ({ audioUrl, duration }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setCurrentTime(0); };
    const onTime = () => setCurrentTime(Math.floor(el.currentTime));
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    el.addEventListener('timeupdate', onTime);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('timeupdate', onTime);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors shrink-0"
      >
        <Play className={classNames("w-4 h-4 text-primary ml-0.5", playing && "hidden")} />
        <Square className={classNames("w-3.5 h-3.5 text-primary", !playing && "hidden")} />
      </button>
      <span className="text-xs font-mono tabular-nums">
        {playing ? formatDuration(currentTime) : formatDuration(duration)}
      </span>
      <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden max-w-[60px]">
        <div
          className="h-full bg-primary rounded-full transition-all duration-200"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
};

const FehmBot = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const {
    isRecording, recordingDuration, recordingBlob, audioUrl: recorderAudioUrl,
    error: recorderError, isSupported: isRecorderSupported,
    startRecording, stopRecording, cancelRecording,
  } = useAudioRecorder();
  const {
    isListening, transcript, isBrowserSTTSupported,
    startListening, stopListening,
  } = useSpeechToText();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: t('fehm.welcome_loading'), isBot: true },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [voiceMode, setVoiceMode] = useState('idle');
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [quickActions, setQuickActions] = useState([]);
  const [isLoadingWelcome, setIsLoadingWelcome] = useState(true);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const audioUrlsRef = useRef([]);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    return () => {
      audioUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  useEffect(() => {
    if (!isRecording && voiceMode === 'recording') {
      setVoiceMode('preview');
    }
  }, [isRecording, voiceMode]);

  useEffect(() => {
    if (voiceMode === 'recording' && isBrowserSTTSupported) {
      startListening(i18n.language === 'ar' ? 'ar-EG' : 'en-US');
    }
  }, [voiceMode, startListening, i18n.language, isBrowserSTTSupported]);

  useEffect(() => {
    if (voiceMode === 'recording' && transcript) {
      setInput(transcript);
    }
  }, [transcript, voiceMode]);

  useEffect(() => {
    if (!isOpen || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    setIsLoadingWelcome(true);

    chatbotService.getWelcome().then((res) => {
      if (res?.data) {
        const data = res.data;
        setMessages(data.message
          ? [{ text: data.message, isBot: true }]
          : [{ text: t('fehm.welcome'), isBot: true }]
        );
        if (data.quick_actions?.length) {
          setQuickActions(data.quick_actions);
        }
      } else {
        setMessages([{ text: t('fehm.welcome'), isBot: true }]);
      }
    }).catch((error) => {
      console.error("Welcome fetch failed:", error);
      console.error("Response:", error.response?.data);
      setMessages([{ text: t('fehm.welcome'), isBot: true }]);
    }).finally(() => {
      setIsLoadingWelcome(false);
    });
  }, [isOpen, t]);

  const handleClose = useCallback(() => {
    if (voiceMode === 'recording') {
      stopRecording();
      if (isListening) stopListening();
    }
    if (voiceMode === 'preview') {
      cancelRecording();
      if (isListening) stopListening();
    }
    setVoiceMode('idle');
    setInput('');
    setIsOpen(false);
  }, [voiceMode, stopRecording, isListening, stopListening, cancelRecording]);

  const handleStartRecording = useCallback(async () => {
    if (!isRecorderSupported) return;
    setVoiceMode('recording');
    await startRecording();
  }, [isRecorderSupported, startRecording]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    if (isBrowserSTTSupported) {
      const finalText = stopListening();
      if (finalText) setInput(finalText);
    }
    setVoiceMode('preview');
  }, [stopRecording, isBrowserSTTSupported, stopListening]);

  const handleCancelRecording = useCallback(() => {
    cancelRecording();
    if (isListening) stopListening();
    setInput('');
    setVoiceMode('idle');
  }, [cancelRecording, isListening, stopListening]);

  const processBotResponse = useCallback((data) => {
    const reply = data.message || data.response;
    const newMessages = [];
    if (reply) newMessages.push({ text: reply, isBot: true });
    if (data.type === 'upgrade_required') {
      newMessages.push({
        text: '', isBot: true, card: {
          type: 'upgrade_required',
          title: t('fehm.upgrade_title'),
          description: reply,
          button: { label: t('fehm.action_upgrade'), action: 'navigate:/pricing' },
        },
      });
    } else if (data.actions?.length) {
      newMessages.push({
        text: '', isBot: true, card: {
          type: 'meeting_created',
          title: data.actions[0].label || t('fehm.action_open'),
          description: reply,
          button: { label: data.actions[0].label, action: data.actions[0].type },
        },
      });
    } else if (data.destination) {
      newMessages.push({
        text: '', isBot: true, card: {
          type: 'translator',
          title: t('fehm.action_open'),
          description: reply,
          button: { label: t('fehm.action_open'), action: `navigate:/${data.destination}` },
        },
      });
    }
    return newMessages;
  }, [t]);

  const handleSendText = useCallback(async (text) => {
    if (!text.trim()) return;
    const msg = text.trim();
    setMessages(prev => [...prev, { text: msg, isBot: false }]);
    setInput('');
    setVoiceMode('idle');
    setIsTyping(true);

    try {
      let convId = conversationId;
      if (!convId) {
        const conv = await chatbotService.createConversation();
        convId = conv.data.id;
        setConversationId(convId);
        localStorage.setItem('fehm_conversation_id', convId);
      }
      const response = await chatbotService.sendMessage(msg, convId);
      const botMessages = processBotResponse(response.data);
      if (botMessages.length) setMessages(prev => [...prev, ...botMessages]);
    } catch (error) {
      console.error("sendMessage failed:", error);
      console.error("Response:", error.response?.data);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || t('fehm.error');
      setMessages(prev => [...prev, { text: errorMsg, isBot: true, isError: true }]);
    } finally {
      setIsTyping(false);
    }
  }, [conversationId, t, processBotResponse]);

  const handleQuickAction = useCallback(async (action) => {
    const label = action.label || action;
    const actionKey = action.key || action.id || action;
    setMessages(prev => [...prev, { text: label, isBot: false }]);
    setVoiceMode('idle');
    setIsTyping(true);

    try {
      let convId = conversationId;
      if (!convId) {
        const conv = await chatbotService.createConversation();
        convId = conv.data.id;
        setConversationId(convId);
        localStorage.setItem('fehm_conversation_id', convId);
      }
      const response = await chatbotService.sendAction(actionKey, convId);
      const botMessages = processBotResponse(response.data);
      if (botMessages.length) setMessages(prev => [...prev, ...botMessages]);
    } catch (error) {
      console.error("sendAction failed:", error);
      console.error("Response:", error.response?.data);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || t('fehm.error');
      setMessages(prev => [...prev, { text: errorMsg, isBot: true, isError: true }]);
    } finally {
      setIsTyping(false);
    }
  }, [conversationId, t, processBotResponse]);

  const handleCardAction = useCallback((action, card) => {
    if (action.startsWith('navigate:')) {
      const path = action.slice(9);
      navigate(path);
      handleClose();
      return;
    }
    handleSendText(action);
  }, [navigate, handleClose, handleSendText]);

  const handleSendVoice = useCallback(async () => {
    if (!recordingBlob) return;
    setIsUploadingVoice(true);
    setUploadProgress(0);
    const displayText = input.trim() || '';

    const voiceUrl = URL.createObjectURL(recordingBlob);
    audioUrlsRef.current.push(voiceUrl);

    setMessages(prev => [...prev, {
      text: displayText, isBot: false, isVoice: true,
      audioUrl: voiceUrl, duration: recordingDuration,
    }]);

    setInput('');
    setVoiceMode('idle');
    setIsTyping(true);

    try {
      const response = await chatbotService.sendVoiceMessage(recordingBlob, conversationId);
      const botMessages = processBotResponse(response.data);
      if (botMessages.length) setMessages(prev => [...prev, ...botMessages]);
    } catch (error) {
      console.error("sendVoiceMessage failed:", error);
      console.error("Response:", error.response?.data);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || t('fehm.error');
      setMessages(prev => [...prev, { text: errorMsg, isBot: true, isError: true }]);
    } finally {
      setIsTyping(false);
      setIsUploadingVoice(false);
      setUploadProgress(0);
    }
  }, [recordingBlob, recordingDuration, input, conversationId, t, processBotResponse]);

  const showPreview = voiceMode === 'preview' && recorderAudioUrl;
  const showActions = quickActions.length > 0 && !isLoadingWelcome && voiceMode === 'idle' && !recorderError && !showPreview;
  const micDisabled = isTyping || isUploadingVoice || !isRecorderSupported;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 bg-primary hover:bg-secondary rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(59,130,246,0.4)] group transition-colors"
              aria-label={t('fehm.title')}
            >
              <MessageSquare className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={classNames(
              "fixed bottom-24 w-[350px] h-[500px] glass rounded-3xl border border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden",
              i18n.dir() === 'rtl' ? 'left-6' : 'right-6'
            )}
          >
            {/* Header */}
            <div className="p-4 bg-primary text-white flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold">{t('fehm.title')}</span>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.card ? (
                    <div className="max-w-[90%] self-start">
                      <ActionCard card={msg.card} onAction={handleCardAction} />
                    </div>
                  ) : (
                    <div
                      className={classNames(
                        "max-w-[85%] rounded-2xl p-3 text-sm break-words",
                        msg.isBot
                          ? "bg-bg-card self-start rounded-tl-sm text-text-main border border-border-subtle"
                          : "bg-primary self-end rounded-tr-sm text-white",
                        msg.isError && "border-red-500/50"
                      )}
                    >
                      {msg.isError && (
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        </div>
                      )}
                      {msg.isVoice && msg.audioUrl ? (
                        <div className="flex flex-col gap-1.5">
                          <AudioMessage audioUrl={msg.audioUrl} duration={msg.duration || 0} />
                          {msg.text && <p className="text-xs opacity-80 mt-1">{msg.text}</p>}
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="bg-bg-card self-start rounded-2xl rounded-tl-sm p-3 flex gap-1 w-12 justify-center border border-border-subtle">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="w-1.5 h-1.5 bg-text-muted rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                    className="w-1.5 h-1.5 bg-text-muted rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                    className="w-1.5 h-1.5 bg-text-muted rounded-full"
                  />
                </div>
              )}

              {isUploadingVoice && (
                <div className="bg-bg-card self-end rounded-2xl rounded-tr-sm p-3 border border-border-subtle flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-xs text-text-muted">{t('fehm.voice_uploading')}</span>
                  {uploadProgress > 0 && (
                    <span className="text-xs font-mono text-text-muted">{uploadProgress}%</span>
                  )}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Actions or Recording Preview */}
            <div className={classNames(
              "px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar items-center",
              i18n.dir() === 'rtl' ? 'flex-row-reverse' : ''
            )}>
              {voiceMode === 'recording' ? (
                <div className={classNames(
                  "flex items-center gap-3 w-full py-1",
                  i18n.dir() === 'rtl' ? 'flex-row-reverse' : ''
                )}>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <span className="text-xs font-mono tabular-nums text-red-400">
                    {formatDuration(recordingDuration)}
                  </span>
                  <span className="text-xs text-text-muted">{t('fehm.voice_start')}</span>
                  <button
                    onClick={handleStopRecording}
                    className="ml-auto shrink-0 p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-full transition-colors"
                    aria-label={t('fehm.voice_stop')}
                  >
                    <Square className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ) : showPreview ? (
                <div className={classNames(
                  "flex items-center gap-2 w-full",
                  i18n.dir() === 'rtl' ? 'flex-row-reverse' : ''
                )}>
                  <AudioMessage audioUrl={recorderAudioUrl} duration={recordingDuration} />
                  <button
                    onClick={handleCancelRecording}
                    className="shrink-0 p-1.5 hover:bg-white/10 rounded-full transition-colors"
                    aria-label={t('fehm.voice_cancel')}
                  >
                    <Trash2 className="w-4 h-4 text-text-muted hover:text-red-400" />
                  </button>
                  <button
                    onClick={handleSendVoice}
                    disabled={isUploadingVoice}
                    className="ml-auto shrink-0 flex items-center gap-1 text-xs bg-primary hover:bg-secondary text-white px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    {t('fehm.voice_send')}
                  </button>
                </div>
              ) : recorderError ? (
                <span className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {recorderError}
                </span>
              ) : showActions && (
                quickActions.map((act, i) => (
                  <button
                    key={act.id || i}
                    onClick={() => handleQuickAction(act)}
                    disabled={isTyping}
                    className="shrink-0 text-xs bg-bg-card hover:bg-white/10 border border-border-subtle px-3 py-1.5 rounded-full text-text-muted hover:text-text-main transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {act.label || act}
                  </button>
                ))
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-black/5 border-t border-border-subtle">
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (voiceMode === 'preview') {
                          handleSendVoice();
                        } else {
                          handleSendText(input);
                        }
                      }
                    }}
                    placeholder={t('fehm.placeholder')}
                    disabled={isTyping || isUploadingVoice || voiceMode === 'recording'}
                    className="w-full bg-bg-card border border-border-subtle rounded-full pl-4 pr-11 py-2.5 text-sm focus:outline-none focus:border-primary text-text-main disabled:opacity-50"
                  />
                  <button
                    onClick={() => {
                      if (voiceMode === 'preview') {
                        handleSendVoice();
                      } else {
                        handleSendText(input);
                      }
                    }}
                    disabled={isTyping || isUploadingVoice || (!input.trim() && voiceMode !== 'preview')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-primary hover:bg-secondary rounded-full text-white transition-colors disabled:opacity-50"
                  >
                    {isUploadingVoice ? (
                      <Upload className="w-3.5 h-3.5 animate-pulse" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (voiceMode === 'recording') {
                      handleStopRecording();
                    } else if (voiceMode === 'preview') {
                      handleCancelRecording();
                    } else {
                      handleStartRecording();
                    }
                  }}
                  disabled={micDisabled}
                  className={classNames(
                    "shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    voiceMode === 'recording'
                      ? "bg-red-500 hover:bg-red-600 animate-pulse"
                      : "bg-bg-card border border-border-subtle hover:bg-white/10",
                    micDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  aria-label={
                    voiceMode === 'recording'
                      ? t('fehm.voice_stop')
                      : voiceMode === 'preview'
                        ? t('fehm.voice_cancel')
                        : t('fehm.voice_start')
                  }
                >
                  {!isRecorderSupported ? (
                    <MicOff className="w-4 h-4 text-text-muted" />
                  ) : voiceMode === 'recording' ? (
                    <Square className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4 text-text-muted" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FehmBot;
