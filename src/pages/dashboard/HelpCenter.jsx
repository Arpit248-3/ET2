import React, { useState, useEffect } from 'react';
import { HelpCircle, Search, ChevronDown, ChevronRight, BookOpen, MessageSquare, Mail, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { fetchHelpCenter } from '../../services/api.js';
import { useScenario } from '../../context/ScenarioContext.jsx';

const guides = [
  { title: 'Getting Started with UrjaNetra AI', desc: 'Platform overview and first-time setup guide', icon: BookOpen, color: '#1d8cff' },
  { title: 'Understanding the Risk Intelligence Engine', desc: 'How AI processes signals and generates alerts', icon: HelpCircle, color: '#8b5cf6' },
];

export default function HelpCenter() {
  const { backendOnline } = useScenario();
  const [search, setSearch] = useState('');
  const [faqsList, setFaqsList] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadFaqs = async (query = '') => {
    setLoading(true);
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
      console.warn('Help Center API offline, using cached fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadFaqs(search);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  if (faqsList.length === 0 && !backendOnline) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
          <HelpCircle size={48} style={{ color: '#f59e0b' }} />
          <h2>Help Center Offline</h2>
          <p style={{ color: 'var(--text-muted)' }}>Could not connect to the UrjaNetra AI backend, and no cached help articles are available.</p>
          <button className="btn btn-primary" onClick={() => loadFaqs(search)}>
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

      <PageHeader title="Help Center" subtitle="Documentation, FAQs, and support resources for UrjaNetra AI platform"
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
          {loading && <RefreshCw size={14} className="animate-spin" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />}
        </div>
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* FAQs */}
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
            {faqsList.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No results found for "{search}"</div>
            )}
          </GlassCard>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Guides */}
          <GlassCard className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Documentation</div>
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

          {/* Contact Support */}
          <GlassCard className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Contact Support</div>
            {[
              { icon: MessageSquare, label: 'Live Chat', desc: 'Available 24/7', color: '#22c55e', action: 'Chat Now' },
              { icon: Mail, label: 'Email Support', desc: 'support@nemc.gov.in', color: '#1d8cff', action: 'Send Email' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Icon size={14} color={item.color} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{item.desc}</div>
                    </div>
                  </div>
                  <button className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 10px' }}>{item.action}</button>
                </div>
              );
            })}
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
