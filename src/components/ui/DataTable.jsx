import React from 'react';
import StatusBadge from './StatusBadge.jsx';

export default function DataTable({ columns, data, onRowClick, emptyMessage = 'No data available' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{ width: col.width }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px 14px', color: 'var(--text-dim)' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : data.map((row, i) => (
            <tr key={i} onClick={onRowClick ? () => onRowClick(row) : undefined} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : col.badge ? <StatusBadge status={row[col.key]} size="sm" /> : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
