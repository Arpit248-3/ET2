import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, MessageSquare, CheckCircle, Clock, Send, RefreshCw, AlertCircle, Filter, User, Sparkles } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api/help';

export default function AdminPortal() {
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [filter, setFilter] = useState('ALL');

  // Verify Admin Access
  const isAdmin = currentUser?.email === 'arpitjham1@gmail.com' || currentUser?.role === 'System Administrator';

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/tickets`);
      const data = await res.json();
      if (data.success && data.tickets) {
        setTickets(data.tickets);
        if (!selectedTicket && data.tickets.length > 0) {
          setSelectedTicket(data.tickets[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin tickets:', err);
      addToast('Failed to load user tickets from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSendReply = async () => {
    if (!selectedTicket) return;
    if (!replyText.trim()) {
      addToast('Reply message cannot be empty', 'warning');
      return;
    }

    setSendingReply(true);
    try {
      const res = await fetch(`${API_BASE}/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Failed to send reply');

      addToast(`✓ Reply sent to ${selectedTicket.user_email}! Email dispatched via Gmail SMTP.`, 'success');
      setReplyText('');
      
      // Update local state
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'RESOLVED', admin_reply: replyText.trim() } : t));
      setSelectedTicket(prev => prev ? { ...prev, status: 'RESOLVED', admin_reply: replyText.trim() } : null);
    } catch (err) {
      console.error('Reply error:', err);
      addToast(err.message || 'Failed to dispatch reply', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filter === 'OPEN') return t.status === 'OPEN';
    if (filter === 'RESOLVED') return t.status === 'RESOLVED';
    return true;
  });

  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

  return (
    <DashboardLayout>
      <PageHeader
        title="Admin Support Command Portal"
        subtitle="Manage user queries, dispatch official resolution responses, and monitor system help desk"
        badge={{ label: "ADMINISTRATOR ONLY", color: "#a855f7" }}
        actions={
          <button className="btn btn-secondary btn-sm" onClick={fetchTickets} disabled={loading}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none', marginRight: 6 }} />
            Refresh Tickets
          </button>
        }
      />

      {/* Admin Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <GlassCard style={{ background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.25)', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, color: '#c084fc', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Total Received Queries
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginTop: 4 }}>
                {tickets.length}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
              <MessageSquare size={20} />
            </div>
          </div>
        </GlassCard>

        <GlassCard style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.25)', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, color: '#f87171', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Pending Response (Open)
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#ef4444', marginTop: 4 }}>
                {openCount}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <Clock size={20} />
            </div>
          </div>
        </GlassCard>

        <GlassCard style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.25)', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Resolved & Responded
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#22c55e', marginTop: 4 }}>
                {resolvedCount}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
              <CheckCircle size={20} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Admin Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
        
        {/* Left Column: Tickets List */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', height: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={14} color="#00e5ff" /> User Help Tickets
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.3)', padding: 3, borderRadius: 8 }}>
              {['ALL', 'OPEN', 'RESOLVED'].map(st => (
                <button
                  key={st}
                  onClick={() => setFilter(st)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    background: filter === st ? 'rgba(0,229,255,0.2)' : 'transparent',
                    color: filter === st ? '#00e5ff' : 'var(--text-dim)',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} /> Loading user tickets...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 12 }}>
                No tickets match the selected filter.
              </div>
            ) : (
              filteredTickets.map(t => {
                const isSelected = selectedTicket?.id === t.id;
                const isOpen = t.status === 'OPEN';

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTicket(t);
                      setReplyText(t.admin_reply || '');
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#00e5ff' }}>
                        #TICK-{t.id}
                      </span>
                      <span style={{
                        fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                        background: isOpen ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                        color: isOpen ? '#ef4444' : '#22c55e',
                        border: `1px solid ${isOpen ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`
                      }}>
                        {t.status}
                      </span>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.subject}
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={11} color="var(--text-dim)" /> {t.user_email}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>

        {/* Right Column: Selected Ticket Details & Official Reply Box */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', height: '640px', background: 'rgba(8,18,38,0.95)', borderColor: 'rgba(0,229,255,0.25)' }}>
          {selectedTicket ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header */}
              <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--border-soft)', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#00e5ff', letterSpacing: '0.08em' }}>
                    TICKET INQUIRY #{selectedTicket.id}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    Submitted: {new Date(selectedTicket.created_at).toLocaleString()}
                  </span>
                </div>

                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                  {selectedTicket.subject}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#c084fc', background: 'rgba(168,85,247,0.1)', padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(168,85,247,0.2)' }}>
                  <Mail size={13} />
                  <span>Sender Email: <strong>{selectedTicket.user_email}</strong></span>
                </div>
              </div>

              {/* User Message Box */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 4 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
                    User Inquiry Query Message:
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, padding: '14px 16px', fontSize: 13, color: '#e2e8f0', lineHeight: 1.6,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedTicket.message}
                  </div>
                </div>

                {/* Existing Admin Reply if resolved */}
                {selectedTicket.admin_reply && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
                      Previous Admin Response (Sent to User Email):
                    </div>
                    <div style={{
                      background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)',
                      borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#4ade80', lineHeight: 1.5
                    }}>
                      {selectedTicket.admin_reply}
                    </div>
                  </div>
                )}
              </div>

              {/* Official Response Composer */}
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#00e5ff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} /> Compose Official Admin Response (Dispatches Email via Gmail SMTP):
                </div>

                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Write official resolution response to ${selectedTicket.user_email}...`}
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'rgba(0,229,255,0.03)',
                    border: '1px solid rgba(0,229,255,0.25)',
                    borderRadius: 8,
                    color: '#fff',
                    padding: '12px 14px',
                    fontSize: 12.5,
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.5,
                    marginBottom: 10,
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply}
                    className="btn btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #00e5ff, #3b82f6)',
                      border: 'none',
                      padding: '8px 20px',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {sendingReply ? (
                      <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Send size={14} />
                    )}
                    {sendingReply ? 'Dispatching Email...' : 'Send Official Response & Email User 🚀'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <MessageSquare size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontSize: 13 }}>Select a ticket from the left column to review and respond.</p>
            </div>
          )}
        </GlassCard>

      </div>
    </DashboardLayout>
  );
}
