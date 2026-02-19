import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const FormNuevoPersonal = ({ admin, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre_completo: '',
    puesto: '',
    direccion_id: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // NUEVO: Estado para la foto
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDirecciones, setLoadingDirecciones] = useState(true);

  useEffect(() => {
    fetchDirecciones();
  }, []);

  const fetchDirecciones = async () => {
    try {
      const response = await axios.get('/api/university/direcciones');
      setDirecciones(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar direcciones');
    } finally {
      setLoadingDirecciones(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // NUEVO: Manejar selección de foto
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecciona un archivo de imagen');
        return;
      }
      
      // Validar tamaño (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen es demasiado grande. Máximo 2MB');
        return;
      }
      
      setFoto(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // NUEVO: Eliminar foto seleccionada
  const handleRemoveFoto = () => {
    setFoto(null);
    setFotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (!formData.direccion_id) {
      toast.error('Debe seleccionar una dirección');
      return;
    }
    
    setLoading(true);
    
    try {
      // Crear FormData para enviar la foto
      const formDataToSend = new FormData();
      formDataToSend.append('nombre_completo', formData.nombre_completo);
      formDataToSend.append('puesto', formData.puesto);
      formDataToSend.append('direccion_id', formData.direccion_id);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      
      // Agregar la foto si existe
      if (foto) {
        formDataToSend.append('foto', foto);
      }
      
      await axios.post('/api/university/personal', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Personal creado exitosamente!');
      
      // Reset form
      setFormData({
        nombre_completo: '',
        puesto: '',
        direccion_id: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setFoto(null);
      setFotoPreview(null);
      
      if (onSuccess) onSuccess();
      if (onClose) onClose();
      
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear personal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-modal">
      <div className="form-modal-content">
        <div className="form-header">
          <h2>Nuevo Personal</h2>
          <p>Agregar nuevo miembro del personal administrativo</p>
          {onClose && (
            <button className="close-btn" onClick={onClose}>×</button>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* NUEVO: Campo para foto de perfil */}
            <div className="form-group full-width">
              <label>Foto de Perfil (Opcional)</label>
              <div className="foto-upload-section">
                <div className="foto-preview-container">
                  {fotoPreview ? (
                    <div className="foto-preview-with-remove">
                      <img 
                        src={fotoPreview} 
                        alt="Vista previa" 
                        className="foto-preview-img"
                      />
                      <button 
                        type="button" 
                        className="remove-foto-btn"
                        onClick={handleRemoveFoto}
                        title="Eliminar foto"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="foto-placeholder">
                      <span className="placeholder-icon">👤</span>
                      <span className="placeholder-text">Sin foto</span>
                    </div>
                  )}
                </div>
                
                <div className="foto-upload-controls">
                  <input
                    type="file"
                    id="foto-input"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="foto-input-hidden"
                  />
                  <label htmlFor="foto-input" className="btn-upload-foto">
                    {fotoPreview ? 'Cambiar Foto' : 'Seleccionar Foto'}
                  </label>
                  <small className="upload-hint">Formatos: JPG, PNG, GIF • Máx: 2MB</small>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label>Nombre Completo *</label>
              <input
                type="text"
                name="nombre_completo"
                value={formData.nombre_completo}
                onChange={handleChange}
                placeholder="Ej: María González Ramírez"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Puesto *</label>
              <input
                type="text"
                name="puesto"
                value={formData.puesto}
                onChange={handleChange}
                placeholder="Ej: Asistente Administrativo"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Dirección de Pertenencia *</label>
              {loadingDirecciones ? (
                <div className="loading-select">Cargando direcciones...</div>
              ) : (
                <select
                  name="direccion_id"
                  value={formData.direccion_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione una dirección</option>
                  {direcciones.map(dir => (
                    <option key={dir.id} value={dir.id}>
                      {dir.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="form-group">
              <label>Email Institucional *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="personal@stride.edu"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Contraseña *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Confirmar Contraseña *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repite tu contraseña"
                required
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Personal'}
            </button>
            {onClose && (
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormNuevoPersonal;