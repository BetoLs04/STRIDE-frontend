import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Slider from 'react-slick';
import { toast } from 'react-toastify';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import 'react-quill-new/dist/quill.snow.css';
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

  const carouselSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    arrows: false,
    adaptiveHeight: true,
    afterChange: (current) => setCurrentSlide(current)
  };

  useEffect(() => {
    checkSuperAdminExistence();
    fetchComunicadosRecientes();

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
                          className="comunicado-contenido-admin ql-editor"
                          lang="es"
                          style={{
                            padding: 0,
                            fontSize: '0.95rem'
                          }}
                          dangerouslySetInnerHTML={{ __html: comunicado.contenido }}
                        />

                        {comunicado.link_externo && (
                          <div className="comunicado-link-admin">
                            <strong>Enlace relacionado: </strong>
                            <a
                              href={comunicado.link_externo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link-externo-admin"
                            >
                              {comunicado.link_externo}
                            </a>
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
                        ← Anterior
                      </button>
                      <button
                        onClick={goToNext}
                        className="btn btn-primary btn-small"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      >
                        Siguiente →
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
