import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const FormNuevaDireccion = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post('/api/university/direcciones', formData);
      
      toast.success('Dirección creada exitosamente!');
      setFormData({ nombre: '' });
      
      if (onSuccess) onSuccess();
      if (onClose) onClose();
      
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear dirección');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-modal">
      <div className="form-modal-content">
        <div className="form-header">
          <h2>Nueva Dirección/Área</h2>
          <p>Crear nueva dirección o área universitaria</p>
          {onClose && (
            <button className="close-btn" onClick={onClose}>×</button>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre de la Dirección *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Dirección de Finanzas"
              required
              autoFocus
            />
            <p className="form-hint">Ej: Rectoría, Facultad de Ingeniería, Departamento de Recursos Humanos</p>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Dirección'}
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

export default FormNuevaDireccion;