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
  const [previewUrl, setPreviewUrl] = useState(null);
  const [superAdminExists, setSuperAdminExists] = useState(false);
  const [checkingSuperAdmin, setCheckingSuperAdmin] = useState(true);
  const userMenuRef = useRef(null);

  useEffect(() => {
    loadLogo();
    loadStrideLogo();
    if (user) {
      loadUserData();
      if (user.tipo === 'personal') {
        cargarTareasPendientes();
      }
      setCheckingSuperAdmin(false);
    } else {
      checkSuperAdminExistence();
    }
  }, [user]);

  const checkSuperAdminExistence = async () => {
    try {
      const response = await axios.get('https://api1.strideutmat.com/api/university/superusers');
      const hasSuperAdmin = response.data.data && response.data.data.length > 0;
      setSuperAdminExists(hasSuperAdmin);
    } catch (error) {
      console.error('Error verificando super admin:', error);
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

  const cargarTareasPendientes = async () => {
    try {
      const response = await axios.get(`https://api1.strideutmat.com/api/university/tareas/personal/${user.id}/conteo`);
      if (response.data.success) {
        setTareasPendientes(response.data.data.pendientes);
      }
    } catch (error) {
      console.error('Error cargando tareas pendientes:', error);
    }
  };

  const loadLogo = () => {
    const baseUrl = 'https://api1.strideutmat.com/uploads/logos/institution-logo';
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
    const logoPath = 'https://api1.strideutmat.com/uploads/logo_app/STRIDE%20WITHE%20LETTERS.png';
    
    const img = new Image();
    img.onload = () => {
      console.log('✅ Logo de STRIDE cargado correctamente');
      setStrideLogoUrl(logoPath);
    };
    img.onerror = () => {
      console.log('❌ Error al cargar el logo de STRIDE, usando alternativo');
      const alternativePath = 'https://api1.strideutmat.com/uploads/logo_app/stride-logo.png';
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
        const response = await axios.get('https://api1.strideutmat.com/api/university/personal');
        
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
    
    // ✅ CORREGIDO: array con comas correctas y solo usando api1
    const urlsToTry = [
      `https://api1.strideutmat.com/api/university/personal/foto/${fotoPerfil}`,
      `https://api1.strideutmat.com/uploads/personal/${fotoPerfil}`,
      `https://api1.strideutmat.com/api/university/personal/foto/default-avatar.png`,
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

      const response = await axios.post('https://api1.strideutmat.com/api/university/upload-logo', formData, {
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
      const response = await axios.delete('https://api1.strideutmat.com/api/university/delete-logo');
      
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

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

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
    img.src = objectUrl;
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

        {/* Modal para subir/cambiar logo */}
        {showLogoUpload && (
          <div 
            onClick={() => { setShowLogoUpload(false); setLogoFile(null); setPreviewUrl(null); }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 9999
            }}
          >
            <div 
              onClick={e => e.stopPropagation()}
              style={{
                background: 'white', borderRadius: '14px',
                width: '100%', maxWidth: '460px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                overflow: 'hidden'
              }}
            >
              {/* Header del modal */}
              <div style={{
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                padding: '20px 25px', color: 'white', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  {logoUrl ? '🔄 Cambiar Logo' : '➕ Agregar Logo'}
                </h3>
                <button
                  onClick={() => { setShowLogoUpload(false); setLogoFile(null); setPreviewUrl(null); }}
                  style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                    width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer',
                    fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >✕</button>
              </div>

              {/* Cuerpo del modal */}
              <div style={{ padding: '25px' }}>

                {/* Preview de imagen actual o nueva */}
                <div style={{
                  background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '10px',
                  padding: '20px', textAlign: 'center', marginBottom: '20px', minHeight: '130px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {previewUrl ? (
                    <div>
                      <img 
                        src={previewUrl} 
                        alt="Preview nuevo logo"
                        style={{ maxHeight: '100px', maxWidth: '100%', borderRadius: '6px', objectFit: 'contain' }}
                      />
                      <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                        Vista previa del nuevo logo
                      </p>
                    </div>
                  ) : logoUrl ? (
                    <div>
                      <img 
                        src={logoUrl} 
                        alt="Logo actual"
                        style={{ maxHeight: '100px', maxWidth: '100%', borderRadius: '6px', objectFit: 'contain' }}
                      />
                      <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                        Logo actual
                      </p>
                    </div>
                  ) : (
                    <div style={{ color: '#94a3b8' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🏫</div>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>Sin logo actualmente</p>
                    </div>
                  )}
                </div>

                {/* Input de archivo */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                    Seleccionar nueva imagen:
                  </label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ 
                      width: '100%', padding: '8px', border: '1px solid #d1d5db',
                      borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box'
                    }}
                  />
                  <small style={{ color: '#6b7280', display: 'block', marginTop: '5px' }}>
                    Máximo 2MB · PNG, JPG, GIF, SVG, WebP · Se recomienda formato horizontal
                  </small>
                </div>

                {/* Botones */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={handleLogoUpload}
                    disabled={uploadingLogo || !logoFile}
                    style={{
                      flex: 1, background: uploadingLogo || !logoFile ? '#94a3b8' : '#2563eb',
                      color: 'white', border: 'none', padding: '11px 16px',
                      borderRadius: '8px', cursor: uploadingLogo || !logoFile ? 'not-allowed' : 'pointer',
                      fontWeight: '600', fontSize: '0.95rem'
                    }}
                  >
                    {uploadingLogo ? '⏳ Subiendo...' : '📤 Subir Logo'}
                  </button>

                  {logoUrl && (
                    <button 
                      onClick={handleLogoDelete}
                      style={{
                        background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5',
                        padding: '11px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                  )}

                  <button 
                    onClick={() => { setShowLogoUpload(false); setLogoFile(null); setPreviewUrl(null); }}
                    style={{
                      background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
                      padding: '11px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                <Link to="/personal/tareas" className="nav-link tareas-link" onClick={() => setTareasPendientes(0)}>
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
              {!checkingSuperAdmin && !superAdminExists && (
                <Link to="/create-superadmin" className="nav-link">
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
