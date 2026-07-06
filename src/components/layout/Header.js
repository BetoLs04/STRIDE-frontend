import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api';
import LogoUploadModal from '../modals/LogoUploadModal';
import useLogo from '../../hooks/useLogo';
import useUserPhoto from '../../hooks/useUserPhoto';
import useTareasPendientes from '../../hooks/useTareasPendientes';
import { ROUTES, DASHBOARD_BY_TYPE } from '../../constants/routes';
import '../../styles/Header.css';
import { handleApiError } from '../../utils/errorHandler';
import { USER_TYPES } from '../../constants/index';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { logoUrl, strideLogoUrl, reload: reloadLogo } = useLogo();
  const { userPhoto, loadPhoto } = useUserPhoto();
  const { pendientes: tareasPendientes } = useTareasPendientes(user?.id, user?.tipo);
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userFullData, setUserFullData] = useState(null);
  const [superAdminExists, setSuperAdminExists] = useState(false);
  const [checkingSuperAdmin, setCheckingSuperAdmin] = useState(true);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadUserData();
      setCheckingSuperAdmin(false);
    } else {
      checkSuperAdminExistence();
    }
  }, [user]);

  const checkSuperAdminExistence = async () => {
    try {
      const response = await api.get('/api/university/superusers');
      const hasSuperAdmin = response.data.data && response.data.data.length > 0;
      setSuperAdminExists(hasSuperAdmin);
    } catch (error) {
      handleApiError(error, 'Error al verificar superadministradores');
      setSuperAdminExists(false);
    } finally {
      setCheckingSuperAdmin(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadUserData = async () => {
    if (!user) return;

    try {
      if (user.tipo === USER_TYPES.PERSONAL) {
        const response = await api.get('/api/university/personal');
        
        if (response.data.success) {
          const allPersonal = response.data.data || [];
          const currentUserData = allPersonal.find(p => p.id === user.id);
          
          if (currentUserData) {
            setUserFullData(currentUserData);
            loadPhoto(currentUserData.foto_perfil);
            return;
          }
        }
      }
      
      setUserFullData(null);
      
    } catch (error) {
      handleApiError(error, 'Error al cargar datos del usuario');
      setUserFullData(null);
    }
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    if (onLogout) onLogout();
    navigate(ROUTES.LOGIN);
  };

  const getDashboardPath = () => {
    if (!user) return ROUTES.LOGIN;
    return DASHBOARD_BY_TYPE[user.tipo] || ROUTES.HOME;
  };

  const getUserRole = () => {
    if (!user) return '';
    switch(user.tipo) {
      case USER_TYPES.SUPERADMIN: return 'Super Administrador';
      case USER_TYPES.DIRECTIVO: return `Directivo - ${user.cargo || ''}`;
      case USER_TYPES.PERSONAL: return `Personal - ${user.puesto || ''}`;
      default: return 'Usuario';
    }
  };

  const getUserInitials = () => {
    if (!user) return '?';
    
    const name = user.nombre || user.username || 'Usuario';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const getDisplayName = () => {
    if (!user) return '';
    return user.nombre || user.username || 'Usuario';
  };

  return (
    <header className="university-header">
      <div className="header-content">
        <div className="logo-container">
          {/* Logo de STRIDE */}
          <div className="stride-logo-section">
            {strideLogoUrl ? (
              <div className="stride-logo-container-small">
                <img 
                  src={strideLogoUrl} 
                  alt="STRIDE" 
                  className="stride-logo-small"
                  title="STRIDE - Sistema de Gestión"
                />
              </div>
            ) : (
              <div className="logo-icon-small">🎓</div>
            )}
          </div>

          {/* Logo de la institución */}
          <div className="institution-logo-section">
            {logoUrl ? (
              <div className="logo-with-controls">
                <div className="institution-logo-container">
                  <img 
                    src={logoUrl} 
                    alt="Logo de la Institución" 
                    className="institution-logo"
                  />
                </div>
                
                {user?.tipo === USER_TYPES.SUPERADMIN && (
                  <button 
                    className="btn-logo-action"
                    onClick={() => setShowLogoUpload(true)}
                    title="Cambiar logo"
                  >
                    Cambiar
                  </button>
                )}
              </div>
            ) : (
              user?.tipo === USER_TYPES.SUPERADMIN && (
                <div className="no-logo-section">
                  <div className="no-logo-message">
                    <span className="no-logo-icon">🏫</span>
                    <span className="no-logo-text">Sin logo</span>
                  </div>
                  <button 
                    className="btn-add-logo"
                    onClick={() => setShowLogoUpload(true)}
                    title="Agregar logo"
                  >
                    + Agregar
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        <LogoUploadModal
          show={showLogoUpload}
          onClose={() => setShowLogoUpload(false)}
          logoUrl={logoUrl}
          onLogoUpdate={reloadLogo}
          user={user}
        />

        <nav className="nav-menu">
          <Link to={ROUTES.HOME} className="nav-link">Inicio</Link>
          
          {user ? (
            <>
              {/* Mis actividades (dashboard) */}
              <Link to={getDashboardPath()} className="nav-link">
                Mis actividades
              </Link>
              
              {/* Tareas - SOLO PARA PERSONAL con badge */}
              {user.tipo === USER_TYPES.PERSONAL && (
                <Link to={ROUTES.PERSONAL_TAREAS} className="nav-link tareas-link">
                  <span className="tareas-icon"></span>
                  Tareas
                  {tareasPendientes > 0 && (
                    <span className="tareas-badge">{tareasPendientes}</span>
                  )}
                </Link>
              )}
              
              {/* Tareas - PARA SUPER ADMIN (sin badge) */}
              {user.tipo === USER_TYPES.SUPERADMIN && (
                <Link to={ROUTES.ADMIN_TAREAS} className="nav-link">
                  <span className="tareas-icon"></span>
                  Tareas
                </Link>
              )}
              
              {/* Perfil del usuario */}
              <div className="user-profile-compact" ref={userMenuRef}>
                <button 
                  className="user-avatar-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title="Mi cuenta"
                >
                  {userPhoto ? (
                    <img 
                      src={userPhoto} 
                      alt={getDisplayName()}
                      className="avatar-photo"
                    />
                  ) : (
                    <div className="avatar-circle">
                      {getUserInitials()}
                    </div>
                  )}
                </button>
                
                {showUserMenu && (
                  <div className="user-dropdown-menu">
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">
                        {userPhoto ? (
                          <img 
                            src={userPhoto} 
                            alt={getDisplayName()}
                            className="avatar-photo-large"
                          />
                        ) : (
                          <div className="avatar-circle-large">
                            {getUserInitials()}
                          </div>
                        )}
                      </div>
                      <div className="dropdown-user-info">
                        <div className="dropdown-greeting">
                          ¡Hola, <strong>{getDisplayName()}!</strong>
                        </div>
                        <div className="dropdown-role">
                          {getUserRole()}
                        </div>
                        <div className="dropdown-email">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    
                    <div className="dropdown-divider"></div>
                    
                    <div className="dropdown-actions">
                      <button 
                        className="dropdown-item logout-item"
                        onClick={handleLogout}
                      >
                        <span className="dropdown-icon">🚪</span>
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className="nav-link active">
                Iniciar Sesión
              </Link>
              {!checkingSuperAdmin && !superAdminExists && (
                <Link to={ROUTES.CREATE_SUPERADMIN} className="nav-link">
                  Crear Super Admin
                </Link>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Estilos para el badge y tareas-link */}
      <style jsx>{`
        .tareas-link {
          position: relative;
          background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
          color: white !important;
          padding: 6px 15px !important;
          border-radius: 30px !important;
          margin-left: 5px;
          transition: all 0.3s ease;
        }
        
        .tareas-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(56, 189, 248, 0.4);
        }
        
        .tareas-icon {
          margin-right: 4px;
          font-size: 1.1rem;
        }
        
        .tareas-badge {
          background: #0ea5e9;
          color: white;
          font-size: 0.7rem;
          font-weight: bold;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 6px;
          padding: 0 4px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(14, 165, 233, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(14, 165, 233, 0);
          }
        }
        
        @media (max-width: 768px) {
          .tareas-link {
            margin-left: 0;
            margin-top: 5px;
            text-align: center;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;
