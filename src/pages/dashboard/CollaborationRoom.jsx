import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users2, MessageSquare, Send, Paperclip, Video, Phone, RefreshCw, AlertTriangle, Wifi, WifiOff, Zap, Shield } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { fetchCollabRooms, fetchCollabMessages, addCollabMessage, getWebSocketUrl } from '../../services/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';

const DEFAULT_ROOMS = [
  { id: 'war-room', name: 'National Crisis War Room', description: 'Strategic escalation and joint operational command', type: 'EMERGENCY' },
  { id: 'spr-tactical', name: 'SPR Tactical Release Channel', description: 'Real-time drawdowns and site logistics coordination', type: 'OPERATIONS' },
  { id: 'compliance-shield', name: 'Sanctions & Compliance Ops', description: 'OFAC, vessel tracking, and trade risk legal team', type: 'INTELLIGENCE' },
];

const MEMBERS = [
  { name: 'Arjun Mehta', role: 'Commander, NEMC', avatar: 'AM', online: true },
  { name: 'Sneha Sharma', role: 'Intelligence Analyst', avatar: 'SS', online: true },
  { name: 'Vikram Nair', role: 'SPR Operations Lead', avatar: 'VN', online: true },
  { name: 'UrjaNetra AI', role: 'AI Copilot', avatar: 'AI', online: true, isAI: true },
];

const typeColor = { EMERGENCY: '#ef4444', OPERATIONS: '#f59e0b', INTELLIGENCE: '#1d8cff' };

export default function CollaborationRoom() {
  const { backendOnline } = useScenario();
  const { addToast } = useToast();

  const [roomsList, setRoomsList] = useState(DEFAULT_ROOMS);
  const [activeRoom, setActiveRoom] = useState(DEFAULT_ROOMS[0]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsConnecting, setWsConnecting] = useState(false);

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load REST rooms
  const loadRooms = useCallback(async () => {
    try {
      const data = await fetchCollabRooms();
      const rooms = data?.rooms || data;
      if (Array.isArray(rooms) && rooms.length > 0) {
        const mapped = rooms.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
          type: r.id.includes('crisis') || r.id.includes('war') ? 'EMERGENCY' : r.id.includes('spr') ? 'OPERATIONS' : 'INTELLIGENCE',
        }));
        setRoomsList(mapped);
        setActiveRoom(prev => mapped.find(m => m.id === prev?.id) || mapped[0]);
      }
    } catch (err) {
      console.warn('[Collaboration] Rooms API offline, using defaults:', err);
    }
  }, []);

  // Load historical messages via REST
  const loadMessages = useCallback(async (roomId) => {
    setLoading(true);
    try {
      const data = await fetchCollabMessages(roomId);
      const msgs = data?.messages || data;
      if (Array.isArray(msgs)) {
        setMessages(msgs.map(m => ({
          id: m.id,
          from: m.sender || m.from,
          role: m.role || m.sender_role || '',
          avatar: m.avatar || (m.sender || '').slice(0, 2).toUpperCase(),
          text: m.message || m.text,
          time: m.timestamp || m.time,
          isAI: (m.sender || m.from || '').toLowerCase().includes('ai'),
          isSelf: (m.sender || m.from) === 'Arjun Mehta',
        })));
      }
    } catch (err) {
      console.warn('[Collaboration] Messages API offline:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket connection manager with auto-reconnect
  const connectWebSocket = useCallback((roomId) => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

    setWsConnecting(true);
    setWsConnected(false);

    const url = getWebSocketUrl(`/ws/collaboration/${roomId}`);
    let ws;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      console.warn('[WS] Construction error:', err);
      setWsConnecting(false);
      return;
    }

    ws.onopen = () => {
      setWsConnected(true);
      setWsConnecting(false);
      addToast(`Connected to ${roomId} war room`, 'success');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages(prev => {
          // Avoid duplicate messages from optimistic updates
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, {
            id: data.id,
            from: data.sender,
            role: data.role || '',
            avatar: data.avatar || data.sender?.slice(0, 2).toUpperCase(),
            text: data.message,
            time: data.timestamp,
            isAI: (data.sender || '').toLowerCase().includes('ai'),
            isSelf: data.sender === 'Arjun Mehta',
            type: data.type,
          }];
        });
      } catch (e) {
        console.warn('[WS] Parse error:', e);
      }
    };

    ws.onerror = () => {
      setWsConnected(false);
      setWsConnecting(false);
    };

    ws.onclose = () => {
      setWsConnected(false);
      setWsConnecting(false);
      // Auto-reconnect after 4 seconds
      reconnectTimerRef.current = setTimeout(() => {
        connectWebSocket(roomId);
      }, 4000);
    };

    wsRef.current = ws;
  }, [addToast]);

  // Disconnect WebSocket on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  // Initialize rooms on mount
  useEffect(() => { loadRooms(); }, [loadRooms]);

  // When room changes: load history + connect WS
  useEffect(() => {
    if (!activeRoom) return;
    loadMessages(activeRoom.id);
    connectWebSocket(activeRoom.id);
  }, [activeRoom?.id]);

  const handleSend = async () => {
    if (!input.trim() || !activeRoom) return;
    const textToSend = input.trim();
    setInput('');

    const optimisticMsg = {
      id: `opt-${Date.now()}`,
      from: 'Arjun Mehta',
      role: 'Commander, NEMC',
      avatar: 'AM',
      text: textToSend,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      isSelf: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        sender: 'Arjun Mehta',
        role: 'Commander, NEMC',
        message: textToSend,
        type: 'CHAT',
        avatar: 'AM',
      }));
    } else {
      // Fallback: REST POST
      try {
        await addCollabMessage(activeRoom.id, {
          sender: 'Arjun Mehta',
          role: 'Commander, NEMC',
          message: textToSend,
          avatar: 'AM',
        });
      } catch (err) {
        addToast('Failed to post message to backend', 'error');
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRoomChange = (room) => {
    setActiveRoom(room);
    setMessages([]);
  };

  return (
    <DashboardLayout>
      {!backendOnline && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} /><span>Collaboration backend offline — messages may not persist.</span>
        </div>
      )}

      <PageHeader
        title="Collaboration War Room"
        subtitle="Real-time secure communication for energy crisis response and national command coordination"
        badge={{ label: 'ENCRYPTED', color: '#22c55e' }}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: wsConnected ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${wsConnected ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: wsConnected ? '#22c55e' : '#ef4444' }}>
              {wsConnecting ? <RefreshCw size={10} className="animate-spin" /> : wsConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
              {wsConnecting ? 'CONNECTING...' : wsConnected ? 'WS LIVE' : 'WS OFFLINE'}
            </div>
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }} onClick={() => addToast('Video conference session initialized', 'success')}><Video size={13} />Video Call</button>
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }} onClick={() => addToast('Secure audio link active', 'success')}><Phone size={13} />Voice</button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr 200px', gap: 14, height: 'calc(100vh - 190px)' }}>
        {/* Room List */}
        <GlassCard className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-soft)', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            War Rooms
            <RefreshCw size={12} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={loadRooms} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {roomsList.map(room => (
              <div key={room.id} onClick={() => handleRoomChange(room)}
                style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: activeRoom?.id === room.id ? 'rgba(29,140,255,0.08)' : 'transparent', borderLeft: activeRoom?.id === room.id ? '3px solid #1d8cff' : '3px solid transparent', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{room.name}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4, lineHeight: 1.4 }}>{room.description}</div>
                <span style={{ color: typeColor[room.type] || '#1d8cff', fontWeight: 700, fontSize: 9 }}>{room.type}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Chat Area */}
        <GlassCard className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {activeRoom?.name}
                {wsConnected && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{MEMBERS.length} members · End-to-end encrypted · WebSocket Live</div>
            </div>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${typeColor[activeRoom?.type] || '#1d8cff'}18`, color: typeColor[activeRoom?.type] || '#1d8cff', border: `1px solid ${typeColor[activeRoom?.type] || '#1d8cff'}30` }}>
              {activeRoom?.type}
            </span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading && (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, padding: 20 }}>
                <RefreshCw size={14} className="animate-spin" style={{ marginRight: 6 }} />Loading messages...
              </div>
            )}
            {messages.length === 0 && !loading && (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, padding: '40px 20px' }}>
                <MessageSquare size={28} style={{ marginBottom: 10, opacity: 0.4 }} /><br />
                No messages yet. Start the secure briefing.
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={msg.id || i} style={{ display: 'flex', gap: 10, flexDirection: msg.isSelf ? 'row-reverse' : 'row' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: msg.isAI ? 'linear-gradient(135deg, #1d8cff, #8b5cf6)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: msg.isAI ? '#fff' : 'var(--text-secondary)', flexShrink: 0 }}>
                  {msg.avatar}
                </div>
                <div style={{ maxWidth: '70%' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4, textAlign: msg.isSelf ? 'right' : 'left' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>{msg.from}</strong>
                    {msg.role && <span style={{ opacity: 0.6 }}> · {msg.role}</span>}
                    <span style={{ opacity: 0.5 }}> · {msg.time}</span>
                  </div>
                  <div style={{ background: msg.isSelf ? 'rgba(29,140,255,0.15)' : msg.isAI ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${msg.isSelf ? 'rgba(29,140,255,0.2)' : msg.isAI ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: msg.isSelf ? '12px 4px 12px 12px' : '4px 12px 12px 12px', padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-soft)', display: 'flex', gap: 8, flexShrink: 0 }}>
            <button style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '0 10px', cursor: 'pointer', color: 'var(--text-dim)' }} onClick={() => addToast('File upload restricted in secure mode', 'warning')}><Paperclip size={14} /></button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Secure message to ${activeRoom?.name}...`}
              style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }}
            />
            <button className="btn btn-primary" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 5 }} onClick={handleSend}>
              <Send size={13} />Send
            </button>
          </div>
        </GlassCard>

        {/* Members Panel */}
        <GlassCard className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-soft)', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Members ({MEMBERS.length})
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {MEMBERS.map(m => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: m.isAI ? 'linear-gradient(135deg, #1d8cff, #8b5cf6)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: m.isAI ? '#fff' : 'var(--text-secondary)' }}>{m.avatar}</div>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 7, height: 7, borderRadius: '50%', background: m.online ? '#22c55e' : 'var(--text-dim)', border: '1.5px solid var(--bg-panel)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{m.role}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Quick Actions */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-soft)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Actions</div>
            <button className="btn btn-secondary" style={{ width: '100%', fontSize: 11, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => { if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ sender: 'UrjaNetra AI', role: 'AI Copilot', message: '⚡ SYSTEM ALERT: Risk threshold breached. All stations report readiness.', type: 'ALERT', avatar: 'AI' })); addToast('System alert broadcast sent', 'warning'); }}>
              <Zap size={11} style={{ color: '#f59e0b' }} />Broadcast Alert
            </button>
            <button className="btn btn-secondary" style={{ width: '100%', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => addToast('Secure session lock requested', 'info')}>
              <Shield size={11} style={{ color: '#22c55e' }} />Lock Session
            </button>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
