import React, { useState } from 'react';

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
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className={`form-group ${className}${isPassword ? ' form-group-password' : ''}`}>
      {label && <label htmlFor={name}>{label}</label>}
      <div className={`input-wrapper${isPassword ? ' input-wrapper-password' : ''}`}>
        <input
          id={name}
          type={inputType}
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
        {isPassword && (
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
};

export default FormInput;
