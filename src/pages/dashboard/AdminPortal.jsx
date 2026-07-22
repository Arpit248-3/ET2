import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Send, CheckCircle, Clock, MessageSquare, RefreshCw, UserCheck, Search, Filter, AlertCircle, Sparkles } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { fetchAdminTickets, replyAdminTicket, fetchUsers } from '../../services/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminPortal() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('queries'); // 'queries' | 'users'
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected ticket for reply modal/panel
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const ticketRes = await fetchAdminTickets();
      if (ticketRes && ticketRes.tickets) {
        setTickets(ticketRes.tickets);
      }

      const userRes = await fetchUsers();
      if (userRes && Array.isArray(userRes)) {
        setUsers(userRes);
      }
    } catch (err) {
      console.warn('Failed to load admin data:', err);
      addToast('Error loading admin portal data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleSelectTicket = (t) => {
    setSelectedTicket(t);
    setReplyText(t.admin_reply || '');
  };

  const handleSendReply = async () => {
    if (!selectedTicket) return;
    if (!replyText.strip && !replyText.trim()) {
      addToast('Please enter a response message.', 'warning');
      return;
    }

    setReplying(true);
    try {
      const res = await replyAdminTicket(selectedTicket.id, { reply: replyText.trim() });
      addToast(`✓ Response sent to ${selectedTicket.user_email}! Ticket #${selectedTicket.id} marked RESOLVED.`, 'success');
      
      // Update local ticket state
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, admin_reply: replyText.trim(), status: 'RESOLVED' } : t));
      setSelectedTicket(prev => prev ? { ...prev, admin_reply: replyText.trim(), status: 'RESOLVED' } : null);
      setReplyText('');
    } catch (err) {
      console.error('Failed to send admin reply:', err);
      addToast(err.message || 'Failed to dispatch email reply.', 'error');
    } finally {
      setReplying(false);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    const matchesFilter = filterStatus === 'ALL' || t.status === filterStatus;
    const matchesSearch = !searchQuery || 
      t.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

  return (
    <DashboardLayout>
      <PageHeader
        title="Admin Portal — Support & Operations Command"
        subtitle="Manage user queries, respond to help tickets via automated Gmail SMTP, and oversee platform operators"
        badge={{ label: 'SYSTEM ADMIN', color: '#8b5cf6' }}
        actions={
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadAdminData}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh Inbox
          </button>
        }
      />

      {/* Quick Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        <GlassCard style={{ padding: '16px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Support Tickets</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginTop: 4 }}>{tickets.length}</div>
            </div>
            <MessageSquare size={24} color="#8b5cf6" style={{ opacity: 0.8 }} />
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '16px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Open Inquiries</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444', marginTop: 4 }}>{openCount}</div>
            </div>
            <Clock size={24} color="#ef4444" style={{ opacity: 0.8 }} />
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '16px', borderLeft: '4px solid #22c55e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolved Queries</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#22c55e', marginTop: 4 }}>{resolvedCount}</div>
            </div>
            <CheckCircle size={24} color="#22c55e" style={{ opacity: 0.8 }} />
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '16px', borderLeft: '4px solid #00e5ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gmail Dispatch Server</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#00e5ff', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                arpitjham1@gmail.com
              </div>
            </div>
            <Mail size={24} color="#00e5ff" style={{ opacity: 0.8 }} />
          </div>
        </GlassCard>
      </div>

      {/* Tab Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button
          onClick={() => setActiveTab('queries')}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: activeTab === 'queries' ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${activeTab === 'queries' ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
            color: activeTab === 'queries' ? '#a78bfa' : 'var(--text-dim)',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
          }}
        >
          <MessageSquare size={15} /> User Help Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: activeTab === 'users' ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${activeTab === 'users' ? '#00e5ff' : 'rgba(255,255,255,0.1)'}`,
            color: activeTab === 'users' ? '#00e5ff' : 'var(--text-dim)',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
          }}
        >
          <UserCheck size={15} /> Registered Operators ({users.length})
        </button>
      </div>

      {activeTab === 'queries' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 16 }}>
          
          {/* Left Column: Tickets Table */}
          <GlassCard style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              
              {/* Search */}
              <div style={{ position: 'relative', minWidth: 220 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Search email, subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)',
                    borderRadius: 6, padding: '7px 10px 7px 32px', fontSize: 12, color: '#fff', outline: 'none'
                  }}
                />
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Filter size={13} color="var(--text-dim)" />
                {['ALL', 'OPEN', 'RESOLVED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: filterStatus === st ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${filterStatus === st ? '#00e5ff' : 'rgba(255,255,255,0.08)'}`,
                      color: filterStatus === st ? '#00e5ff' : 'var(--text-dim)',
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Tickets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflowY: 'auto' }}>
              {filteredTickets.length > 0 ? (
                filteredTickets.map(t => {
                  const isSelected = selectedTicket?.id === t.id;
                  const isOpen = t.status === 'OPEN';

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTicket(t)}
                      style={{
                        padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                        background: isSelected ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? '#8b5cf6' : 'rgba(255,255,255,0.06)'}`,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
                          #{t.id} — {t.subject}
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                          background: isOpen ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                          color: isOpen ? '#ef4444' : '#22c55e',
                          border: `1px solid ${isOpen ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                        }}>
                          {t.status}
                        </span>
                      </div>

                      <div style={{ fontSize: 11, color: '#00e5ff', fontWeight: 600, marginBottom: 6 }}>
                        📩 {t.user_email}
                      </div>

                      <div style={{
                        fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>
                        {t.message}
                      </div>

                      {t.created_at && (
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 6, textAlign: 'right' }}>
                          Submitted: {new Date(t.created_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-dim)', fontSize: 13 }}>
                  No support tickets found matching criteria.
                </div>
              )}
            </div>
          </GlassCard>

          {/* Right Column: Ticket Inspection & Reply Form */}
          <div>
            {selectedTicket ? (
              <GlassCard style={{ background: 'rgba(8,18,38,0.95)', border: '1px solid rgba(139,92,246,0.3)', padding: '18px' }}>
                
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Responding to Ticket #{selectedTicket.id}
                </div>

                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
                  {selectedTicket.subject}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 12, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#00e5ff', fontWeight: 600, marginBottom: 4 }}>
                    From: {selectedTicket.user_email}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {selectedTicket.message}
                  </div>
                </div>

                {selectedTicket.admin_reply && (
                  <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: 12, marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, marginBottom: 4 }}>
                      ✓ Previous Admin Response:
                    </div>
                    <div style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {selectedTicket.admin_reply}
                    </div>
                  </div>
                )}

                {/* Reply Input Box */}
                <div style={{ marginTop: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
                    Admin Response Message (will be emailed to {selectedTicket.user_email}):
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Type your response to the user query..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.3)',
                      borderRadius: 8, padding: 10, fontSize: 12, color: '#fff', outline: 'none',
                      boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical'
                    }}
                  />

                  <button
                    onClick={handleSendReply}
                    disabled={replying}
                    className="btn btn-primary"
                    style={{
                      width: '100%', marginTop: 12, background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    {replying ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    {replying ? 'Dispatching Email...' : 'Send Response & Resolve Ticket'}
                  </button>
                </div>
              </GlassCard>
            ) : (
              <GlassCard style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-dim)' }}>
                <Mail size={32} color="#8b5cf6" style={{ marginBottom: 10, opacity: 0.5 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Select a Support Ticket</div>
                <div style={{ fontSize: 12, maxWidth: 280, margin: '0 auto' }}>
                  Click any ticket on the left to inspect the user's inquiry and dispatch an email reply.
                </div>
              </GlassCard>
            )}
          </div>

        </div>
      ) : (
        /* Users Tab */
        <GlassCard style={{ padding: '16px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            Registered Platform Operators ({users.length})
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '10px' }}>Operator</th>
                  <th style={{ padding: '10px' }}>Email</th>
                  <th style={{ padding: '10px' }}>Role</th>
                  <th style={{ padding: '10px' }}>Phone Number</th>
                  <th style={{ padding: '10px' }}>Clearance</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px', fontWeight: 700, color: '#fff' }}>{u.name}</td>
                    <td style={{ padding: '10px', color: '#00e5ff' }}>{u.email}</td>
                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{u.role}</td>
                    <td style={{ padding: '10px', color: '#f59e0b' }}>{u.phone || 'N/A'}</td>
                    <td style={{ padding: '10px', color: 'var(--text-dim)' }}>{u.clearance_level || 'LEVEL-2'}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#22c55e', background: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: 4 }}>
                        {u.status || 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </DashboardLayout>
  );
}
