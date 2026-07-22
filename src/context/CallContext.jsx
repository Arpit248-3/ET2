import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, 
  UserPlus, Minimize2, Maximize2, Shield, Lock, Activity, Users, 
  ExternalLink, MessageSquare, AlertTriangle, Radio, Check
} from 'lucide-react';
import { addCollabMessage } from '../services/api.js';
import { useToast } from '../components/ui/Toast.jsx';

const CallContext = createContext(null);

export function CallProvider({ children }) {
  const { addToast } = useToast();
  const [callState, setCallState] = useState({
    active: false,
    type: 'AUDIO', // 'AUDIO' | 'VIDEO'
    title: 'Emergency Crisis Briefing',
    contact: null,
    roomId: 'war-room',
    duration: 0,
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
    isMinimized: false,
    participants: [],
  });

  const timerRef = useRef(null);
  const localVideoRef = useRef(null);
  const streamRef = useRef(null);

  // Timer effect
  useEffect(() => {
    if (callState.active) {
      timerRef.current = setInterval(() => {
        setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState.active]);

  // Request camera stream if video call
  useEffect(() => {
    if (callState.active && callState.type === 'VIDEO' && !callState.isVideoOff) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            streamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          })
          .catch(err => {
            console.warn('[Call] Camera permission or device fallback:', err.message);
          });
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [callState.active, callState.type, callState.isVideoOff]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const startCall = async ({ type = 'AUDIO', contact = null, title = '', roomId = 'war-room' }) => {
    const defaultTitle = contact 
      ? `Encrypted ${type === 'VIDEO' ? 'Video' : 'Voice'} Call with ${contact.name}`
      : `National Crisis War Room - ${type === 'VIDEO' ? 'Video Conference' : 'Emergency Audio Briefing'}`;

    const callTitle = title || defaultTitle;
    
    const initialParticipants = [
      { name: 'Arjun Mehta', role: 'Commander (You)', avatar: 'AM', isSelf: true, speaking: false },
      contact ? { name: contact.name, role: contact.role || 'Crisis Contact', avatar: contact.avatar || contact.name.slice(0,2).toUpperCase(), speaking: true } : null,
      { name: 'UrjaNetra AI', role: 'AI Copilot', avatar: 'AI', isAI: true, speaking: true },
      { name: 'Sneha Sharma', role: 'Intelligence Analyst', avatar: 'SS', speaking: false },
    ].filter(Boolean);

    setCallState({
      active: true,
      type,
      title: callTitle,
      contact,
      roomId,
      duration: 0,
      isMuted: false,
      isVideoOff: type !== 'VIDEO',
      isScreenSharing: false,
      isMinimized: false,
      participants: initialParticipants,
    });

    addToast(`Initiated secure ${type.toLowerCase()} call: ${callTitle}`, 'info');

    // Post to collaboration room
    try {
      const msgText = type === 'VIDEO'
        ? `📹 VIDEO CONFERENCE INITIATED: Commander Arjun Mehta started a live video session (${callTitle}).`
        : `📞 SECURE VOICE CALL INITIATED: Commander Arjun Mehta opened an encrypted voice line (${callTitle}).`;
      
      await addCollabMessage(roomId, {
        sender: 'System Command',
        role: 'Encrypted Telecom',
        message: msgText,
        avatar: '📞',
      });
    } catch (err) {
      console.warn('[Call] Failed to post call initiation to room:', err);
    }
  };

  const endCall = async () => {
    const durationStr = formatDuration(callState.duration);
    const title = callState.title;
    const roomId = callState.roomId;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setCallState(prev => ({ ...prev, active: false }));
    addToast(`Call ended. Duration: ${durationStr}`, 'success');

    try {
      await addCollabMessage(roomId, {
        sender: 'System Command',
        role: 'Encrypted Telecom',
        message: `🏁 CALL DISCONNECTED: Session "${title}" ended. Total Duration: ${durationStr}.`,
        avatar: '📞',
      });
    } catch (err) {
      console.warn('[Call] Failed to log call completion:', err);
    }
  };

  const toggleMute = () => {
    setCallState(prev => {
      const next = !prev.isMuted;
      addToast(next ? 'Microphone Muted' : 'Microphone Unmuted', next ? 'warning' : 'info');
      return { ...prev, isMuted: next };
    });
  };

  const toggleVideo = () => {
    setCallState(prev => {
      const next = !prev.isVideoOff;
      addToast(next ? 'Camera Turned Off' : 'Camera Turned On', next ? 'warning' : 'info');
      return { ...prev, isVideoOff: next, type: 'VIDEO' };
    });
  };

  const toggleScreenShare = () => {
    setCallState(prev => {
      const next = !prev.isScreenSharing;
      addToast(next ? 'Screen sharing started' : 'Screen sharing stopped', next ? 'info' : 'warning');
      return { ...prev, isScreenSharing: next };
    });
  };

  const toggleMinimize = () => {
    setCallState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  };

  const addParticipant = (newContact) => {
    setCallState(prev => {
      if (prev.participants.some(p => p.name === newContact.name)) return prev;
      addToast(`Added ${newContact.name} to the call`, 'success');
      return {
        ...prev,
        participants: [...prev.participants, {
          name: newContact.name,
          role: newContact.role || 'Contact',
          avatar: newContact.avatar || newContact.name.slice(0,2).toUpperCase(),
          speaking: false
        }]
      };
    });
  };

  return (
    <CallContext.Provider value={{
      callState,
      startCall,
      endCall,
      toggleMute,
      toggleVideo,
      toggleScreenShare,
      toggleMinimize,
      addParticipant,
      formatDuration
    }}>
      {children}
      <CallOverlayModal localVideoRef={localVideoRef} />
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
}

// ─── Active Call Modal Overlay Component ─────────────────────────────────────
function CallOverlayModal({ localVideoRef }) {
  const { callState, endCall, toggleMute, toggleVideo, toggleScreenShare, toggleMinimize, addParticipant, formatDuration } = useCall();
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  if (!callState.active) return null;

  const contactsToInvite = [
    { name: 'MoP Secretary', role: 'Ministry of Petroleum', avatar: 'PS' },
    { name: 'IOC Chairman', role: 'Indian Oil Corp Lead', avatar: 'RK' },
    { name: 'PMO Office', role: 'Prime Minister Office Desk', avatar: 'PM' },
    { name: 'HPCL Director', role: 'Refinery Operations', avatar: 'SN' },
    { name: 'BPCL Logistics', role: 'Coastal Transport Head', avatar: 'BL' },
  ];

  // Minimized Widget View
  if (callState.isMinimized) {
    return (
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(29, 140, 255, 0.4)',
        borderRadius: 16,
        padding: '12px 18px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.6), 0 0 16px rgba(29, 140, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        backdropFilter: 'blur(12px)',
        color: '#f8fafc',
        animation: 'slide-in-right 0.3s ease-out',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: callState.type === 'VIDEO' ? 'linear-gradient(135deg, #1d8cff, #8b5cf6)' : 'rgba(34, 197, 94, 0.2)',
              border: '1.5px solid #1d8cff',
              display: 'flex',
              alignItems: 'center',
              justify: 'center'
            }}>
              {callState.type === 'VIDEO' ? <Video size={16} color="#fff" /> : <Phone size={16} color="#22c55e" />}
            </div>
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 8px #22c55e'
            }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {callState.contact ? callState.contact.name : callState.title}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#ef4444' }}>● LIVE</span> {formatDuration(callState.duration)} · {callState.participants.length} connected
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 12 }}>
          <button onClick={toggleMute} style={{
            background: callState.isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${callState.isMuted ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: callState.isMuted ? '#ef4444' : '#fff',
            cursor: 'pointer'
          }}>
            {callState.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
          
          <button onClick={toggleMinimize} style={{
            background: 'rgba(29,140,255,0.15)',
            border: '1px solid rgba(29,140,255,0.3)',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            color: '#1d8cff',
            cursor: 'pointer'
          }} title="Expand Call Window">
            <Maximize2 size={14} />
          </button>

          <button onClick={endCall} style={{
            background: '#ef4444',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            color: '#fff',
            cursor: 'pointer'
          }} title="Hang Up">
            <PhoneOff size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Full Screen Modal View
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(6, 11, 25, 0.88)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      animation: 'fadeIn 0.25s ease-out'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 960,
        height: 620,
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 16, 31, 0.98) 100%)',
        border: '1px solid rgba(29, 140, 255, 0.3)',
        borderRadius: 20,
        boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 32px rgba(29, 140, 255, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Call Header Bar */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 10,
              fontWeight: 700,
              color: '#22c55e',
              letterSpacing: '0.05em'
            }}>
              <Lock size={11} /> 256-BIT ENCRYPTED QUANTUM-SAFE LINE
            </div>

            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                {callState.title}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                NEMC Secure Telecom Node · {callState.roomId} war channel
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 20,
              padding: '5px 14px',
              fontFamily: 'monospace',
              fontSize: 13,
              fontWeight: 700,
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse-glow 1s infinite' }} />
              {formatDuration(callState.duration)}
            </div>

            <button onClick={toggleMinimize} style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              padding: 8,
              color: '#94a3b8',
              cursor: 'pointer'
            }} title="Minimize to floating widget">
              <Minimize2 size={16} />
            </button>
          </div>
        </div>

        {/* Main Call View Area */}
        <div style={{ flex: 1, padding: 20, display: 'flex', gap: 16, position: 'relative', overflow: 'hidden' }}>
          
          {/* Main Grid: Video Call vs Audio Call */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {callState.type === 'VIDEO' ? (
              <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: callState.participants.length > 2 ? '1fr 1fr' : '1fr',
                gap: 14,
                borderRadius: 14,
                overflow: 'hidden'
              }}>
                {/* Self Stream */}
                <div style={{
                  position: 'relative',
                  background: '#090d16',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {callState.isVideoOff ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #1d8cff, #8b5cf6)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff' }}>AM</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>Arjun Mehta (You)</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Camera Off</div>
                    </div>
                  ) : (
                    <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff' }}>
                    Commander Arjun Mehta (You) {callState.isMuted && <span style={{ color: '#ef4444' }}>[Muted]</span>}
                  </div>
                </div>

                {/* Remote Participants */}
                {callState.participants.filter(p => !p.isSelf).slice(0, 3).map((p, idx) => (
                  <div key={p.name} style={{
                    position: 'relative',
                    background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Simulated visualizer background */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0.15,
                      background: p.isAI ? 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' : 'radial-gradient(circle, #1d8cff 0%, transparent 70%)'
                    }} />

                    <div style={{ position: 'relative', textAlign: 'center' }}>
                      <div style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background: p.isAI ? 'linear-gradient(135deg, #1d8cff, #8b5cf6)' : 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(29, 140, 255, 0.4)',
                        margin: '0 auto 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        fontWeight: 700,
                        color: '#fff',
                        boxShadow: '0 0 20px rgba(29, 140, 255, 0.3)',
                        animation: p.speaking ? 'pulse-glow 1.5s infinite' : 'none'
                      }}>
                        {p.avatar}
                      </div>
                      
                      {/* Audio waveform visualization bars */}
                      <div style={{ display: 'flex', gap: 3, justifyContent: 'center', height: 16, alignItems: 'center' }}>
                        {[12, 20, 8, 16, 24, 10, 18].map((h, i) => (
                          <div key={i} style={{
                            width: 3,
                            height: p.speaking ? (i % 2 === 0 ? h : h * 0.6) : 4,
                            background: p.isAI ? '#8b5cf6' : '#22c55e',
                            borderRadius: 2,
                            transition: 'all 0.15s ease'
                          }} />
                        ))}
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginTop: 6 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{p.role}</div>
                    </div>

                    <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Activity size={10} /> LIVE HD FEED
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* AUDIO CALL MODE VIEW */
              <div style={{
                flex: 1,
                background: 'radial-gradient(circle at center, rgba(29, 140, 255, 0.08) 0%, rgba(15, 23, 42, 0.6) 70%)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 30,
                position: 'relative'
              }}>
                <div style={{ position: 'relative', marginBottom: 24 }}>
                  {/* Concentric glowing rings */}
                  <div style={{
                    position: 'absolute',
                    inset: -20,
                    borderRadius: '50%',
                    border: '1px solid rgba(29, 140, 255, 0.2)',
                    animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: -40,
                    borderRadius: '50%',
                    border: '1px solid rgba(34, 197, 94, 0.15)'
                  }} />

                  <div style={{
                    width: 110,
                    height: 110,
                    borderRadius: '50%',
                    background: callState.contact ? 'linear-gradient(135deg, #1d8cff, #2563eb)' : 'linear-gradient(135deg, #0f172a, #1e293b)',
                    border: '3px solid #1d8cff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 36,
                    fontWeight: 700,
                    color: '#fff',
                    boxShadow: '0 0 40px rgba(29, 140, 255, 0.4)'
                  }}>
                    {callState.contact ? callState.contact.avatar : 'WAR'}
                  </div>
                </div>

                <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
                  {callState.contact ? callState.contact.name : 'National War Room Emergency Session'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>
                  {callState.contact ? callState.contact.role || 'Government Contact' : 'Multi-Agency Tactical Command'}
                </div>

                {/* Animated Audio Equalizer Wave */}
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 28, marginBottom: 20 }}>
                  {[16, 28, 12, 36, 44, 22, 38, 14, 30, 24, 40, 18, 32].map((h, i) => (
                    <div key={i} style={{
                      width: 4,
                      height: callState.isMuted ? 4 : h,
                      background: 'linear-gradient(180deg, #1d8cff 0%, #22c55e 100%)',
                      borderRadius: 4,
                      transition: 'all 0.2s ease'
                    }} />
                  ))}
                </div>

                <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={12} color="#22c55e" /> Encrypted Protocol V4 · Low Latency Carrier Node
                </div>
              </div>
            )}

            {/* Screen Share Overlay Preview if enabled */}
            {callState.isScreenSharing && (
              <div style={{
                height: 120,
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: 12,
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Monitor size={24} color="#a78bfa" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>Screen Share Active</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Sharing: "UrjaNetra AI - SPR Drawdown & Hormuz Supply Flow.pdf"</div>
                  </div>
                </div>
                <button onClick={toggleScreenShare} className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 10px' }}>
                  Stop Sharing
                </button>
              </div>
            )}
          </div>

          {/* Side Drawer: Active Call Participants List */}
          <div style={{
            width: 240,
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 16,
            padding: 14,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Participants ({callState.participants.length})</span>
              <Users size={13} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {callState.participants.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: p.isAI ? 'linear-gradient(135deg, #1d8cff, #8b5cf6)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                    {p.avatar}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 9, color: '#64748b' }}>{p.role}</div>
                  </div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                </div>
              ))}
            </div>

            <button onClick={() => setShowAddMemberModal(true)}
              style={{ width: '100%', marginTop: 12, background: 'rgba(29, 140, 255, 0.1)', border: '1px solid rgba(29, 140, 255, 0.25)', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#1d8cff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <UserPlus size={12} /> Invite Participant
            </button>
          </div>
        </div>

        {/* Invite Participant Quick Selector Sub-modal */}
        {showAddMemberModal && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 360, background: '#0f172a', border: '1px solid rgba(29,140,255,0.3)', borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}>Invite to Call Session</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                {contactsToInvite.map(c => (
                  <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#f8fafc' }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{c.role}</div>
                    </div>
                    <button style={{ background: '#1d8cff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 10, color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => { addParticipant(c); setShowAddMemberModal(false); }}>
                      Invite
                    </button>
                  </div>
                ))}
              </div>
              <button style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }} onClick={() => setShowAddMemberModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Call Toolbar Controls */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={12} color="#22c55e" /> Audio Bitrate: 320 kbps · HD Audio Active
          </div>

          {/* Action Control Buttons */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={toggleMute} style={{
              background: callState.isMuted ? '#ef4444' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${callState.isMuted ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }} title={callState.isMuted ? 'Unmute Mic' : 'Mute Mic'}>
              {callState.isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button onClick={toggleVideo} style={{
              background: callState.isVideoOff ? 'rgba(255,255,255,0.08)' : 'rgba(29, 140, 255, 0.2)',
              border: `1px solid ${callState.isVideoOff ? 'rgba(255,255,255,0.15)' : 'rgba(29, 140, 255, 0.4)'}`,
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: callState.isVideoOff ? '#94a3b8' : '#1d8cff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }} title={callState.isVideoOff ? 'Start Camera' : 'Stop Camera'}>
              {callState.isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>

            <button onClick={toggleScreenShare} style={{
              background: callState.isScreenSharing ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${callState.isScreenSharing ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: callState.isScreenSharing ? '#a78bfa' : '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }} title="Share Screen">
              {callState.isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
            </button>

            <button onClick={endCall} style={{
              background: '#ef4444',
              border: 'none',
              borderRadius: 24,
              padding: '0 24px',
              height: 48,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
            }} title="Hang Up Call">
              <PhoneOff size={18} /> End Call
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="/collaboration-room" target="_blank" rel="noopener noreferrer" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              color: '#a78bfa',
              textDecoration: 'none',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              borderRadius: 8,
              padding: '6px 12px'
            }}>
              <MessageSquare size={12} /> War Room Chat <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
