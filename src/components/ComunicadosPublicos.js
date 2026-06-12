import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ComunicadosPublicos = () => {
  const [comunicados, setComunicados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedComunicado, setExpandedComunicado] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchComunicados();
  }, []);

  // En ComunicadosPublicos.js, actualiza la función fetchComunicados:
const fetchComunicados = async () => {
  try {
    setLoading(true);
    // Usa la ruta sin query string (usa la ruta con parámetro por defecto)
    const response = await axios.get('https://api1.strideutmat.com/api/university/comunicados-recientes/10');
    
    if (response.data.success) {
      setComunicados(response.data.data || []);
    } else {
      toast.error('Error al cargar comunicados');
    }
  } catch (error) {
    console.error('Error cargando comunicados:', error);
    toast.error('Error al cargar los comunicados');
  } finally {
    setLoading(false);
  }
};

  const toggleExpand = (id) => {
    if (expandedComunicado === id) {
      setExpandedComunicado(null);
    } else {
      setExpandedComunicado(id);
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

  const displayedComunicados = showAll ? comunicados : comunicados.slice(0, 3);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <p>Cargando comunicados...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (comunicados.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem', 
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
        margin: '2rem 0'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: '0.5' }}>📢</div>
        <h3 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>No hay comunicados</h3>
        <p>No se han publicado comunicados todavía.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#003366', marginBottom: '0.5rem' }}>📢 Comunicados Oficiales</h2>
        <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>
          Información oficial de la administración universitaria
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {displayedComunicados.map((comunicado) => (
          <div 
            key={comunicado.id} 
            style={{
              background: 'white',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: expandedComunicado === comunicado.id 
                ? '0 5px 20px rgba(0,0,0,0.12)' 
                : '0 3px 10px rgba(0,0,0,0.08)',
              borderLeft: `4px solid ${expandedComunicado === comunicado.id ? '#d4af37' : '#0055a4'}`,
              transition: 'all 0.3s ease'
            }}
          >
            <div 
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                background: '#f8f9fa',
                transition: 'background 0.3s ease'
              }}
              onClick={() => toggleExpand(comunicado.id)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#003366', fontSize: '1.5rem' }}>
                      {comunicado.titulo}
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1rem', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        👤 {comunicado.publicado_por_nombre || 'Administración'}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '1rem', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                    📅 {formatDate(comunicado.fecha_publicacion)}
                  </span>
                </div>
              </div>
              <div style={{
                fontSize: '1.2rem',
                color: '#0055a4',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: 'white',
                marginLeft: '1rem'
              }}>
                {expandedComunicado === comunicado.id ? '▲' : '▼'}
              </div>
            </div>

            {expandedComunicado === comunicado.id && (
              <div style={{
                padding: '1.5rem',
                borderTop: '1px solid #e9ecef',
                animation: 'slideDown 0.3s ease-out'
              }}>
                <div style={{ lineHeight: '1.8', color: '#343a40', marginBottom: '1.5rem', fontSize: '1.1rem', padding: '1rem' }}>
                  {comunicado.contenido.split('\n').map((paragraph, index) => (
                    <p key={index} style={{ marginBottom: '1rem' }}>{paragraph}</p>
                  ))}
                </div>
                
                {comunicado.link_externo && (
                  <div style={{
                    margin: '1.5rem 0',
                    padding: '1rem',
                    background: '#e8f4fd',
                    borderRadius: '8px',
                    borderLeft: '4px solid #0055a4',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <strong>Enlace relacionado: </strong>
                    <a 
                      href={comunicado.link_externo} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        color: '#0055a4',
                        textDecoration: 'none',
                        wordBreak: 'break-all',
                        display: 'inline-block',
                        marginTop: '0.5rem'
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
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
                        padding: '2px'
                      }}
                      title="Copiar enlace"
                    >
                      📋
                    </button>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  marginTop: '1rem',
                  borderTop: '1px dashed #dee2e6',
                  fontSize: '0.9rem'
                }}>
                  <span style={{
                    background: comunicado.estado === 'publicado' ? '#d4edda' : '#fff3cd',
                    color: comunicado.estado === 'publicado' ? '#155724' : '#856404',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '15px',
                    fontWeight: '500'
                  }}>
                    {comunicado.estado === 'publicado' ? '✅ Publicado' : '📝 Borrador'}
                  </span>
                  <span style={{ color: '#6c757d', background: '#f8f9fa', padding: '0.3rem 0.8rem', borderRadius: '15px' }}>
                    ID: {comunicado.id}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {comunicados.length > 3 && (
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          margin: '2rem 0',
          paddingTop: '2rem',
          borderTop: '1px solid #e9ecef'
        }}>
          <button 
            style={{
              padding: '12px 24px',
              border: '2px solid #0055a4',
              background: 'white',
              color: '#0055a4',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => setShowAll(!showAll)}
            onMouseEnter={(e) => {
              e.target.style.background = '#0055a4';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.color = '#0055a4';
            }}
          >
            {showAll ? '👆 Mostrar menos' : '👇 Mostrar todos'}
          </button>
          <button 
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'linear-gradient(135deg, #003366 0%, #0055a4 100%)',
              color: 'white',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={fetchComunicados}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 10px 20px rgba(0, 51, 102, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            🔄 Actualizar
          </button>
        </div>
      )}

      <div style={{ textAlign: 'center', color: '#6c757d', fontSize: '0.9rem', paddingTop: '1rem', borderTop: '1px solid #e9ecef' }}>
        <p>
          <small>
            Estos son los comunicados oficiales publicados por la administración universitaria. 
            Para más información, contacte con la administración.
          </small>
        </p>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ComunicadosPublicos;