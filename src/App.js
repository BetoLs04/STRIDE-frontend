import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import Header from './components/Header';
import Home from './components/Home';
import LoginGeneral from './components/LoginGeneral';
import CreateSuperAdmin from './components/CreateSuperAdmin';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import DirectivoDashboard from './components/DirectivoDashboard';
import PersonalDashboard from './components/PersonalDashboard';
import StrideWelcome from './components/StrideWelcome';
import SuperAdminActividades from './components/SuperAdminActividades';
import SuperAdminTareas from './components/SuperAdminTareas';
import PersonalTareas from './components/PersonalTareas';
import MatrizIndicadoresPage from './components/MatrizIndicadoresPage';
import SMOAPage from './components/SMOAPage';
import SepladePage from './components/SepladePage';
import Footer from './components/Footer';
import './styles/App.css';

// Global axios auth interceptor
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('stride_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/login')) {
      localStorage.removeItem('stride_user');
      localStorage.removeItem('stride_token');
      toast.error('Sesión expirada. Inicia sesión nuevamente.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario desde localStorage
    const storedUser = localStorage.getItem('stride_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('Usuario cargado desde localStorage:', parsedUser);
      } catch (error) {
        console.error('Error parsing user:', error);
        localStorage.removeItem('stride_user');
        localStorage.removeItem('stride_token');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    console.log('Usuario logueado en App:', userData);
    setUser(userData);
    localStorage.setItem('stride_user', JSON.stringify(userData));
    const userName = userData.nombre || userData.username || 'Usuario';
    toast.success(`¡Bienvenido ${userName}!`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('stride_user');
    localStorage.removeItem('stride_token');
    toast.info('Sesión cerrada correctamente');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando aplicación...</p>
      </div>
    );
  }

  // Función para obtener ruta de dashboard según tipo de usuario
  const getDashboardPath = (userType) => {
    switch(userType) {
      case 'superadmin': return '/admin/dashboard';
      case 'directivo': return '/directivo/dashboard';
      case 'personal': return '/personal/dashboard';
      default: return '/welcome';
    }
  };

  return (
    <div className="App">
      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        theme="colored"
      />
      
      <Header user={user} onLogout={handleLogout} />
      
      <main className="main-content">
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/welcome" element={<StrideWelcome user={user} />} />
          
          {/* Login - solo accesible si NO hay usuario logueado */}
          <Route path="/login" element={
            !user ? <LoginGeneral onLogin={handleLogin} /> : <Navigate to="/" replace/>
          } />
          
          {/* Crear Super Admin - solo accesible si NO hay usuario logueado */}
          <Route path="/create-superadmin" element={
            !user ? <CreateSuperAdmin onLogin={handleLogin} /> : <Navigate to="/admin/dashboard" />
          } />
          
          {/* Dashboards protegidos por tipo de usuario */}
          <Route path="/admin/dashboard" element={
            user && user.tipo === 'superadmin' ? 
            <SuperAdminDashboard admin={user} /> : 
            <Navigate to="/login" />
          } />
          
          <Route path="/directivo/dashboard" element={
            user && user.tipo === 'directivo' ? 
            <DirectivoDashboard user={user} /> : 
            <Navigate to="/login" />
          } />
          
          <Route path="/personal/dashboard" element={
            user && user.tipo === 'personal' ? 
            <PersonalDashboard user={user} /> : 
            <Navigate to="/login" />
          } />

          <Route path="/admin/actividades" element={
            user && user.tipo === 'superadmin' ? 
            <SuperAdminActividades admin={user} /> : 
            <Navigate to="/login" />
          } />
          
          <Route path="/admin/tareas" element={
            user && user.tipo === 'superadmin' ? 
            <SuperAdminTareas admin={user} /> : 
            <Navigate to="/login" />
          } />

          <Route path="/personal/tareas" element={
            user && user.tipo === 'personal' ? 
            <PersonalTareas user={user} /> : 
            <Navigate to="/login" />
          } />

          <Route path="/admin/matriz-indicadores/:seccionId" element={
            user ? 
            <MatrizIndicadoresPage user={user} /> : 
            <Navigate to="/login" />
          } />

          <Route path="/directivo/matriz-indicadores/:seccionId" element={
            user && (user.tipo === 'directivo' || user.tipo === 'superadmin') ? 
            <MatrizIndicadoresPage user={user} /> : 
            <Navigate to="/login" />
          } />

          <Route path="/personal/matriz-indicadores/:seccionId" element={
            user && (user.tipo === 'personal' || user.tipo === 'superadmin') ? 
            <MatrizIndicadoresPage user={user} /> : 
            <Navigate to="/login" />
          } />

          <Route path="/admin/smoa" element={
            user && user.tipo === 'superadmin' ? 
            <SMOAPage user={user} /> : 
            <Navigate to="/login" />
          } />

          <Route path="/directivo/smoa" element={
            user && (user.tipo === 'directivo' || user.tipo === 'superadmin') ? 
            <SMOAPage user={user} /> : 
            <Navigate to="/login" />
          } />

          <Route path="/personal/smoa" element={
            user && (user.tipo === 'personal' || user.tipo === 'superadmin') ? 
            <SMOAPage user={user} /> : 
            <Navigate to="/login" />
          } />

          <Route path="/admin/seplade" element={
            user && user.tipo === 'superadmin' ? 
            <SepladePage user={user} /> : 
            <Navigate to="/login" />
          } />

          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;