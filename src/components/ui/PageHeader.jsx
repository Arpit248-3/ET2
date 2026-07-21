import React from 'react';

export default function PageHeader({ title, subtitle, actions, badge }) {
  const renderBadge = () => {
    if (!badge) return null;
    if (typeof badge === 'object' && badge !== null && badge.label) {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20, fontSize: 10.5,
          fontWeight: 700, letterSpacing: '0.07em',
          background: badge.color ? `${badge.color}18` : 'rgba(245,158,11,0.12)',
          color: badge.color || '#fbbf24',
          border: `1px solid ${badge.color ? `${badge.color}30` : 'rgba(245,158,11,0.28)'}`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: badge.color || '#fbbf24', flexShrink: 0 }} />
          {badge.label}
        </span>
      );
    }
    return badge;
  };

  return (
    <div className="page-header">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 className="page-header-title">{title}</h1>
          {renderBadge()}
        </div>
        {subtitle && <p className="page-header-sub">{subtitle}</p>}
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
