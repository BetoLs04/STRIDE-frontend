import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import Layout from './components/layout/Layout';
import { SocketProvider } from './contexts/SocketContext';
import Home from './components/pages/Home';
import LoginGeneral from './components/pages/LoginGeneral';
import CreateSuperAdmin from './components/pages/CreateSuperAdmin';
import SuperAdminDashboard from './components/pages/SuperAdminDashboard';
import DirectivoDashboard from './components/pages/DirectivoDashboard';
import PersonalDashboard from './components/pages/PersonalDashboard';
import StrideWelcome from './components/pages/StrideWelcome';
import SuperAdminActividades from './components/pages/SuperAdminActividades';
import SuperAdminTareas from './components/pages/SuperAdminTareas';
import PersonalTareas from './components/pages/PersonalTareas';
import MatrizIndicadoresPage from './components/pages/MatrizIndicadoresPage';
import SMOAPage from './components/pages/SMOAPage';
import SepladePage from './components/pages/SepladePage';
import POAPage from './components/pages/POAPage';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { ROUTES, getDashboardPath, matrizIndicadores, seplade } from './constants/routes';
import { USER_TYPE_ARRAYS } from './constants/index';

function App() {
  const { user, loading, login: handleLogin, logout: handleLogout } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando aplicación...</p>
      </div>
    );
  }

  return (
    <SocketProvider>
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.WELCOME} element={<StrideWelcome user={user} />} />
        
        <Route path={ROUTES.LOGIN} element={
          !user ? <LoginGeneral onLogin={handleLogin} /> : <Navigate to={ROUTES.HOME} replace/>
        } />
        
        <Route path={ROUTES.CREATE_SUPERADMIN} element={
          !user ? <CreateSuperAdmin onLogin={handleLogin} /> : <Navigate to={ROUTES.ADMIN_DASHBOARD} />
        } />
        
        <Route path={ROUTES.ADMIN_DASHBOARD} element={
          <ProtectedRoute user={user} allowedTypes={USER_TYPE_ARRAYS.SUPERADMIN}>
            <SuperAdminDashboard admin={user} />
          </ProtectedRoute>
        } />
        
        <Route path={ROUTES.DIRECTIVO_DASHBOARD} element={
          <ProtectedRoute user={user} allowedTypes={USER_TYPE_ARRAYS.DIRECTIVO}>
            <DirectivoDashboard user={user} />
          </ProtectedRoute>
        } />
        
        <Route path={ROUTES.PERSONAL_DASHBOARD} element={
          <ProtectedRoute user={user} allowedTypes={USER_TYPE_ARRAYS.PERSONAL}>
            <PersonalDashboard user={user} />
          </ProtectedRoute>
        } />

        <Route path={ROUTES.ADMIN_ACTIVIDADES} element={
          <ProtectedRoute user={user} allowedTypes={USER_TYPE_ARRAYS.SUPERADMIN}>
            <SuperAdminActividades admin={user} />
          </ProtectedRoute>
        } />
        
        <Route path={ROUTES.ADMIN_TAREAS} element={
          <ProtectedRoute user={user} allowedTypes={USER_TYPE_ARRAYS.SUPERADMIN}>
            <SuperAdminTareas admin={user} />
          </ProtectedRoute>
        } />

        <Route path={ROUTES.PERSONAL_TAREAS} element={
          <ProtectedRoute user={user} allowedTypes={USER_TYPE_ARRAYS.PERSONAL}>
            <PersonalTareas user={user} />
          </ProtectedRoute>
        } />

        <Route path="/admin/matriz-indicadores/:seccionId" element={
          <ProtectedRoute user={user}>
            <MatrizIndicadoresPage user={user} />
          </ProtectedRoute>
        } />

        <Route path="/directivo/matriz-indicadores/:seccionId" element={
          <ProtectedRoute user={user}>
            <MatrizIndicadoresPage user={user} />
          </ProtectedRoute>
        } />

        <Route path="/personal/matriz-indicadores/:seccionId" element={
          <ProtectedRoute user={user}>
            <MatrizIndicadoresPage user={user} />
          </ProtectedRoute>
        } />

        <Route path={ROUTES.ADMIN_SMOA} element={
          <ProtectedRoute user={user} allowedTypes={USER_TYPE_ARRAYS.SUPERADMIN}>
            <SMOAPage user={user} />
          </ProtectedRoute>
        } />

        <Route path={ROUTES.DIRECTIVO_SMOA} element={
          <ProtectedRoute user={user}>
            <SMOAPage user={user} />
          </ProtectedRoute>
        } />

        <Route path={ROUTES.PERSONAL_SMOA} element={
          <ProtectedRoute user={user}>
            <SMOAPage user={user} />
          </ProtectedRoute>
        } />

        <Route path="/admin/seplade/:hojaId" element={
          <ProtectedRoute user={user} allowedTypes={USER_TYPE_ARRAYS.SUPERADMIN}>
            <SepladePage user={user} />
          </ProtectedRoute>
        } />

        <Route path="/directivo/seplade/:hojaId" element={
          <ProtectedRoute user={user}>
            <SepladePage user={user} />
          </ProtectedRoute>
        } />

        <Route path="/personal/seplade/:hojaId" element={
          <ProtectedRoute user={user}>
            <SepladePage user={user} />
          </ProtectedRoute>
        } />

        <Route path="/admin/poa/:seccionId" element={
          <ProtectedRoute user={user} allowedTypes={USER_TYPE_ARRAYS.SUPERADMIN}>
            <POAPage user={user} />
          </ProtectedRoute>
        } />

        <Route path="/directivo/poa/:seccionId" element={
          <ProtectedRoute user={user}>
            <POAPage user={user} />
          </ProtectedRoute>
        } />

        <Route path="/personal/poa/:seccionId" element={
          <ProtectedRoute user={user}>
            <POAPage user={user} />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to={ROUTES.HOME} />} />
      </Routes>
    </Layout>
    </SocketProvider>
  );
}

export default App;