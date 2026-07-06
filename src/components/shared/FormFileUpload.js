import React, { useRef } from 'react';
import { toast } from 'react-toastify';
import '../../styles/FormFileUpload.css';

const FormFileUpload = ({
  label,
  name = 'file',
  accept,
  multiple,
  onChange,
  files = [],
  onRemove,
  maxFiles,
  hint,
  preview,
  previewLabel = 'Cambiar foto',
  noFileLabel = 'Seleccionar archivos',
  onPreviewRemove,
  className = '',
  disabled,
  id
}) => {
  const inputRef = useRef(null);
  const inputId = id || `fu-${name}-${Math.random().toString(36).slice(2, 8)}`;

  const handleChange = (e) => {
    if (maxFiles && multiple && e.target.files) {
      const remaining = maxFiles - files.length;
      if (e.target.files.length > remaining) {
        toast.error(`Solo puedes agregar ${remaining} archivo(s) más (máximo ${maxFiles})`);
        e.target.value = '';
        return;
      }
    }
    if (onChange) onChange(e);
    e.target.value = '';
  };

  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <div className="file-upload-area">
        <input
          ref={inputRef}
          type="file"
          id={inputId}
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="file-input"
          disabled={disabled}
        />
        <label htmlFor={inputId} className="file-upload-label">
          <span className="upload-icon"></span>
          <span>{preview ? previewLabel : noFileLabel}</span>
          {hint && <span className="upload-hint">{hint}</span>}
        </label>
      </div>

      {preview && (
        <div className="foto-preview-container">
          <div className="foto-preview-with-remove">
            <img src={preview} alt="Vista previa" className="foto-preview-img" />
            {onPreviewRemove && (
              <button type="button" className="remove-foto-btn" onClick={onPreviewRemove} title="Eliminar">×</button>
            )}
          </div>
        </div>
      )}

      {!preview && files.length > 0 && (
        <div className="archivos-preview">
          {files.map((file, index) => (
            <div key={index} className="archivo-preview-item">
              <span className="archivo-icon">
                {file.type?.startsWith('image/') ? '🖼️' : '📄'}
              </span>
              <span className="archivo-nombre">{file.name}</span>
              <span className="archivo-tamaño">{(file.size / 1024).toFixed(1)} KB</span>
              {onRemove && (
                <button type="button" className="archivo-remove" onClick={() => onRemove(index)}>×</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormFileUpload;
