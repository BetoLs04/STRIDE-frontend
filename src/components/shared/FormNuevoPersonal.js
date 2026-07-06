import React, { useState, useEffect } from 'react';
import api from '../../api';
import { toast } from 'react-toastify';
import { handleApiError } from '../../utils/errorHandler';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import FormFileUpload from './FormFileUpload';
import { MESSAGES, LIMITS } from '../../constants/index';

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
      if (file.size > LIMITS.FILE_SIZE.PHOTO) {
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
      
      await api.post('/api/university/personal', formDataToSend, {
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
      handleApiError(error, 'Error al crear personal');
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
            <FormFileUpload
              label="Foto de Perfil (Opcional)"
              accept="image/*"
              onChange={handleFotoChange}
              preview={fotoPreview}
              onPreviewRemove={handleRemoveFoto}
              noFileLabel="Seleccionar Foto"
              previewLabel="Cambiar Foto"
              hint="Formatos: JPG, PNG, GIF • Máx: 2MB"
            />
            
            <FormInput label="Nombre Completo *" name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} placeholder="Ej: María González Ramírez" required />
            
            <FormInput label="Puesto *" name="puesto" value={formData.puesto} onChange={handleChange} placeholder="Ej: Asistente Administrativo" required />
            
            <FormSelect label="Dirección de Pertenencia *" name="direccion_id" value={formData.direccion_id} onChange={handleChange} required loading={loadingDirecciones} loadingText="Cargando direcciones...">
              <option value="">Seleccione una dirección</option>
              {direcciones.map(dir => (
                <option key={dir.id} value={dir.id}>{dir.nombre}</option>
              ))}
            </FormSelect>
            
            <FormInput label="Email Institucional *" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="personal@stride.edu" required />
            
            <FormInput label="Contraseña *" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" required />
            
            <FormInput label="Confirmar Contraseña *" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Repite tu contraseña" required />
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