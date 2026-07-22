/**
 * RoleCards — Government & Enterprise role selector for Registration.
 * Detailed cards showing role permissions, dashboards, AI clearance, security level.
 */
import React from 'react';
import {
  ShieldAlert, Building2, Flame, Factory, Truck, Award,
  Eye, Cpu, DollarSign, Activity, FileCheck
} from 'lucide-react';

export const ROLES = [
  {
    id: 'Cabinet Secretariat',
    title: 'Cabinet Secretariat',
    icon: Building2,
    department: 'Cabinet Office',
    permissions: 24,
    dashboards: 27,
    aiAccess: 'Full Executive',
    clearance: 'LEVEL-5 EYES ONLY',
    color: '#8b5cf6',
  },
  {
    id: 'Petroleum Ministry',
    title: 'Petroleum Ministry',
    icon: Flame,
    department: 'Ministry of Petroleum & Natural Gas',
    permissions: 20,
    dashboards: 25,
    aiAccess: 'Full Access',
    clearance: 'LEVEL-4 TOP SECRET',
    color: '#00e5ff',
  },
  {
    id: 'OMC Executive',
    title: 'OMC Executive',
    icon: Award,
    department: 'IOCL / BPCL / HPCL',
    permissions: 18,
    dashboards: 22,
    aiAccess: 'Strategic AI',
    clearance: 'LEVEL-4 SECRET',
    color: '#1d8cff',
  },
  {
    id: 'Refinery Manager',
    title: 'Refinery Operations Manager',
    icon: Factory,
    department: 'Refinery Logistics Command',
    permissions: 16,
    dashboards: 18,
    aiAccess: 'Operational AI',
    clearance: 'LEVEL-3 CONFIDENTIAL',
    color: '#f59e0b',
  },
  {
    id: 'Supply Chain Analyst',
    title: 'Supply Chain & SPR Analyst',
    icon: Truck,
    department: 'Strategic Petroleum Reserves',
    permissions: 14,
    dashboards: 16,
    aiAccess: 'Analytics AI',
    clearance: 'LEVEL-3 RESTRICTED',
    color: '#22c55e',
  },
  {
    id: 'Intelligence Officer',
    title: 'Threat & Risk Officer',
    icon: ShieldAlert,
    department: 'National Crisis Cell',
    permissions: 22,
    dashboards: 24,
    aiAccess: 'Red Team AI',
    clearance: 'LEVEL-5 TOP SECRET',
    color: '#ef4444',
  },
];

export default function RoleCards({ selectedRole, onSelectRole }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: 12,
      margin: '16px 0',
    }}>
      {ROLES.map((role) => {
        const Icon = role.icon;
        const isSelected = selectedRole === role.id;

        return (
          <div
            key={role.id}
            onClick={() => onSelectRole(role.id)}
            style={{
              background: isSelected
                ? `linear-gradient(135deg, rgba(8,18,38,0.95), ${role.color}15)`
                : 'rgba(8, 18, 38, 0.6)',
              backdropFilter: 'blur(16px)',
              border: isSelected
                ? `1.5px solid ${role.color}`
                : '1px solid rgba(90, 130, 255, 0.2)',
              borderRadius: 12,
              padding: 14,
              cursor: 'pointer',
              boxShadow: isSelected
                ? `0 0 20px ${role.color}30, inset 0 0 15px ${role.color}10`
                : 'none',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: `${role.color}20`,
                border: `1px solid ${role.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={18} color={role.color} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                  {role.title}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim, #64748b)' }}>
                  {role.department}
                </div>
              </div>
            </div>

            {/* Clearance badge */}
            <div style={{
              fontSize: 9,
              fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: role.color,
              padding: '2px 8px',
              borderRadius: 4,
              background: `${role.color}12`,
              border: `1px solid ${role.color}30`,
              width: 'fit-content',
              marginBottom: 10,
            }}>
              {role.clearance}
            </div>

            {/* Meta Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--text-muted, #94a3b8)',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: 6,
              borderRadius: 6,
            }}>
              <div>
                <div style={{ fontSize: 8, color: '#64748b' }}>PERMS</div>
                <div style={{ fontWeight: 700, color: '#fff' }}>{role.permissions}</div>
              </div>
              <div>
                <div style={{ fontSize: 8, color: '#64748b' }}>BOARDS</div>
                <div style={{ fontWeight: 700, color: '#fff' }}>{role.dashboards}</div>
              </div>
              <div>
                <div style={{ fontSize: 8, color: '#64748b' }}>AI LEVEL</div>
                <div style={{ fontWeight: 700, color: role.color }}>{role.aiAccess}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
