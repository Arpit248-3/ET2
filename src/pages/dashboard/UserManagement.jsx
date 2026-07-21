import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Shield, Edit, Trash2, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { fetchUsers, inviteUser, updateUser, deleteUser } from '../../services/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';

const clearanceColors = { 'TOP SECRET': '#ef4444', 'SECRET': '#f59e0b', 'CONFIDENTIAL': '#1d8cff', 'RESTRICTED': '#22c55e' };

export default function UserManagement() {
  const { backendOnline } = useScenario();
  const { addToast } = useToast();
  const [usersList, setUsersList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Resilience Analyst' });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      if (data && Array.isArray(data)) {
        const mapped = data.map((u, i) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          dept: u.role === 'Commander' ? 'NEMC' : 'Operations',
          clearance: u.role === 'Commander' ? 'TOP SECRET' : 'SECRET',
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

      <PageHeader title="User Management" subtitle="Access control, clearance levels, and role assignment for all platform users"
        badge={{ label: `${usersList.length} USERS`, color: '#1d8cff' }}
        actions={
          <button className="btn btn-primary" onClick={() => setShowInviteModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <Plus size={13} />Invite User
          </button>
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
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: `${clearanceColors[user.clearance] || '#1d8cff'}18`, color: clearanceColors[user.clearance] || '#1d8cff', border: `1px solid ${clearanceColors[user.clearance] || '#1d8cff'}30` }}>
                      <Shield size={9} style={{ marginRight: 4, verticalAlign: 'middle' }} />{user.clearance}
                    </span>
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
    </DashboardLayout>
  );
}
