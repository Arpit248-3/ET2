import React, { useState, useEffect } from 'react';
import { HelpCircle, Search, ChevronDown, ChevronRight, BookOpen, MessageSquare, Mail, Send, CheckCircle, RefreshCw, AlertTriangle, Loader } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { fetchHelpCenter, submitHelpTicket } from '../../services/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useScenario } from '../../context/ScenarioContext.jsx';

const guides = [
  { title: 'Getting Started with UrjaNetra AI', desc: 'Platform overview and first-time setup guide', icon: BookOpen, color: '#1d8cff' },
  { title: 'Understanding the Risk Intelligence Engine', desc: 'How AI processes signals and generates alerts', icon: HelpCircle, color: '#8b5cf6' },
];

const EMPTY_TICKET = { user_email: '', subject: '', message: '' };

export default function HelpCenter() {
  const { backendOnline } = useScenario();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [faqsList, setFaqsList] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [faqsLoading, setFaqsLoading] = useState(false);

  // Support ticket state
  const [ticket, setTicket] = useState(EMPTY_TICKET);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const loadFaqs = async (query = '') => {
    setFaqsLoading(true);
    try {
      const data = await fetchHelpCenter(query);
      if (data && Array.isArray(data)) {
        const mapped = data.map(item => ({
          q: item.title || item.question || 'Help Article',
          a: item.summary || item.answer || item.detail || 'No details available.'
        }));
        setFaqsList(mapped);
      }
    } catch (err) {
      console.warn('Help Center API offline, using fallback:', err);
    } finally {
      setFaqsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => loadFaqs(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleTicketChange = (key, val) => setTicket(prev => ({ ...prev, [key]: val }));

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticket.user_email || !ticket.subject || !ticket.message) {
      addToast('Please fill in all fields before submitting.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitHelpTicket(ticket);
      setSubmitted(result);
      setTicket(EMPTY_TICKET);
      addToast(`Ticket #${result?.ticket_id || ''} submitted successfully — you'll receive a response via email.`, 'success');
    } catch (err) {
      addToast('Failed to submit support ticket. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      {!backendOnline && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} /><span>Help Center — Backend offline. Ticket submission unavailable.</span>
        </div>
      )}

      <PageHeader
        title="Help Center"
        subtitle="Documentation, FAQs, and direct support request submission for UrjaNetra AI platform"
        badge={{ label: 'SUPPORT', color: '#1d8cff' }}
      />

      {/* Search */}
      <GlassCard className="card" style={{ padding: '24px', marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>How can we help you?</div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>Search documentation, FAQs, and guides</div>
        <div style={{ position: 'relative', maxWidth: 500, margin: '0 auto' }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for help..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: '12px 14px 12px 40px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
          {faqsLoading && <RefreshCw size={14} className="animate-spin" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />}
        </div>
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        {/* Left: FAQs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Frequently Asked Questions</div>
            <GlassCard className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {faqsList.map((faq, i) => (
                <div key={i} style={{ borderBottom: i < faqsList.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1, paddingRight: 12 }}>{faq.q}</span>
                    {openFaq === i ? <ChevronDown size={15} color="var(--text-dim)" /> : <ChevronRight size={15} color="var(--text-dim)" />}
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 20px 16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ paddingTop: 12 }}>{faq.a}</div>
                    </div>
                  )}
                </div>
              ))}
              {faqsList.length === 0 && !faqsLoading && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                  {search ? `No results found for "${search}"` : 'Loading knowledge base...'}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Guides */}
          <GlassCard className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Documentation & Guides</div>
            {guides.map(guide => {
              const Icon = guide.icon;
              return (
                <div key={guide.title} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                  <div style={{ background: `${guide.color}18`, borderRadius: 8, padding: 8, flexShrink: 0 }}><Icon size={14} color={guide.color} /></div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{guide.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{guide.desc}</div>
                  </div>
                </div>
              );
            })}
          </GlassCard>
        </div>

        {/* Right: Support Ticket Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <GlassCard className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Mail size={16} color="#1d8cff" />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Submit Support Request</div>
            </div>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle size={36} color="#22c55e" style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e', marginBottom: 6 }}>Ticket #{submitted.ticket_id} Submitted!</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 16 }}>
                  Your inquiry has been submitted and our team will respond via email. You will receive a confirmation at your address.
                </div>
                <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => setSubmitted(null)}>Submit Another Request</button>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>Your Email *</label>
                  <input
                    type="email"
                    required
                    value={ticket.user_email}
                    onChange={e => handleTicketChange('user_email', e.target.value)}
                    placeholder="operator@nemc.gov.in"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>Subject *</label>
                  <input
                    type="text"
                    required
                    value={ticket.subject}
                    onChange={e => handleTicketChange('subject', e.target.value)}
                    placeholder="Issue with Risk Intelligence Engine..."
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>Message *</label>
                  <textarea
                    required
                    value={ticket.message}
                    onChange={e => handleTicketChange('message', e.target.value)}
                    placeholder="Please describe the issue or question in detail..."
                    rows={5}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {submitting ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                  {submitting ? 'Submitting...' : 'Submit Support Request'}
                </button>
              </form>
            )}
          </GlassCard>

          <GlassCard className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Emergency Contacts</div>
            {[
              { icon: MessageSquare, label: 'Live Chat', desc: 'Available 24/7 for critical operations', color: '#22c55e' },
              { icon: Mail, label: 'Admin Inbox', desc: 'support@nemc.gov.in', color: '#1d8cff' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Icon size={14} color={item.color} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
