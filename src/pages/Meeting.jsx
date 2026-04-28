import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, ScreenShare, MessageSquare,
  Users, Hand, MoreVertical, PhoneOff, Settings, Copy,
  Check, Link2, Lock, Shield, Calendar, Trash2,
  UserPlus, Send, X, ChevronDown, QrCode, Loader2
} from 'lucide-react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { meetingService, meetingWsService } from '../services/api';

const Meeting = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // States
  const [view, setView] = useState('list'); // 'list' or 'in-meeting'
  const [meetingCode, setMeetingCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Media states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [raisedHand, setRaisedHand] = useState(false);

  // WebRTC states
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [peerConnections, setPeerConnections] = useState({});

  // Chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Participants
  const [participants, setParticipants] = useState([]);

  // Refs
  const localVideoRef = useRef(null);
  const wsRef = useRef(null);
  const peerConnectionsRef = useRef({});

  // ICE servers (STUN/TURN)
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  // Initialize local media stream
  const initLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: !isVideoOff,
        audio: !isMuted,
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      setError('Failed to access camera/microphone: ' + err.message);
      return null;
    }
  }, [isMuted, isVideoOff]);

  // Create peer connection
  const createPeerConnection = useCallback((remoteUsername) => {
    const pc = new RTCPeerConnection({ iceServers });

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        meetingWsService.send({
          type: 'ice_candidate',
          data: event.candidate,
          target: remoteUsername,
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [remoteUsername]: event.streams[0],
      }));
    };

    peerConnectionsRef.current[remoteUsername] = pc;
    setPeerConnections({ ...peerConnectionsRef.current });
    return pc;
  }, [localStream]);

  // Handle WebSocket messages
  const handleWsMessage = useCallback(async (data) => {
    const { type, message } = data;

    if (message?.type === 'connection_established') {
      console.log('Connected to meeting');
      return;
    }

    if (message?.type === 'offer') {
      const { data: offer, user: remoteUser } = message;
      let pc = peerConnectionsRef.current[remoteUser];

      if (!pc) {
        pc = createPeerConnection(remoteUser);
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      meetingWsService.send({
        type: 'answer',
        data: answer,
        target: remoteUser,
      });
    }

    if (message?.type === 'answer') {
      const { data: answer, user: remoteUser } = message;
      const pc = peerConnectionsRef.current[remoteUser];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    }

    if (message?.type === 'ice_candidate') {
      const { data: candidate, user: remoteUser } = message;
      const pc = peerConnectionsRef.current[remoteUser];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    }

    if (message?.type === 'chat') {
      setMessages(prev => [...prev, {
        id: Date.now(),
        user: message.user,
        text: message.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }

    if (message?.type === 'speech_result') {
      // Handle speech-to-text results
      console.log('Speech result:', message.text);
    }

    if (message?.type === 'sign_result') {
      // Handle sign language results
      console.log('Sign result:', message.gloss);
    }
  }, [createPeerConnection]);

  // Create meeting
  const handleCreateMeeting = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await meetingService.create({
        title: `${user?.username || 'User'}'s Meeting`,
      });
      const { meeting_code } = response.data;
      setMeetingCode(meeting_code);
      setIsHost(true);
      await joinMeeting(meeting_code, true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create meeting');
      setLoading(false);
    }
  };

  // Join meeting
  const joinMeeting = async (code, isHost = false) => {
    try {
      // Join via REST API
      await meetingService.join(code, {});

      // Initialize local media
      const stream = await initLocalStream();
      if (!stream) {
        setLoading(false);
        return;
      }

      // Connect to WebSocket
      const ws = meetingWsService.connect(code, handleWsMessage);
      wsRef.current = ws;

      // Update UI
      setView('in-meeting');
      setLoading(false);

      // Add self to participants
      setParticipants([{
        id: user?.id || 1,
        name: user?.username || 'You',
        avatar: (user?.username || 'Y').charAt(0).toUpperCase(),
        role: isHost ? 'host' : 'participant',
        muted: isMuted,
        videoOn: !isVideoOff,
      }]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join meeting');
      setLoading(false);
    }
  };

  // Handle join meeting
  const handleJoinMeeting = async (code) => {
    setLoading(true);
    setError('');
    await joinMeeting(code, false);
  };

  // Send chat message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    meetingWsService.send({
      type: 'chat',
      message: newMessage,
    });

    setMessages(prev => [...prev, {
      id: Date.now(),
      user: user?.username || 'You',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);

    setNewMessage('');
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  // Leave meeting
  const handleLeaveMeeting = async () => {
    // Close all peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};
    setPeerConnections({});
    setRemoteStreams({});

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Disconnect WebSocket
    meetingWsService.disconnect();
    wsRef.current = null;

    // Leave via API
    try {
      await meetingService.leave(meetingCode);
    } catch (e) {
      // Ignore errors
    }

    setView('list');
    setMeetingCode('');
    setIsHost(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleLeaveMeeting();
    };
  }, []);

  // Meeting List View
  if (view === 'list') {
    return (
      <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-text-main mb-2">Meetings</h1>
            <p className="text-text-muted">Create or join a meeting to get started</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2">
              <X className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="glass rounded-3xl border border-white/10 p-8 space-y-6">
            {/* Create Meeting */}
            <div>
              <h3 className="font-bold text-text-main mb-3">Start a New Meeting</h3>
              <button
                onClick={handleCreateMeeting}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                Create Meeting
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#1e293b] px-4 text-sm text-text-muted">or</span>
              </div>
            </div>

            {/* Join Meeting */}
            <div>
              <h3 className="font-bold text-text-main mb-3">Join Existing Meeting</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter meeting code"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoinMeeting(e.target.value);
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.closest('div').querySelector('input');
                    handleJoinMeeting(input.value);
                  }}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-text-main font-medium hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // In-Meeting View
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#0f172a]">
      {/* Meeting Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Video className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-text-main">Meeting</h3>
            <p className="text-xs text-text-muted">Code: {meetingCode}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-text-muted"
          >
            <Users className="w-4 h-4" />
            <span className="ml-1 text-xs">{Object.keys(remoteStreams).length + 1}</span>
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-text-muted relative"
          >
            <MessageSquare className="w-4 h-4" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] text-white flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </button>
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-text-muted">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className={`flex-1 p-4 ${showChat ? 'mr-[350px]' : ''} ${showParticipants ? 'ml-[280px]' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Local Video */}
            <div className="relative bg-[#1e293b] rounded-2xl overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
                  <span className="text-xs text-white">{user?.username || 'You'}</span>
                </div>
                {isMuted && <MicOff className="w-3 h-3 text-red-500" />}
                {isVideoOff && <VideoOff className="w-3 h-3 text-red-500" />}
              </div>
            </div>

            {/* Remote Videos */}
            {Object.entries(remoteStreams).map(([username, stream]) => (
              <div key={username} className="relative bg-[#1e293b] rounded-2xl overflow-hidden">
                <video
                  autoPlay
                  className="w-full h-full object-cover"
                  ref={(el) => {
                    if (el && stream) el.srcObject = stream;
                  }}
                />
                <div className="absolute bottom-3 left-3">
                  <div className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
                    <span className="text-xs text-white">{username}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Participants Sidebar */}
        {showParticipants && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="w-[280px] bg-[#1e293b] border-r border-white/10 overflow-y-auto"
          >
            <div className="p-4">
              <h3 className="font-bold text-sm text-text-main mb-4">Participants ({participants.length})</h3>
              <div className="space-y-2">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {p.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-text-main">{p.name}</p>
                      <p className="text-[10px] text-text-muted">{p.role}</p>
                    </div>
                    {p.muted && <MicOff className="w-3 h-3 text-text-muted" />}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Chat Sidebar */}
        {showChat && (
          <motion.div
            initial={{ x: 350 }}
            animate={{ x: 0 }}
            exit={{ x: 350 }}
            className="w-[350px] bg-[#1e293b] border-l border-white/10 flex flex-col"
          >
            <div className="p-4 border-b border-white/10">
              <h3 className="font-bold text-sm text-text-main">Chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold shrink-0">
                    {msg.user.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-text-main truncate">{msg.user}</span>
                      <span className="text-[10px] text-text-muted">{msg.time}</span>
                    </div>
                    <p className="text-sm text-text-main">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-text-main placeholder-text-muted text-sm focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2 rounded-lg bg-primary text-white hover:bg-secondary transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-center gap-4 px-6 py-4 bg-[#1e293b] border-t border-white/10">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-text-muted hover:bg-white/10'}`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-xl transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-text-muted hover:bg-white/10'}`}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setRaisedHand(!raisedHand)}
          className={`p-3 rounded-xl transition-all ${raisedHand ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-text-muted hover:bg-white/10'}`}
        >
          <Hand className="w-5 h-5" />
        </button>

        <button
          onClick={handleLeaveMeeting}
          className="p-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Meeting;
