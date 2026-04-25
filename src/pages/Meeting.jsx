import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, ScreenShare, MessageSquare,
  Users, Hand, MoreVertical, PhoneOff, Settings, Copy,
  Check, Link2, Lock, Unlock, Shield, Clock, ExternalLink,
  Maximize2, Minimize2, Speaker, Volume2, ChevronDown,
  Calendar, Trash2, Bell, Clock3, UserPlus, Send, Plus,
  X, Eye, EyeOff, Sparkles, QrCode
} from 'lucide-react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { meetingService } from '../services/api';

const generateMeetingId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generatePassword = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const Meeting = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [view, setView] = useState('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [raisedHand, setRaisedHand] = useState(false);
  const [password, setPassword] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, user: 'Sarah Ahmed', text: 'Hello everyone! 👋', time: '2:30 PM', avatar: 'S' },
    { id: 2, user: 'Ahmed Hassan', text: 'Hi Sarah, ready to start?', time: '2:31 PM', avatar: 'A' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [meetings, setMeetings] = useState([
    {
      id: 'tafahom-meeting-1234',
      title: 'EASL Discussion',
      host: 'You',
      password: '123456',
      startTime: '2:30 PM',
      duration: '45 min',
      participants: 4,
      isRecurring: false
    },
    {
      id: 'tafahom-weekly-5678',
      title: 'Weekly Team Standup',
      host: 'You',
      password: '789012',
      startTime: 'Tomorrow 10:00 AM',
      duration: '30 min',
      participants: 8,
      isRecurring: true
    }
  ]);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [participants, setParticipants] = useState([
    { id: 1, name: 'You (Host)', avatar: (user?.name || 'M').charAt(0).toUpperCase(), role: 'host', muted: false, videoOn: true },
    { id: 2, name: 'Sarah Ahmed', avatar: 'S', role: 'participant', muted: false, videoOn: true },
    { id: 3, name: 'Ahmed Hassan', avatar: 'A', role: 'participant', muted: true, videoOn: false },
    { id: 4, name: 'Fatima Ali', avatar: 'F', role: 'participant', muted: false, videoOn: true },
  ]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(),
      user: user?.name || 'You',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: (user?.name || 'Y').charAt(0).toUpperCase()
    }]);
    setNewMessage('');
  };

  const handleCreateMeeting = (meetingData) => {
    const newMeeting = {
      id: `tafahom-${generateMeetingId()}`,
      title: meetingData.title,
      host: 'You',
      password: meetingData.requirePassword ? generatePassword() : '',
      startTime: meetingData.scheduledTime || 'Starting now',
      duration: meetingData.duration || '45 min',
      participants: 1,
      isRecurring: meetingData.isRecurring || false,
      scheduledTime: meetingData.scheduledTime,
    };
    setMeetings(prev => [newMeeting, ...prev]);
    setShowCreateModal(false);
    setCurrentMeeting(newMeeting);
    setView('pre-meeting');
  };

  const handleJoinMeeting = (meeting) => {
    setCurrentMeeting(meeting);
    if (meeting.password) {
      setShowPasswordModal(true);
    } else {
      setIsInMeeting(true);
      setView('in-meeting');
    }
  };

  const handlePasswordJoin = () => {
    if (password === currentMeeting.password) {
      setShowPasswordModal(false);
      setIsInMeeting(true);
      setView('in-meeting');
    }
  };

  const handleStartInstant = () => {
    const instantMeeting = {
      id: `tafahom-${generateMeetingId()}`,
      title: 'Instant Meeting',
      host: 'You',
      password: '',
      startTime: 'Starting now',
      duration: '45 min',
      participants: 1,
      isRecurring: false,
    };
    setCurrentMeeting(instantMeeting);
    setIsInMeeting(true);
    setView('in-meeting');
  };

  if (!isInMeeting) {
    return (
      <div className="min-h-[calc(100vh-8rem)] p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-main">Meetings</h1>
              <p className="text-text-muted mt-1">Create and manage your meetings</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleStartInstant}
                className="flex items-center gap-2 bg-primary hover:bg-secondary text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg shadow-primary/30"
              >
                <Video className="w-5 h-5" />
                Start Instant Meeting
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 glass border border-border-subtle hover:bg-white/10 text-text-main px-6 py-3 rounded-full font-semibold transition-all"
              >
                <Plus className="w-5 h-5" />
                Schedule Meeting
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartInstant}
              className="glass rounded-2xl p-6 flex items-center gap-4 text-left hover:bg-white/5 transition-colors border border-border-subtle"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Video className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-text-main">Start Instant Meeting</h3>
                <p className="text-sm text-text-muted">Begin a meeting right now</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="glass rounded-2xl p-6 flex items-center gap-4 text-left hover:bg-white/5 transition-colors border border-border-subtle"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-text-main">Schedule Meeting</h3>
                <p className="text-sm text-text-muted">Plan for later with date & time</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const link = `https://tafahom.app/meeting/${generateMeetingId()}`;
                navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="glass rounded-2xl p-6 flex items-center gap-4 text-left hover:bg-white/5 transition-colors border border-border-subtle"
            >
              <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center">
                <Link2 className="w-7 h-7 text-success" />
              </div>
              <div>
                <h3 className="font-bold text-text-main">Copy Invitation Link</h3>
                <p className="text-sm text-text-muted">{copied ? 'Copied!' : 'Generate a shareable link'}</p>
              </div>
            </motion.button>
          </div>

          {/* Upcoming Meetings */}
          <div className="glass rounded-3xl p-8 border border-border-subtle">
            <h2 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Upcoming Meetings
            </h2>

            <div className="space-y-4">
              {meetings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Video className="w-10 h-10 text-text-muted" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-main mb-2">No meetings yet</h3>
                  <p className="text-text-muted">Create your first meeting to get started</p>
                </div>
              ) : (
                meetings.map((meeting, i) => (
                  <motion.div
                    key={meeting.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Video className="w-6 h-6 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-main truncate">{meeting.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {meeting.startTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {meeting.participants}
                        </span>
                        {meeting.isRecurring && (
                          <span className="flex items-center gap-1 text-secondary">
                            <Sparkles className="w-3.5 h-3.5" />
                            Recurring
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setCurrentMeeting(meeting); setShowInviteModal(true); }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-muted hover:text-text-main"
                        title="Invite"
                      >
                        <UserPlus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleJoinMeeting(meeting)}
                        className="px-5 py-2 bg-primary hover:bg-secondary text-white rounded-lg font-medium transition-all"
                      >
                        Join
                      </button>
                      <button
                        onClick={() => setMeetings(prev => prev.filter(m => m.id !== meeting.id))}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-text-muted hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Create Meeting Modal */}
        <CreateMeetingModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateMeeting}
        />

        {/* Password Modal */}
        <AnimatePresence>
          {showPasswordModal && currentMeeting && (
            <PasswordModal
              meetingTitle={currentMeeting.title}
              onSubmit={handlePasswordJoin}
              onCancel={() => setShowPasswordModal(false)}
              password={password}
              setPassword={setPassword}
            />
          )}
        </AnimatePresence>

        {/* Invite Modal */}
        <AnimatePresence>
          {showInviteModal && currentMeeting && (
            <InviteModal meeting={currentMeeting} onClose={() => setShowInviteModal(false)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <InMeetingView
      meeting={currentMeeting}
      participants={participants}
      isMuted={isMuted}
      setIsMuted={setIsMuted}
      isVideoOff={isVideoOff}
      setIsVideoOff={setIsVideoOff}
      isScreenSharing={isScreenSharing}
      setIsScreenSharing={setIsScreenSharing}
      raisedHand={raisedHand}
      setRaisedHand={setRaisedHand}
      showChat={showChat}
      setShowChat={setShowChat}
      showParticipants={showParticipants}
      setShowParticipants={setShowParticipants}
      showInviteModal={showInviteModal}
      setShowInviteModal={setShowInviteModal}
      messages={messages}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      onSendMessage={handleSendMessage}
      onLeave={() => { setIsInMeeting(false); setView('list'); }}
    />
  );
};

const CreateMeetingModal = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [requirePassword, setRequirePassword] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('45');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreate({ title, requirePassword, isRecurring, scheduledTime, duration });
    setTitle('');
    setRequirePassword(false);
    setIsRecurring(false);
    setScheduledTime('');
    setDuration('45');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass rounded-3xl p-8 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Schedule Meeting
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Meeting Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Team Standup, Project Review"
              className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Date & Time</label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 rounded-xl border border-border-subtle hover:border-primary/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={requirePassword}
                onChange={(e) => setRequirePassword(e.target.checked)}
                className="w-5 h-5 rounded bg-bg-card border-border-subtle text-primary focus:ring-primary"
              />
              <div>
                <span className="font-medium text-text-main flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Require Password
                </span>
                <p className="text-xs text-text-muted mt-1">Meeting password will be auto-generated</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-xl border border-border-subtle hover:border-primary/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-5 h-5 rounded bg-bg-card border-border-subtle text-primary focus:ring-primary"
              />
              <div>
                <span className="font-medium text-text-main flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Recurring Meeting
                </span>
                <p className="text-xs text-text-muted mt-1">Repeats weekly automatically</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 glass border border-border-subtle hover:bg-white/10 rounded-xl py-3 font-semibold text-text-main transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 bg-primary hover:bg-secondary text-white rounded-xl py-3 font-bold transition-all disabled:opacity-50"
          >
            Create Meeting
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const PasswordModal = ({ meetingTitle, onSubmit, onCancel, password, setPassword }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  >
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0.9 }}
      className="glass rounded-3xl p-8 w-full max-w-md"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-text-main">Enter Password</h3>
        <p className="text-text-muted mt-2">{meetingTitle}</p>
      </div>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter meeting password"
        className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-4 text-center text-xl tracking-widest focus:outline-none focus:border-primary mb-6"
        onKeyDown={(e) => e.key === 'Enter' && password && onSubmit()}
      />

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 glass border border-border-subtle hover:bg-white/10 rounded-xl py-3 font-semibold text-text-main transition-all">
          Cancel
        </button>
        <button onClick={onSubmit} disabled={!password} className="flex-1 bg-primary hover:bg-secondary text-white rounded-xl py-3 font-bold transition-all disabled:opacity-50">
          Join
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const InviteModal = ({ meeting, onClose }) => {
  const [copied, setCopied] = useState('');
  const meetingLink = `https://tafahom.app/meeting/${meeting.id}`;
  const passwordLink = meeting.password
    ? `https://tafahom.app/meeting/${meeting.id}?pwd=${meeting.password}`
    : '';

  const copyLink = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass rounded-3xl p-8 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-text-main mb-2 flex items-center gap-2">
          <Link2 className="w-6 h-6 text-primary" />
          Invite People
        </h3>
        <p className="text-text-muted mb-6">Share this meeting with others</p>

        <div className="space-y-4">
          <div className="bg-bg-card rounded-xl p-4">
            <label className="text-sm text-text-muted mb-2 block">Meeting link</label>
            <div className="flex gap-2">
              <input type="text" value={meetingLink} readOnly className="flex-1 bg-transparent text-text-main text-sm outline-none" />
              <button onClick={() => copyLink(meetingLink, 'link')} className="px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg text-sm font-medium transition-all">
                {copied === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {meeting.password && (
            <>
              <div className="bg-bg-card rounded-xl p-4">
                <label className="text-sm text-text-muted mb-2 block flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Password
                </label>
                <div className="flex gap-2">
                  <input type="text" value={meeting.password} readOnly className="flex-1 bg-transparent text-text-main text-sm outline-none font-mono tracking-widest" />
                  <button onClick={() => copyLink(meeting.password, 'pwd')} className="px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg text-sm font-medium transition-all">
                    {copied === 'pwd' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-bg-card rounded-xl p-4">
                <label className="text-sm text-text-muted mb-2 block flex items-center gap-2">
                  <Link2 className="w-4 h-4" /> Link with password
                </label>
                <div className="flex gap-2">
                  <input type="text" value={passwordLink} readOnly className="flex-1 bg-transparent text-text-main text-sm outline-none truncate" />
                  <button onClick={() => copyLink(passwordLink, 'full')} className="px-4 py-2 bg-primary hover:bg-secondary text-white rounded-lg text-sm font-medium transition-all shrink-0">
                    {copied === 'full' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-border-subtle">
          <label className="text-sm text-text-muted mb-2 block">Or invite via email</label>
          <div className="flex gap-2">
            <input type="email" placeholder="Enter email address" className="flex-1 bg-bg-card border border-border-subtle rounded-xl px-4 py-3 text-text-main text-sm focus:outline-none focus:border-primary" />
            <button className="px-6 py-3 bg-primary hover:bg-secondary text-white rounded-xl font-medium transition-all">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button onClick={onClose} className="w-full mt-6 glass border border-border-subtle hover:bg-white/10 rounded-xl py-3 font-semibold text-text-main transition-all">
          Close
        </button>
      </motion.div>
    </motion.div>
  );
};

const InMeetingView = ({
  meeting, participants, isMuted, setIsMuted, isVideoOff, setIsVideoOff,
  isScreenSharing, setIsScreenSharing, raisedHand, setRaisedHand,
  showChat, setShowChat, showParticipants, setShowParticipants,
  showInviteModal, setShowInviteModal, messages, newMessage, setNewMessage, onSendMessage, onLeave
}) => {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-black relative overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        <div className={classNames(
          "flex-1 grid gap-4",
          participants.length <= 2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        )}>
          {participants.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center"
            >
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-white">
                  {p.avatar}
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="glass px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{p.name}</span>
                  {p.muted && <MicOff className="w-3.5 h-3.5 text-red-500" />}
                </div>
              </div>
              {p.id === 1 && <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/50 text-xs text-white">You</div>}
            </motion.div>
          ))}
        </div>

        {showChat && (
          <motion.div initial={{ width: 0 }} animate={{ width: 320 }} className="w-80 bg-gray-900 rounded-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Chat</h3>
              <button onClick={() => setShowChat(false)} className="text-white/50">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">{msg.avatar}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{msg.user}</span>
                      <span className="text-xs text-white/40">{msg.time}</span>
                    </div>
                    <p className="text-sm text-white/80">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSendMessage()} placeholder="Type a message..." className="flex-1 bg-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/40" />
                <button onClick={onSendMessage} className="p-2 bg-primary rounded-xl"><Send className="w-4 h-4 text-white" /></button>
              </div>
            </div>
          </motion.div>
        )}

        {showParticipants && (
          <motion.div initial={{ width: 0 }} animate={{ width: 280 }} className="w-72 bg-gray-900 rounded-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2"><Users className="w-4 h-4" /> {participants.length}</h3>
              <button onClick={() => setShowParticipants(false)} className="text-white/50">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">{p.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{p.name}</p>
                    <p className="text-xs text-white/40 capitalize">{p.role}</p>
                  </div>
                  {p.muted && <MicOff className="w-4 h-4 text-red-500" />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="glass border border-white/10 rounded-full px-4 py-3 flex items-center justify-center gap-2 mx-auto mb-4">
        <button onClick={() => setIsMuted(!isMuted)} className={classNames("p-3 rounded-full", isMuted ? "bg-red-500" : "bg-white/10")}>
          {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
        </button>
        <button onClick={() => setIsVideoOff(!isVideoOff)} className={classNames("p-3 rounded-full", isVideoOff ? "bg-red-500" : "bg-white/10")}>
          {isVideoOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
        </button>
        <button onClick={() => setIsScreenSharing(!isScreenSharing)} className={classNames("p-3 rounded-full", isScreenSharing ? "bg-primary" : "bg-white/10")}>
          <ScreenShare className="w-5 h-5 text-white" />
        </button>
        <button onClick={() => setRaisedHand(!raisedHand)} className={classNames("p-3 rounded-full", raisedHand ? "bg-yellow-500" : "bg-white/10")}>
          <Hand className="w-5 h-5 text-white" />
        </button>
        <button onClick={() => { setShowChat(!showChat); setShowParticipants(false); }} className={classNames("p-3 rounded-full", showChat ? "bg-primary" : "bg-white/10")}>
          <MessageSquare className="w-5 h-5 text-white" />
        </button>
        <button onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }} className={classNames("p-3 rounded-full relative", showParticipants ? "bg-primary" : "bg-white/10")}>
          <Users className="w-5 h-5 text-white" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">{participants.length}</span>
        </button>
        <button onClick={() => setShowInvite(true)} className="p-3 bg-white/10 rounded-full"><UserPlus className="w-5 h-5 text-white" /></button>
        <button onClick={onLeave} className="p-3 bg-red-500 hover:bg-red-600 rounded-full ml-4"><PhoneOff className="w-5 h-5 text-white" /></button>
      </div>

      <AnimatePresence>
        {showInvite && <InviteModal meeting={meeting} onClose={() => setShowInvite(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Meeting;