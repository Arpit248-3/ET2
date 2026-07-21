import React, { useState, useEffect } from 'react';
import { Users2, MessageSquare, Send, Paperclip, Video, Phone, Circle, RefreshCw, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { fetchCollabRooms, fetchCollabMessages, addCollabMessage } from '../../services/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';

const defaultMembers = [
  { name: 'Arjun Mehta', role: 'Commander', avatar: 'AM', online: true },
  { name: 'Sneha Sharma', role: 'Analyst', avatar: 'SS', online: true },
  { name: 'UrjaNetra AI', role: 'AI Copilot', avatar: 'AI', online: true, isAI: true },
];

export default function CollaborationRoom() {
  const { backendOnline } = useScenario();
  const { addToast } = useToast();
  const [roomsList, setRoomsList] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const loadRooms = async () => {
    try {
      const data = await fetchCollabRooms();
      if (data && Array.isArray(data)) {
        const mapped = data.map(r => ({
          id: r.id,
          name: r.name,
          active: true,
          members: 3,
          unread: 0,
          lastMsg: r.description || 'Channel open',
          time: 'Just now',
          type: r.id.includes('crisis') ? 'EMERGENCY' : 'OPERATIONS'
        }));
        setRoomsList(mapped);
        if (mapped.length > 0) {
          setActiveRoom(prev => (prev ? mapped.find(m => m.id === prev.id) || mapped[0] : mapped[0]));
        }
      }
    } catch (err) {
      console.warn('Rooms API offline, using cached fallback:', err);
    }
  };

  const loadMessages = async (roomId) => {
    setLoading(true);
    try {
      const data = await fetchCollabMessages(roomId);
      if (data && Array.isArray(data)) {
        const mapped = data.map(m => ({
          from: m.sender,
          avatar: m.avatar || 'US',
          text: m.message,
          time: m.timestamp,
          isAI: m.sender.includes('AI') || m.sender.includes('Bot'),
          isSelf: m.sender === 'Arjun Mehta'
        }));
        setMessages(mapped);
      }
    } catch (err) {
      console.warn('Messages API offline, using fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeRoom) return;
    const textToSend = input;
    setInput('');

    try {
      // Optimistic update
      setMessages(prev => [...prev, { from: 'Arjun Mehta', avatar: 'AM', text: textToSend, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), isSelf: true }]);
      await addCollabMessage(activeRoom.id, {
        sender: 'Arjun Mehta',
        sender_role: 'Commander',
        message: textToSend,
        avatar: 'AM'
      });
      loadMessages(activeRoom.id);
    } catch (err) {
      addToast('Failed to post message to backend', 'error');
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (activeRoom) {
      loadMessages(activeRoom.id);
    }
  }, [activeRoom]);

  const typeColor = { EMERGENCY: '#ef4444', OPERATIONS: '#f59e0b', INTELLIGENCE: '#1d8cff' };

  if (roomsList.length === 0 && !backendOnline) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <Users2 size={48} style={{ color: '#f59e0b' }} />
          <h2>Collaboration Room Offline</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra AI backend, and no cached collaboration channels are available.</p>
          <button className="btn btn-primary" onClick={loadRooms}>
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Retry Connection
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {!backendOnline && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 8,
          padding: '10px 16px',
          marginBottom: 16,
          fontSize: 12,
          color: '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <AlertTriangle size={14} />
          <span>Showing last known intelligence state (Offline)</span>
        </div>
      )}
      <PageHeader title="Collaboration Room" subtitle="Secure real-time communication for energy crisis response teams"
        badge={{ label: 'ENCRYPTED', color: '#22c55e' }}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }} onClick={() => addToast('Conference session initialized', 'success')}><Video size={13} />Video Call</button>
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }} onClick={() => addToast('Audio link active', 'success')}><Phone size={13} />Voice</button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 200px', gap: 14, height: 'calc(100vh - 180px)' }}>
        {/* Room List */}
        <GlassCard className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-soft)', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Rooms <RefreshCw size={12} className={loading ? 'animate-spin' : ''} style={{ display: 'inline-block', marginLeft: 6, cursor: 'pointer' }} onClick={loadRooms} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {roomsList.map(room => (
              <div key={room.id} onClick={() => setActiveRoom(room)}
                style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: activeRoom?.id === room.id ? 'rgba(29,140,255,0.08)' : 'transparent', borderLeft: activeRoom?.id === room.id ? '3px solid #1d8cff' : '3px solid transparent', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{room.name}</span>
                  {room.unread > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{room.unread}</span>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>{room.lastMsg}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 10 }}>
                  <span style={{ color: typeColor[room.type] || '#1d8cff', fontWeight: 600 }}>{room.type}</span>
                  <span style={{ color: 'var(--text-dim)' }}>· {room.members} members</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Chat Area */}
        <GlassCard className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Chat Header */}
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{activeRoom?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{activeRoom?.members} members · End-to-end encrypted</div>
            </div>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${typeColor[activeRoom?.type] || '#1d8cff'}18`, color: typeColor[activeRoom?.type] || '#1d8cff', border: `1px solid ${typeColor[activeRoom?.type] || '#1d8cff'}30` }}>{activeRoom?.type}</span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, flexDirection: msg.isSelf ? 'row-reverse' : 'row' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: msg.isAI ? 'linear-gradient(135deg, #1d8cff, #8b5cf6)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: msg.isAI ? '#fff' : 'var(--text-secondary)', flexShrink: 0 }}>{msg.avatar}</div>
                <div style={{ maxWidth: '70%' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4, textAlign: msg.isSelf ? 'right' : 'left' }}>{msg.from} · {msg.time}</div>
                  <div style={{ background: msg.isSelf ? 'rgba(29,140,255,0.15)' : msg.isAI ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${msg.isSelf ? 'rgba(29,140,255,0.2)' : msg.isAI ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: msg.isSelf ? '12px 4px 12px 12px' : '4px 12px 12px 12px', padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-soft)', display: 'flex', gap: 8 }}>
            <button style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '0 10px', cursor: 'pointer', color: 'var(--text-dim)' }} onClick={() => addToast('Upload restricted in demo', 'warning')}><Paperclip size={14} /></button>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type a secure message..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }} />
            <button className="btn btn-primary" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 5 }} onClick={handleSend}>
              <Send size={13} />Send
            </button>
          </div>
        </GlassCard>

        {/* Members */}
        <GlassCard className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-soft)', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Members ({defaultMembers.length})</div>
          <div style={{ overflowY: 'auto' }}>
            {defaultMembers.map(m => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ position: 'relative' }}>
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
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
