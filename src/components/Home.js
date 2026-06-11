import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Slider from 'react-slick';
import { toast } from 'react-toastify';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import '../styles/App.css';

const Home = () => {
  const navigate = useNavigate();
  const [superAdminExists, setSuperAdminExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comunicados, setComunicados] = useState([]);
  const [comunicadosLoading, setComunicadosLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Configuración del carrusel SIMPLIFICADA
  const carouselSettings = {
    dots: false, // Desactivamos los dots nativos
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    arrows: false,
    adaptiveHeight: true,
    afterChange: (current) => setCurrentSlide(current),
    fade: false,
    swipe: true,
    touchMove: true,
    draggable: true
  };

  useEffect(() => {
    checkSuperAdminExistence();
    fetchComunicadosRecientes();

    // Check if user is logged in
    const user = localStorage.getItem('stride_user');
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

  const checkSuperAdminExistence = async () => {
    try {
      const response = await axios.get('https://api1.strideutmat.com/api/university/superusers');
      const hasSuperAdmin = response.data.data && response.data.data.length > 0;
      setSuperAdminExists(hasSuperAdmin);
    } catch (error) {
      console.error('Error verificando super admin:', error);
      setSuperAdminExists(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchComunicadosRecientes = async () => {
    try {
      setComunicadosLoading(true);
      const response = await axios.get('https://api1.strideutmat.com/api/university/comunicados-recientes?limit=10');

      if (response.data.success) {
        setComunicados(response.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando comunicados:', error);
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

  // Función para renderizar HTML con estilos
  const renderHtmlContent = (html) => {
    return { __html: html || '' };
  };

  // Función para extraer texto plano para vista previa
  const extractPlainText = (html) => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
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

      {/* Carrusel de Comunicados - CON ESTILOS IGUALES AL PANEL */}
      {comunicados.length > 0 && (
        <div className="comunicados-carousel-section" style={{
          margin: '4rem 0',
          background: 'white',
          borderRadius: '15px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
          overflow: 'hidden',
          border: '1px solid #e9ecef'
        }}>

          {/* Contenido del carrusel */}
          <div style={{ padding: '0', position: 'relative' }}>
            {comunicadosLoading ? (
              <div className="loading-container" style={{ minHeight: '300px', padding: '3rem' }}>
                <div className="spinner"></div>
                <p>Cargando comunicados...</p>
              </div>
            ) : (
              <>

                {/* Carrusel principal */}
                <Slider
                  {...carouselSettings}
                  ref={sliderRef}
                >
                  {comunicados.map((comunicado) => {
                    const plainText = extractPlainText(comunicado.contenido);

                    return (
                      <div key={comunicado.id} className="comunicado-slide">
                        <div style={{
                          padding: '0',
                          minHeight: 'auto',
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          {/* Título y metadatos - COMPACTADO */}
                          <div style={{
                            marginBottom: '0.2rem',
                            paddingBottom: '0.4rem',
                            borderBottom: '2px solid #e9ecef',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                          }}>
                            <div>
                              <h3 style={{
                                margin: '0 0 0.3rem -2px',
                                color: 'var(--primary-blue)',
                                fontSize: '2.2rem',
                                lineHeight: '1.2',
                                fontWeight: '700',
                                paddingLeft: '2px'
                              }}>
                                {comunicado.titulo}
                              </h3>

                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.8rem',
                                flexWrap: 'wrap'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}>
                                  <span style={{
                                    color: 'var(--secondary-blue)',
                                    fontSize: '1rem'
                                  }}>
                                    👤
                                  </span>
                                  <span style={{
                                    fontSize: '1rem',
                                    color: 'var(--medium-gray)',
                                    fontWeight: '500'
                                  }}>
                                    {comunicado.publicado_por_nombre || 'Administración'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              gap: '0.8rem',
                              marginTop: '0.2rem'
                            }}>
                              {/* Botones de navegación integrados */}
                              {comunicados.length > 1 && (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button
                                    onClick={goToPrev}
                                    style={{
                                      padding: '0.4rem 0.8rem',
                                      borderRadius: '8px',
                                      border: '2px solid var(--primary-blue)',
                                      background: 'white',
                                      color: 'var(--primary-blue)',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      fontSize: '0.85rem',
                                      transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'var(--primary-blue)';
                                      e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'white';
                                      e.currentTarget.style.color = 'var(--primary-blue)';
                                    }}
                                  >
                                    ← Siguiente
                                  </button>

                                  <button
                                    onClick={goToNext}
                                    style={{
                                      padding: '0.4rem 0.8rem',
                                      borderRadius: '8px',
                                      border: '2px solid var(--primary-blue)',
                                      background: 'white',
                                      color: 'var(--primary-blue)',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      fontSize: '0.85rem',
                                      transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'var(--primary-blue)';
                                      e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'white';
                                      e.currentTarget.style.color = 'var(--primary-blue)';
                                    }}
                                  >
                                    Anterior →
                                  </button>
                                </div>
                              )}

                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}>
                                <span style={{
                                  color: 'var(--secondary-blue)',
                                  fontSize: '1rem'
                                }}>
                                  📅
                                </span>
                                <span style={{
                                  fontSize: '1rem',
                                  color: 'var(--medium-gray)',
                                  fontWeight: '500'
                                }}>
                                  {formatDate(comunicado.fecha_publicacion)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Contenido CON FORMATO HTML - COMPACTO */}
                          <div
                            className="comunicado-content-html"
                            style={{
                              padding: '0.5rem',
                              background: '#f8fafc',
                              borderRadius: '10px',
                              border: '1px solid #e9ecef',
                              overflowY: 'auto',
                              overflowX: 'hidden'
                            }}
                          >
                            <div
                              dangerouslySetInnerHTML={renderHtmlContent(comunicado.contenido)}
                              style={{
                                color: '#212529'
                              }}
                            />

                            {plainText.length > 1500 && (
                              <div style={{
                                marginTop: '1.5rem',
                                paddingTop: '1rem',
                                borderTop: '1px dashed #dee2e6',
                                textAlign: 'center'
                              }}>
                                <span style={{
                                  color: 'var(--medium-gray)',
                                  fontSize: '0.9rem',
                                  fontStyle: 'italic'
                                }}>
                                  💡 El comunicado continúa. Ve al panel de administración para más detalles.
                                </span>
                              </div>
                            )}

                            {/* ===== ENLACE EXTERNO ===== */}
                            {comunicado.link_externo && (
                              <div style={{
                                marginTop: '1rem',
                                paddingTop: '1rem',
                                borderTop: '1px dashed #dee2e6',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                flexWrap: 'wrap'
                              }}>
                                {/* Enlace clickeable */}
                                <a
                                  href={comunicado.link_externo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--primary-blue)',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    textDecoration: 'none',
                                    padding: '8px 14px',
                                    background: '#f0f4ff',
                                    borderRadius: '8px',
                                    border: '1px solid #dbeafe',
                                    maxWidth: '350px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  🔗 {comunicado.link_externo}
                                </a>

                                {/* Botón copiar */}
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(comunicado.link_externo)
                                      .then(() => {
                                        const btn = document.getElementById(`copy-btn-${comunicado.id}`);
                                        if (btn) {
                                          btn.textContent = '✅ Copiado';
                                          setTimeout(() => { btn.textContent = '📋 Copiar'; }, 2000);
                                        }
                                      })
                                      .catch(() => alert('No se pudo copiar: ' + comunicado.link_externo));
                                  }}
                                  id={`copy-btn-${comunicado.id}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 14px',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    color: '#475569',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  📋 Copiar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </Slider>

                {/* Navegación inferior */}
                {comunicados.length > 1 && (
                  <div style={{
                    padding: '1.5rem 2rem',
                    background: '#f8f9fa',
                    borderTop: '1px solid #e9ecef',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    {/* Puntos de navegación MEJORADOS */}
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

                    {/* Información y controles */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        color: 'var(--medium-gray)',
                        fontSize: '0.95rem'
                      }}>
                        <span>
                          Comunicado <strong>{currentSlide + 1}</strong> de <strong>{comunicados.length}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
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
          onClick={() => handleLinkClick('https://docs.google.com/spreadsheets/d/1OsH2fEAE6-3gwiM3w6Lf6q2U2AO3ngharO1lmLCJVHM/edit?gid=1961082688#gid=1961082688')}
        >
          <div className="feature-icon">{isLoggedIn ? '📈' : '🔒'}</div>
          <h3 style={{ marginBottom: 0 }}>SEPLADE</h3>
        </div>

        <div
          className="feature-card"
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '150px' }}
          onClick={() => handleLinkClick('https://docs.google.com/spreadsheets/d/1sQp7fI2Fhe8qWpz22XR3yXbZRy2-Q774MHmlra0RrM8/edit?gid=1451121733#gid=1451121733')}
        >
          <div className="feature-icon">{isLoggedIn ? '📋' : '🔒'}</div>
          <h3 style={{ marginBottom: 0 }}>MATRIZ DE INDICADORES</h3>
        </div>
      </div>
    </div>
  );
};

export default Home;
