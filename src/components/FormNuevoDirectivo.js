import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const FormNuevoDirectivo = ({ admin, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre_completo: '',
    cargo: '',
    direccion_id: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDirecciones, setLoadingDirecciones] = useState(true);

  useEffect(() => {
    fetchDirecciones();
  }, []);

  const fetchDirecciones = async () => {
    try {
      const response = await axios.get('https://api.strideutmat.com/api/university/direcciones');
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
      await axios.post('https://api.strideutmat.com/api/university/directivos', {
        nombre_completo: formData.nombre_completo,
        cargo: formData.cargo,
        direccion_id: formData.direccion_id,
        email: formData.email,
        password: formData.password
      });
      
      toast.success('Directivo creado exitosamente!');
      setFormData({
        nombre_completo: '',
        cargo: '',
        direccion_id: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      
      if (onSuccess) onSuccess();
      if (onClose) onClose();
      
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear directivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-modal">
      <div className="form-modal-content">
        <div className="form-header">
          <h2>Nuevo Directivo</h2>
          <p>Agregar nuevo director o encargado de área</p>
          {onClose && (
            <button className="close-btn" onClick={onClose}>×</button>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre Completo *</label>
              <input
                type="text"
                name="nombre_completo"
                value={formData.nombre_completo}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez López"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Cargo *</label>
              <input
                type="text"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                placeholder="Ej: Director de Ingeniería"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Dirección Encargada *</label>
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
                placeholder="directivo@stride.edu"
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
                placeholder="Repite la contraseña"
                required
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Directivo'}
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

export default FormNuevoDirectivo;