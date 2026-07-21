import React from 'react';

export default function Button({ children, variant = 'primary', size = 'md', onClick, disabled, className = '', icon: Icon, type = 'button' }) {
  const variantMap = { primary: 'btn-primary', secondary: 'btn-secondary', danger: 'btn-danger', ghost: 'btn-ghost', success: 'btn-success' };
  const sizeMap = { sm: 'btn-sm', md: '', lg: 'btn-lg', icon: 'btn-icon' };
  return (
    <button type={type} className={`btn ${variantMap[variant] || 'btn-primary'} ${sizeMap[size] || ''} ${className}`} onClick={onClick} disabled={disabled}>
      {Icon && <Icon size={size === 'sm' ? 13 : size === 'lg' ? 18 : 15} />}
      {children}
    </button>
  );
}
