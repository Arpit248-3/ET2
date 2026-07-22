import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Shield, Edit, Trash2, CheckCircle, RefreshCw, AlertTriangle, Mail, MessageSquare, Send, Loader, Inbox } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { fetchUsers, inviteUser, updateUser, deleteUser, fetchAdminTickets, replyAdminTicket } from '../../services/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';

const clearanceColors = { 'TOP SECRET': '#ef4444', 'SECRET': '#f59e0b', 'CONFIDENTIAL': '#1d8cff', 'RESTRICTED': '#22c55e' };

export default function UserManagement() {
  const { backendOnline } = useScenario();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'inbox'
  const [usersList, setUsersList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Resilience Analyst' });

  // Support Inbox state
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [replyTexts, setReplyTexts] = useState({});
  const [replyingId, setReplyingId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // First try real registered users from auth endpoint
      const authRes = await fetch('http://localhost:8000/api/auth/all-users');
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.users && Array.isArray(authData.users)) {
          const mapped = authData.users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone || '—',
            role: u.role,
            dept: u.department || u.role,
            designation: u.designation || u.role,
            clearance: u.clearance_level || 'LEVEL-2',
            status: u.status || 'ACTIVE',
            lastLogin: u.last_login ? new Date(u.last_login).toLocaleString() : 'First login pending',
            joinedAt: u.joined_at ? new Date(u.joined_at).toLocaleDateString() : '—',
            avatar: u.avatar || u.name?.slice(0, 2).toUpperCase() || 'US'
          }));
          setUsersList(mapped);
          return;
        }
      }
      // Fallback to original users API
      const data = await fetchUsers();
      if (data && Array.isArray(data)) {
        const mapped = data.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || '—',
          role: u.role,
          dept: u.role === 'Commander' ? 'NEMC' : 'Operations',
          clearance: u.clearance_level || (u.role === 'Commander' ? 'LEVEL-5' : 'LEVEL-2'),
          status: u.status || 'ACTIVE',
          lastLogin: 'Just now',
          avatar: u.avatar || 'US'
        }));
        setUsersList(mapped);
      }
    } catch (err) {
      console.warn('User API offline, using cached fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const data = await fetchAdminTickets();
      setTickets(data?.tickets || []);
    } catch (err) {
      console.warn('[Admin Inbox] Tickets API error:', err);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleSendReply = async (ticketId) => {
    const reply = replyTexts[ticketId]?.trim();
    if (!reply) { addToast('Reply cannot be empty.', 'warning'); return; }
    setReplyingId(ticketId);
    try {
      await replyAdminTicket(ticketId, { reply });
      addToast('Reply sent and ticket marked RESOLVED.', 'success');
      setReplyTexts(prev => ({ ...prev, [ticketId]: '' }));
      loadTickets();
    } catch (err) {
      addToast('Failed to send reply. Please retry.', 'error');
    } finally {
      setReplyingId(null);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;
    try {
      await inviteUser({
        name: inviteForm.name,
        email: inviteForm.email,
        role: inviteForm.role
      });
      addToast(`Invited ${inviteForm.name} successfully`, 'success');
      setShowInviteModal(false);
      setInviteForm({ name: '', email: '', role: 'Resilience Analyst' });
      loadUsers();
    } catch (err) {
      addToast('Failed to invite user', 'error');
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateUser(user.id, { status: nextStatus });
      addToast(`User status updated to ${nextStatus}`, 'success');
      loadUsers();
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this user?')) return;
    try {
      await deleteUser(id);
      addToast('User deleted successfully', 'success');
      loadUsers();
    } catch (err) {
      addToast('Failed to delete user', 'error');
    }
  };

  useEffect(() => {
    loadUsers();
    loadTickets();
  }, []);

  const filtered = usersList.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.dept.toLowerCase().includes(search.toLowerCase())
  );

  if (usersList.length === 0 && !backendOnline) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <Users size={48} style={{ color: '#f59e0b' }} />
          <h2>User Management Offline</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra AI backend, and no cached user accounts are available.</p>
          <button className="btn btn-primary" onClick={loadUsers}>
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

      <PageHeader title="User Management" subtitle="Access control, clearance levels, role assignments, and admin support inbox"
        badge={{ label: `${usersList.length} USERS`, color: '#1d8cff' }}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setActiveTab('users')}
              className={activeTab === 'users' ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Users size={13} />Operators
            </button>
            <button
              onClick={() => { setActiveTab('inbox'); loadTickets(); }}
              className={activeTab === 'inbox' ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Inbox size={13} />Support Inbox
              {tickets.filter(t => t.status === 'OPEN').length > 0 && (
                <span style={{ background: '#ef4444', color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>
                  {tickets.filter(t => t.status === 'OPEN').length}
                </span>
              )}
            </button>
            {activeTab === 'users' && (
              <button className="btn btn-primary" onClick={() => setShowInviteModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <Plus size={13} />Invite User
              </button>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Users', value: usersList.length, color: '#1d8cff' },
          { label: 'Active', value: usersList.filter(u => u.status === 'ACTIVE').length, color: '#22c55e' },
          { label: 'Top Secret', value: usersList.filter(u => u.clearance === 'TOP SECRET').length, color: '#ef4444' },
          { label: 'Departments', value: new Set(usersList.map(u => u.dept)).size, color: '#8b5cf6' },
        ].map(stat => (
          <GlassCard key={stat.label} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </GlassCard>
        ))}
      </div>

      {/* Invite Modal Overlay */}
      {showInviteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GlassCard style={{ padding: 24, width: 400, border: '1px solid var(--border-soft)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Invite New Operator</h3>
            <form onSubmit={handleInvite}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Full Name</label>
                <input required value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-soft)', borderRadius: 6, padding: 8, color: 'white' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Email Address</label>
                <input required type="email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-soft)', borderRadius: 6, padding: 8, color: 'white' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Role Designation</label>
                <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-soft)', borderRadius: 6, padding: 8, color: 'white' }}>
                  <option value="Commander">Commander</option>
                  <option value="Resilience Analyst">Resilience Analyst</option>
                  <option value="Security Director">Security Director</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send Invite</button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users by name, email, or department..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px 9px 32px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <button className="btn btn-secondary btn-icon" onClick={loadUsers} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Support Inbox Tab */}
      {activeTab === 'inbox' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={16} color="#1d8cff" />Admin Support Inbox
              <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 400 }}>({tickets.filter(t => t.status === 'OPEN').length} open)</span>
            </div>
            <button className="btn btn-secondary btn-icon" onClick={loadTickets} disabled={ticketsLoading}>
              <RefreshCw size={13} className={ticketsLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          {ticketsLoading && (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, padding: 30 }}>
              <RefreshCw size={16} className="animate-spin" style={{ marginRight: 6 }} />Loading tickets...
            </div>
          )}
          {!ticketsLoading && tickets.length === 0 && (
            <GlassCard className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <Inbox size={36} style={{ color: 'var(--text-dim)', marginBottom: 10 }} />
              <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>No support tickets received yet.</div>
            </GlassCard>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tickets.map(ticket => (
              <GlassCard key={ticket.id} className="card" style={{ padding: 18, borderLeft: `3px solid ${ticket.status === 'RESOLVED' ? '#22c55e' : '#ef4444'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>#{ticket.id} — {ticket.subject}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>From: {ticket.user_email} · {ticket.created_at ? new Date(ticket.created_at).toLocaleString('en-IN') : 'N/A'}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: ticket.status === 'RESOLVED' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: ticket.status === 'RESOLVED' ? '#22c55e' : '#ef4444', border: `1px solid ${ticket.status === 'RESOLVED' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                    {ticket.status}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px', marginBottom: 10, lineHeight: 1.6 }}>
                  {ticket.message}
                </div>
                {ticket.admin_reply && (
                  <div style={{ fontSize: 12, color: '#22c55e', background: 'rgba(34,197,94,0.06)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, borderLeft: '3px solid rgba(34,197,94,0.4)' }}>
                    <strong>Admin Reply:</strong> {ticket.admin_reply}
                  </div>
                )}
                {ticket.status === 'OPEN' && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <textarea
                      value={replyTexts[ticket.id] || ''}
                      onChange={e => setReplyTexts(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                      placeholder="Type your reply to send via email..."
                      rows={2}
                      style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                    />
                    <button
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, height: 'fit-content', padding: '9px 14px' }}
                      onClick={() => handleSendReply(ticket.id)}
                      disabled={replyingId === ticket.id}
                    >
                      {replyingId === ticket.id ? <Loader size={13} className="animate-spin" /> : <Send size={13} />}
                      {replyingId === ticket.id ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Total Users', value: usersList.length, color: '#1d8cff' },
              { label: 'Active', value: usersList.filter(u => u.status === 'ACTIVE').length, color: '#22c55e' },
              { label: 'Top Secret', value: usersList.filter(u => u.clearance === 'TOP SECRET').length, color: '#ef4444' },
              { label: 'Departments', value: new Set(usersList.map(u => u.dept)).size, color: '#8b5cf6' },
            ].map(stat => (
              <GlassCard key={stat.label} className="card" style={{ padding: '14px 18px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>{stat.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              </GlassCard>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
              <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users by name, email, or department..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px 9px 32px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button className="btn btn-secondary btn-icon" onClick={loadUsers} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Users Table */}
          <GlassCard className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    {['User', 'Role / Department', 'Clearance', 'Last Login', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(29,140,255,0.3), rgba(139,92,246,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#1d8cff', flexShrink: 0 }}>{user.avatar}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{user.role}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{user.dept}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1.2, background: user.clearance === 'TOP SECRET' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: user.clearance === 'TOP SECRET' ? '#ef4444' : '#f59e0b', border: `1px solid ${user.clearance === 'TOP SECRET' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                          <Shield size={11} style={{ flexShrink: 0 }} />
                          <span>{user.clearance}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text-secondary)' }}>{user.lastLogin}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => handleToggleStatus(user)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                          <StatusBadge status={user.status} />
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleToggleStatus(user)} style={{ background: 'rgba(29,140,255,0.1)', border: '1px solid rgba(29,140,255,0.2)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#1d8cff', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}><Edit size={11} />Toggle</button>
                          <button onClick={() => handleDelete(user.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}><Trash2 size={11} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}
    </DashboardLayout>
  );
}
