import React from 'react';

const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  disabled,
  maxLength,
  min,
  autoFocus,
  hint,
  className = '',
  ...rest
}) => (
  <div className={`form-group ${className}`}>
    {label && <label htmlFor={name}>{label}</label>}
    <input
      id={name}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      maxLength={maxLength}
      min={min}
      autoFocus={autoFocus}
      className="form-input"
      {...rest}
    />
    {hint && <div className="form-hint">{hint}</div>}
  </div>
);

export default FormInput;
