import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import { toast } from 'react-toastify';
import { ROUTES } from '../../constants/routes';
import { STORAGE_KEYS } from '../../constants/index';
import '../../styles/Auth.css';
import { handleApiError } from '../../utils/errorHandler';
import FormInput from '../shared/FormInput';

const LoginGeneral = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [superAdminExists, setSuperAdminExists] = useState(false);
  const [checkingSuperAdmin, setCheckingSuperAdmin] = useState(true);

  useEffect(() => {
    // Verificar si ya existe un super admin
    checkSuperAdminExistence();
  }, []);

  const checkSuperAdminExistence = async () => {
    try {
      const response = await api.get('/api/university/check-superadmin');
      setSuperAdminExists(response.data.exists);
      console.log('¿Super Admin existe?', response.data.exists);
    } catch (error) {
      handleApiError(error, 'Error al verificar superusuarios');
      setSuperAdminExists(false);
    } finally {
      setCheckingSuperAdmin(false);
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

    if (!formData.email || !formData.password) {
      toast.error('Email y contraseña son requeridos');
      return;
    }

    setLoading(true);

    try {
      console.log('Intentando login general con:', formData.email);

      const response = await api.post('/api/university/login-general', {
        email: formData.email,
        password: formData.password
      });

      console.log('Respuesta del servidor:', response.data);

      if (response.data.success && response.data.user) {
        const userData = response.data.user;
        const token = response.data.token;
        console.log('Usuario autenticado:', userData);

        // Guardar en localStorage
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        if (token) localStorage.setItem(STORAGE_KEYS.TOKEN, token);

        // Llamar a onLogin callback
        if (onLogin) {
          onLogin(userData);
        }

        toast.success(`¡Bienvenido ${userData.nombre || userData.username}!`);

        // Redirigir según tipo de usuario
        navigate(ROUTES.HOME)
      }

    } catch (error) {
      handleApiError(error, 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Credenciales de prueba para desarrollo

  if (checkingSuperAdmin) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Verificando configuración del sistema...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Iniciar Sesión</h2>
          <p className="auth-subtitle">Accede al sistema STRIDE University</p>
        </div>

        <form onSubmit={handleSubmit}>
          <FormInput label="Correo Electrónico" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="usuario@stride.edu" required disabled={loading} />

          <FormInput label="Contraseña" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Tu contraseña" required disabled={loading} />

          <div className="button-group">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </div>

          {!superAdminExists && (
            <div className="warning-note">
              <small>⚠️ No hay Super Admin configurado. Contacta al administrador del sistema.</small>
            </div>
          )}


          <div className="auth-footer">
            {/* Solo mostrar enlace para crear super admin si NO existe ninguno */}
            {!superAdminExists ? (
              <p>
                ¿Eres el primer administrador?{' '}
                <Link to={ROUTES.CREATE_SUPERADMIN} className="auth-link">
                  Crear cuenta de Super Admin
                </Link>
              </p>
            ) : (
              <p className="auth-system-ok">
                Sistema configurado correctamente
              </p>
            )}
            <Link to={ROUTES.HOME} className="btn btn-text">
              ← Volver al inicio
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginGeneral;