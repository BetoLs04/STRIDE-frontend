import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { ROUTES, getRoutePrefix } from '../../constants/routes';
import Slider from 'react-slick';
import { toast } from 'react-toastify';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import '../../styles/App.css';
import '../../styles/Home.css';
import '../../styles/DownloadButton.css';
import { handleApiError } from '../../utils/errorHandler';
import { USER_TYPES, STORAGE_KEYS } from '../../constants/index';

const Home = () => {
  const navigate = useNavigate();
  const [superAdminExists, setSuperAdminExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comunicados, setComunicados] = useState([]);
  const [comunicadosLoading, setComunicadosLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const carouselSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    arrows: false,
    adaptiveHeight: true,
    beforeChange: (current, next) => setCurrentSlide(next)
  };

  useEffect(() => {
    checkSuperAdminExistence();
    fetchComunicadosRecientes();

    const user = localStorage.getItem(STORAGE_KEYS.USER);
    if (user) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLinkClick = (url) => {
    if (isLoggedIn) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast.warning('🔒 Por favor inicie sesión para acceder a este enlace.');
    }
  };

  const handleMatrizClick = async () => {
    if (!isLoggedIn) {
      toast.warning('🔒 Por favor inicie sesión para acceder a este enlace.');
      return;
    }
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
    if (userData?.tipo === USER_TYPES.SUPERADMIN) {
      navigate(ROUTES.ADMIN_DASHBOARD, { state: { tab: 'matriz' } });
      return;
    }
    try {
      const res = await api.get('/api/university/matriz-secciones');
      const secciones = (res.data.data || []).filter(s =>
        s.usuarios && s.usuarios.some(u => u.usuario_id === userData.id && u.usuario_tipo === userData.tipo)
      );
      if (secciones.length === 0) {
        toast.error('🚫 Permiso denegado. No tienes acceso a la Matriz de Indicadores.');
        return;
      }
      const prefix = getRoutePrefix(userData.tipo);
      navigate(`${prefix}/matriz-indicadores/${secciones[0].id}`);
    } catch (error) {
      handleApiError(error, 'Error al cargar secciones de la matriz');
    }
  };

  const handleSMOAClick = async () => {
    if (!isLoggedIn) {
      toast.warning('🔒 Por favor inicie sesión para acceder a este enlace.');
      return;
    }
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
    if (userData?.tipo === USER_TYPES.SUPERADMIN) {
      navigate(ROUTES.ADMIN_DASHBOARD, { state: { tab: 'smoa' } });
      return;
    }
    try {
      const res = await api.get('/api/university/smoa-usuarios');
      const asignados = res.data.data || [];
      const tieneAcceso = asignados.some(u => u.usuario_id === userData.id && u.usuario_tipo === userData.tipo);
      if (!tieneAcceso) {
        toast.error('🚫 Permiso denegado. No tienes acceso al SMOA.');
        return;
      }
      const prefix = getRoutePrefix(userData.tipo);
      navigate(`${prefix}/smoa`);
    } catch (error) {
      handleApiError(error, 'Error al cargar datos SMOA');
    }
  };

  const handleSepladeClick = async () => {
    if (!isLoggedIn) {
      toast.warning('🔒 Por favor inicie sesión para acceder a este enlace.');
      return;
    }
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
    if (userData?.tipo === USER_TYPES.SUPERADMIN) {
      navigate(ROUTES.ADMIN_DASHBOARD, { state: { tab: 'seplade' } });
      return;
    }
    try {
      const res = await api.get('/api/university/seplade-hojas');
      const hojas = res.data.data || [];
      const prefix = getRoutePrefix(userData.tipo);
      if (hojas.length > 0) {
        navigate(`${prefix}/seplade/${hojas[0].id}`);
      } else {
        toast.error('🚫 No hay hojas SEPLADE disponibles.');
      }
    } catch (error) {
      handleApiError(error, 'Error al cargar hojas SEPLADE');
    }
  };

  const checkSuperAdminExistence = async () => {
    try {
      const response = await api.get('/api/university/superusers');
      const hasSuperAdmin = response.data.data && response.data.data.length > 0;
      setSuperAdminExists(hasSuperAdmin);
    } catch (error) {
      handleApiError(error, 'Error al verificar superusuarios');
      setSuperAdminExists(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchComunicadosRecientes = async () => {
    try {
      setComunicadosLoading(true);
      const response = await api.get('/api/university/comunicados-recientes?limit=10');

      if (response.data.success) {
        setComunicados(response.data.data || []);
      }
    } catch (error) {
      handleApiError(error, 'Error al cargar comunicados recientes');
    } finally {
      setComunicadosLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const goToSlide = (index) => {
    if (sliderRef.current) {
      sliderRef.current.slickGoTo(index);
    }
  };

  const goToNext = () => {
    if (sliderRef.current) {
      sliderRef.current.slickNext();
    }
  };

  const goToPrev = () => {
    if (sliderRef.current) {
      sliderRef.current.slickPrev();
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando configuración del sistema...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Hero Section */}

      {/* Carrusel Horizontal de Comunicados */}
      {comunicados.length > 0 && (
        <div className="comunicados-carousel-section" style={{
          margin: '4rem 0',
          background: 'white',
          borderRadius: '15px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
          overflow: 'hidden',
          border: '1px solid #e9ecef'
        }}>
          {comunicadosLoading ? (
            <div className="loading-container" style={{ minHeight: '300px', padding: '3rem' }}>
              <div className="spinner"></div>
              <p>Cargando comunicados...</p>
            </div>
          ) : (
            <>
              <Slider {...carouselSettings} ref={sliderRef}>
                {comunicados.map((comunicado) => (
                  <div key={comunicado.id}>
                    <div className="comunicado-card-admin" style={{
                      borderLeft: '4px solid var(--turquesa)',
                      borderRadius: '0',
                      boxShadow: 'none',
                      margin: '0'
                    }}>
                      <div className="comunicado-header-admin" style={{ cursor: 'default' }}>
                        <div className="comunicado-title-admin">
                          <h3>
                            {comunicado.titulo}
                            {comunicado.link_externo && (
                              <span className="link-indicator" title="Tiene enlace">🔗</span>
                            )}
                          </h3>
                          <div className="comunicado-meta-admin">
                            <span className="comunicado-fecha-admin">
                              📅 {formatDate(comunicado.fecha_publicacion)}
                            </span>
                            <span className="comunicado-creador-admin">
                              👤 {comunicado.publicado_por_nombre || 'Administración'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="comunicado-content-admin">
                        <div
                          className="comunicado-contenido-admin"
                          lang="es"
                          style={{
                            textAlign: 'justify',
                            whiteSpace: 'normal',
                            wordBreak: 'normal',
                            overflowWrap: 'break-word',
                            fontSize: '0.95rem'
                          }}
                          dangerouslySetInnerHTML={{ __html: comunicado.contenido ? comunicado.contenido.replace(/&nbsp;/g, ' ') : '' }}
                        />

                        {comunicado.link_externo && (
                          <div className="comunicado-link-admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap', width: '100%', overflow: 'hidden' }}>
                            <strong style={{ whiteSpace: 'nowrap' }}>Enlace relacionado: </strong>
                            <a
                              href={comunicado.link_externo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link-externo-admin"
                              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
                            >
                              {comunicado.link_externo}
                            </a>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                navigator.clipboard.writeText(comunicado.link_externo);
                                toast.success('Enlace copiado al portapapeles');
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary-blue)'
                              }}
                              title="Copiar enlace"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                            </button>
                          </div>
                        )}

                        {comunicado.archivos?.length > 0 && (
                          <div style={{ margin: '1rem 0', padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
                            <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#166534', fontSize: '0.9rem' }}>📎 Archivos adjuntos:</strong>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {comunicado.archivos.map(arch => (
                                <div key={arch.id} style={{
                                  display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.6rem',
                                  background: 'white', border: '1px solid #dcfce7', borderRadius: '6px',
                                  fontSize: '0.85rem'
                                }}>
                                  <span>{arch.tipo_mime?.startsWith('image/') ? '🖼️' : '📄'}</span>
                                  <a href={arch.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, color: '#166534', textDecoration: 'none', cursor: 'pointer' }}
                                    title="Abrir archivo">
                                    {arch.nombre_original}
                                  </a>
                                  <span style={{ color: '#6b7280' }}>({(arch.tamano / 1024).toFixed(1)} KB)</span>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(arch.url);
                                        const blob = await res.blob();
                                        const blobUrl = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = blobUrl;
                                        a.download = arch.nombre_original;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(blobUrl);
                                      } catch (e) {
                                        console.error('Error al descargar:', e);
                                      }
                                    }}
                                    className="download-btn-icon"
                                    title="Descargar archivo"
                                    style={{
                                      background: '#166534', border: 'none', cursor: 'pointer', width: '32px', height: '32px',
                                      borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      color: '#fff', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 6px rgba(22,101,52,0.3)',
                                      flexShrink: 0
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(22,101,52,0.4)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(22,101,52,0.3)' }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                      <polyline points="7 10 12 15 17 10"></polyline>
                                      <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>

              {/* Navegación inferior */}
              {comunicados.length > 1 && (
                <div style={{
                  padding: '1rem 2rem',
                  background: '#f8f9fa',
                  borderTop: '1px solid #e9ecef',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    {comunicados.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`carousel-dot ${currentSlide === index ? 'active' : ''}`}
                        title={`Ir al comunicado ${index + 1}`}
                        aria-label={`Ir al comunicado ${index + 1}`}
                      />
                    ))}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      color: 'var(--medium-gray)',
                      fontSize: '0.95rem'
                    }}>
                      Comunicado <strong>{currentSlide + 1}</strong> de <strong>{comunicados.length}</strong>
                    </span>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={goToPrev}
                        className="btn btn-primary btn-small"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      >
                        ← Siguiente
                      </button>
                      <button
                        onClick={goToNext}
                        className="btn btn-primary btn-small"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      >
                        Anterior →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Si no hay comunicados */}
      {!comunicadosLoading && comunicados.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '15px',
          margin: '3rem 0',
          border: '2px dashed #ced4da'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: '0.5' }}>📢</div>
          <h3 style={{ color: 'var(--primary-blue)', marginBottom: '0.5rem', fontSize: '1.8rem' }}>
            No hay comunicados publicados
          </h3>
          <p style={{ color: 'var(--medium-gray)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            No se han publicado comunicados oficiales todavía.
          </p>
          <p style={{ fontSize: '0.95rem', color: '#6c757d', fontStyle: 'italic' }}>
            Los comunicados aparecerán aquí cuando sean publicados por la administración.
          </p>
        </div>
      )}

      {/* Enlaces y Recursos */}
      <div className="features-grid" style={{ marginTop: '3rem' }}>
        <div
          className="feature-card"
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '150px' }}
          onClick={() => handleLinkClick('https://docs.google.com/spreadsheets/d/1KGx6xJbtxp-Cszxzp3kt-quJFiNUAza7ERufQrb6UuM/edit?pli=1&gid=440700565#gid=440700565')}
        >
          <div className="feature-icon">{isLoggedIn ? '📊' : '🔒'}</div>
          <h3 style={{ marginBottom: 0 }}>POA</h3>
        </div>

        <div
          className="feature-card"
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '150px' }}
          onClick={handleSepladeClick}
        >
          <div className="feature-icon">{isLoggedIn ? '📑' : '🔒'}</div>
          <h3 style={{ marginBottom: 0 }}>SEPLADE</h3>
        </div>

        <div
          className="feature-card"
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '150px' }}
          onClick={handleMatrizClick}
        >
          <div className="feature-icon">{isLoggedIn ? '📋' : '🔒'}</div>
          <h3 style={{ marginBottom: 0 }}>MATRIZ DE INDICADORES</h3>
        </div>

        <div
          className="feature-card"
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '150px' }}
          onClick={handleSMOAClick}
        >
          <div className="feature-icon">{isLoggedIn ? '📊' : '🔒'}</div>
          <h3 style={{ marginBottom: 0 }}>SMOA</h3>
        </div>
      </div>
    </div>
  );
};

export default Home;
