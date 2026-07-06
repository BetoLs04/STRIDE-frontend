import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { toast } from 'react-toastify';
import { ROUTES } from '../../constants/routes';
import { STORAGE_KEYS, MESSAGES, LIMITS } from '../../constants/index';
import '../../styles/Auth.css';
import { handleApiError } from '../../utils/errorHandler';
import FormInput from '../shared/FormInput';

const CreateSuperAdmin = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [superAdminExists, setSuperAdminExists] = useState(false);

  useEffect(() => {
    checkSuperAdminExistence();
  }, []);

  const checkSuperAdminExistence = async () => {
    try {
      const response = await api.get('/api/university/superusers');
      const hasSuperAdmin = response.data.data && response.data.data.length > 0;
      setSuperAdminExists(hasSuperAdmin);
      
      // Si ya existe un super admin, redirigir al login
      if (hasSuperAdmin) {
        toast.warning('Ya existe un Super Administrador configurado');
        navigate(ROUTES.LOGIN);
      }
    } catch (error) {
      handleApiError(error, 'Error al verificar superusuarios');
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

    if (formData.password.length < LIMITS.MIN_PASSWORD_LENGTH) {
      toast.error(MESSAGES.CONTRASENA_MINIMA());
      return;
    }
    
    // Verificar nuevamente que no exista super admin
    if (superAdminExists) {
      toast.error('Ya existe un Super Administrador. Contacta al administrador actual.');
      navigate(ROUTES.LOGIN);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Creando primer Super Admin con datos:', formData);
      const createRes = await api.post('/api/university/create-superuser', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      console.log('Respuesta creación:', createRes.data);
      toast.success('¡Super Administrador creado exitosamente!');
      toast.info('Ahora podrás configurar el sistema completo.');

      // Hacer login automático con el nuevo usuario
      const loginRes = await api.post('/api/university/login', {
        email: formData.email,
        password: formData.password
      });

      console.log('Respuesta login:', loginRes.data);

      if (loginRes.data.success && onLogin) {
        const userData = loginRes.data.user;
        const token = loginRes.data.token;
        onLogin(userData);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        if (token) localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        
        // Mostrar mensaje de bienvenida especial
        setTimeout(() => {
          toast.info('Bienvenido al panel de Super Administración. Aquí podrás configurar direcciones, directivos y personal.');
        }, 1000);
        
        navigate(ROUTES.ADMIN_DASHBOARD);
      }

    } catch (error) {
      handleApiError(error, 'Error al crear superusuario');
    } finally {
      setLoading(false);
    }
  };

  // Si ya existe super admin, mostrar mensaje
  if (superAdminExists) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-logo">🔒</span>
            <h2 className="auth-title">Acceso Restringido</h2>
            <p className="auth-subtitle">El sistema ya está configurado</p>
          </div>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3>Ya existe un Super Administrador</h3>
            <p style={{ marginBottom: '2rem' }}>
              Solo puede existir un Super Administrador principal en el sistema.
              Si necesitas acceso, contacta al administrador actual.
            </p>
            <div className="button-group">
              <button 
                className="btn btn-primary"
                onClick={() => navigate(ROUTES.LOGIN)}
              >
                Ir al Login
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate(ROUTES.HOME)}
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
            <span className="auth-logo">🏛️</span>
            <h2 className="auth-title">Configurar Sistema</h2>
            <p className="auth-subtitle">Crear primer Super Administrador</p>
          </div>
        
        <form onSubmit={handleSubmit}>
          <FormInput label="Nombre de Usuario *" name="username" value={formData.username} onChange={handleChange} placeholder="Ej: admin.rectoria" required disabled={loading} />

          <FormInput label="Correo Electrónico *" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="admin@stride.edu" required disabled={loading} />

          <FormInput label="Contraseña *" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" required disabled={loading} />

          <FormInput label="Confirmar Contraseña *" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Repite la contraseña" required disabled={loading} />

          <div className="form-info important-note">
            <p><strong>⚠️ IMPORTANTE:</strong> Esta será la cuenta principal del sistema. 
            Después de crearla, podrás configurar todas las direcciones, directivos y personal.</p>
          </div>

          <div className="button-group">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Configurando...' : 'Configurar Sistema'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => navigate(ROUTES.HOME)}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSuperAdmin;
