import React from 'react';

const FormSelect = ({
  label,
  name,
  value,
  onChange,
  children,
  required,
  disabled,
  loading,
  loadingText = 'Cargando...',
  hint,
  className = '',
  ...rest
}) => (
  <div className={`form-group ${className}`}>
    {label && <label htmlFor={name}>{label}</label>}
    {loading ? (
      <div className="loading-select">{loadingText}</div>
    ) : (
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        {...rest}
      >
        {children}
      </select>
    )}
    {hint && <div className="form-hint">{hint}</div>}
  </div>
);

export default FormSelect;
