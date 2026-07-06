import React, { useState } from 'react';
import api from '../../api';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../../styles/LogoUploadModal.css';
import { handleApiError } from '../../utils/errorHandler';
import { LIMITS } from '../../constants/index';

const LogoUploadModal = ({ show, onClose, logoUrl, onLogoUpdate, user }) => {
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setLogoFile(null);
    setPreviewUrl(null);
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    if (file.size > LIMITS.FILE_SIZE.LOGO) {
      toast.error('El logo debe ser menor a 2MB');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const img = new Image();
    img.onload = function() {
      if (this.height > this.width) {
        toast.warning('Recomendación: Los logos horizontales se ven mejor');
      }
      setLogoFile(file);
    };
    img.src = objectUrl;
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error('Selecciona un archivo primero');
      return;
    }

    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      formData.append('uploaded_by', user?.username || 'system');
      formData.append('user_type', user?.tipo || 'system');

      const response = await api.post('/api/university/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('Logo actualizado correctamente');
        if (onLogoUpdate) onLogoUpdate();
        handleClose();
      }
    } catch (error) {
      handleApiError(error, 'Error al subir logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar el logo actual?')) {
      return;
    }

    try {
      const response = await api.delete('/api/university/delete-logo');

      if (response.data.success) {
        toast.success('Logo eliminado correctamente');
        if (onLogoUpdate) onLogoUpdate(null);
        handleClose();
      }
    } catch (error) {
      handleApiError(error, 'Error al eliminar logo');
    }
  };

  if (!show) return null;

  return (
    <div className="logo-modal-overlay" onClick={handleClose}>
      <div className="logo-modal-content" onClick={e => e.stopPropagation()}>
        <div className="logo-modal-header">
          <h3 className="logo-modal-title">
            {logoUrl ? '🔄 Cambiar Logo' : '➕ Agregar Logo'}
          </h3>
          <button className="logo-modal-close-btn" onClick={handleClose}>✕</button>
        </div>

        <div className="logo-modal-body">
          <div className="logo-modal-preview">
            {previewUrl ? (
              <div>
                <img className="logo-modal-preview-img" src={previewUrl} alt="Preview nuevo logo" />
                <p className="logo-modal-preview-text">Vista previa del nuevo logo</p>
              </div>
            ) : logoUrl ? (
              <div>
                <img className="logo-modal-preview-img" src={logoUrl} alt="Logo actual" />
                <p className="logo-modal-preview-text">Logo actual</p>
              </div>
            ) : (
              <div>
                <div className="logo-modal-empty-icon">🏫</div>
                <p className="logo-modal-empty-text">Sin logo actualmente</p>
              </div>
            )}
          </div>

          <div className="logo-modal-file-section">
            <label className="logo-modal-label">Seleccionar nueva imagen:</label>
            <input
              className="logo-modal-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            <small className="logo-modal-hint">
              Máximo 2MB · PNG, JPG, GIF, SVG, WebP · Se recomienda formato horizontal
            </small>
          </div>

          <div className="logo-modal-actions">
            <button
              className="logo-modal-btn logo-modal-btn-upload"
              onClick={handleLogoUpload}
              disabled={uploadingLogo || !logoFile}
            >
              {uploadingLogo ? '⏳ Subiendo...' : '📤 Subir Logo'}
            </button>

            {logoUrl && (
              <button
                className="logo-modal-btn logo-modal-btn-delete"
                onClick={handleLogoDelete}
              >
                🗑️ Eliminar
              </button>
            )}

            <button
              className="logo-modal-btn-cancel"
              onClick={handleClose}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoUploadModal;
