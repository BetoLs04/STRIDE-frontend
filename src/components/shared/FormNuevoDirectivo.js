import React, { useState, useEffect } from 'react';
import api from '../../api';
import { toast } from 'react-toastify';
import { handleApiError } from '../../utils/errorHandler';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import { MESSAGES } from '../../constants/index';

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
      const response = await api.get('/api/university/direcciones');
      setDirecciones(response.data.data || []);
    } catch (error) {
      handleApiError(error, 'Error al cargar direcciones');
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
      toast.error(MESSAGES.CONTRASENAS_NO_COINCIDEN);
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error(MESSAGES.CONTRASENA_MINIMA());
      return;
    }
    
    if (!formData.direccion_id) {
      toast.error('Debe seleccionar una dirección');
      return;
    }
    
    setLoading(true);
    
    try {
      await api.post('/api/university/directivos', {
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
      handleApiError(error, 'Error al crear directivo');
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
            <FormInput label="Nombre Completo *" name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} placeholder="Ej: Juan Pérez López" required />
            
            <FormInput label="Cargo *" name="cargo" value={formData.cargo} onChange={handleChange} placeholder="Ej: Director de Ingeniería" required />
            
            <FormSelect label="Dirección Encargada *" name="direccion_id" value={formData.direccion_id} onChange={handleChange} required loading={loadingDirecciones} loadingText="Cargando direcciones...">
              <option value="">Seleccione una dirección</option>
              {direcciones.map(dir => (
                <option key={dir.id} value={dir.id}>{dir.nombre}</option>
              ))}
            </FormSelect>
            
            <FormInput label="Email Institucional *" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="directivo@stride.edu" required />
            
            <FormInput label="Contraseña *" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" required />
            
            <FormInput label="Confirmar Contraseña *" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Repite la contraseña" required />
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