import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState(null);
  const [strideLogoUrl, setStrideLogoUrl] = useState(null);
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userPhoto, setUserPhoto] = useState(null);
  const [userFullData, setUserFullData] = useState(null);
  const [tareasPendientes, setTareasPendientes] = useState(0);
  const userMenuRef = useRef(null);

  useEffect(() => {
    loadLogo();
    loadStrideLogo();
    if (user) {
      loadUserData();
      if (user.tipo === 'personal') {
        cargarTareasPendientes();
      }
    }
  }, [user]);

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

  const cargarTareasPendientes = async () => {
    try {
      const response = await axios.get(`/api/university/tareas/personal/${user.id}/conteo`);
      if (response.data.success) {
        setTareasPendientes(response.data.data.pendientes);
      }
    } catch (error) {
      console.error('Error cargando tareas pendientes:', error);
    }
  };

  const loadLogo = () => {
    const baseUrl = '/uploads/logos/institution-logo';
    const extensions = ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg'];
    
    const imagePromises = extensions.map(ext => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ found: true, url: baseUrl + ext });
        };
        img.onerror = () => {
          resolve({ found: false, url: baseUrl + ext });
        };
        img.src = baseUrl + ext;
      });
    });

    Promise.all(imagePromises).then(results => {
      const foundLogo = results.find(result => result.found);
      if (foundLogo) {
        setLogoUrl(foundLogo.url);
      } else {
        setLogoUrl(null);
      }
    });
  };

  const loadStrideLogo = () => {
    const logoPath = '/uploads/logo_app/STRIDE%20WITHE%20LETTERS.png';
    
    const img = new Image();
    img.onload = () => {
      console.log('✅ Logo de STRIDE cargado correctamente');
      setStrideLogoUrl(logoPath);
    };
    img.onerror = () => {
      console.log('❌ Error al cargar el logo de STRIDE, usando alternativo');
      const alternativePath = '/uploads/logo_app/stride-logo.png';
      const img2 = new Image();
      img2.onload = () => {
        setStrideLogoUrl(alternativePath);
      };
      img2.onerror = () => {
        setStrideLogoUrl(null);
      };
      img2.src = alternativePath;
    };
    img.src = logoPath;
  };

  const loadUserData = async () => {
    if (!user) return;

    console.log('🔍 Cargando datos completos para usuario:', {
      id: user.id,
      tipo: user.tipo,
      email: user.email
    });

    try {
      if (user.tipo === 'personal') {
        const response = await axios.get('/api/university/personal');
        
        if (response.data.success) {
          const allPersonal = response.data.data || [];
          const currentUserData = allPersonal.find(p => p.id === user.id);
          
          if (currentUserData) {
            setUserFullData(currentUserData);
            
            if (currentUserData.foto_perfil) {
              loadUserPhoto(currentUserData.foto_perfil);
            } else {
              setUserPhoto(null);
            }
            return;
          }
        }
      }
      
      setUserPhoto(null);
      setUserFullData(null);
      
    } catch (error) {
      console.error('❌ Error obteniendo datos:', error);
      setUserPhoto(null);
      setUserFullData(null);
    }
  };

  const loadUserPhoto = (fotoPerfil) => {
    if (!fotoPerfil) {
      setUserPhoto(null);
      return;
    }

    console.log('📸 Cargando foto:', fotoPerfil);
    
    const urlsToTry = [
      `/api/university/personal/foto/${fotoPerfil}`,
      `/uploads/personal/${fotoPerfil}`,
      `/api/university/personal/foto/default-avatar.png`
    ];

    const tryLoadImage = (index) => {
      if (index >= urlsToTry.length) {
        console.log('❌ Todas las URLs fallaron');
        setUserPhoto(null);
        return;
      }

      const url = urlsToTry[index];
      console.log(`🔄 Probando URL ${index + 1}: ${url}`);

      const img = new Image();
      img.onload = () => {
        console.log(`✅ Foto cargada desde: ${url}`);
        setUserPhoto(url);
      };
      img.onerror = () => {
        console.log(`❌ Falló URL: ${url}`);
        tryLoadImage(index + 1);
      };
      img.src = url;
    };

    tryLoadImage(0);
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error('Selecciona un archivo primero');
      return;
    }

    setUploadingLogo(true);
    
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      formData.append('uploaded_by', user?.username || 'system');
      formData.append('user_type', user?.tipo || 'system');

      const response = await axios.post('/api/university/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Logo actualizado correctamente');
        setShowLogoUpload(false);
        setLogoFile(null);
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Error subiendo logo:', error);
      toast.error('Error al subir el logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar el logo actual?')) {
      return;
    }

    try {
      const response = await axios.delete('/api/university/delete-logo');
      
      if (response.data.success) {
        toast.success('Logo eliminado correctamente');
        setLogoUrl(null);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Error eliminando logo:', error);
      toast.error('Error al eliminar el logo');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('El logo debe ser menor a 2MB');
      return;
    }

    const img = new Image();
    img.onload = function() {
      const width = this.width;
      const height = this.height;
      
      if (height > width) {
        toast.warning('Recomendación: Los logos horizontales se ven mejor');
      }
      
      file.width = width;
      file.height = height;
      setLogoFile(file);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    localStorage.removeItem('stride_user');
    if (onLogout) onLogout();
    toast.info('Sesión cerrada correctamente');
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch(user.tipo) {
      case 'superadmin': return '/admin/dashboard';
      case 'directivo': return '/directivo/dashboard';
      case 'personal': return '/personal/dashboard';
      default: return '/';
    }
  };

  const getUserRole = () => {
    if (!user) return '';
    switch(user.tipo) {
      case 'superadmin': return 'Super Administrador';
      case 'directivo': return `Directivo - ${user.cargo || ''}`;
      case 'personal': return `Personal - ${user.puesto || ''}`;
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
                
                {user?.tipo === 'superadmin' && (
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
              user?.tipo === 'superadmin' && (
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

        {/* Modal para logo (lo omito por espacio, pero mantén el que ya tienes) */}

        <nav className="nav-menu">
          <Link to="/" className="nav-link">Inicio</Link>
          
          {user ? (
            <>
              {/* Mis actividades (dashboard) */}
              <Link to={getDashboardPath()} className="nav-link">
                Mis actividades
              </Link>
              
              {/* Tareas - SOLO PARA PERSONAL con badge */}
              {user.tipo === 'personal' && (
                <Link to="/personal/tareas" className="nav-link tareas-link">
                  <span className="tareas-icon"></span>
                  Tareas
                  {tareasPendientes > 0 && (
                    <span className="tareas-badge">{tareasPendientes}</span>
                  )}
                </Link>
              )}
              
              {/* Tareas - PARA SUPER ADMIN (sin badge) */}
              {user.tipo === 'superadmin' && (
                <Link to="/admin/tareas" className="nav-link">
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
              <Link to="/login" className="nav-link active">
                Iniciar Sesión
              </Link>
              <Link to="/create-superadmin" className="nav-link">
                Crear Super Admin
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Estilos para el badge y tareas-link */}
      <style jsx>{`
        .tareas-link {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important;
          padding: 6px 15px !important;
          border-radius: 30px !important;
          margin-left: 5px;
          transition: all 0.3s ease;
        }
        
        .tareas-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);
        }
        
        .tareas-icon {
          margin-right: 4px;
          font-size: 1.1rem;
        }
        
        .tareas-badge {
          background: #ef4444;
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
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
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