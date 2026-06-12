import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-quill-new/dist/quill.snow.css';
import '../styles/App.css';

// Componente principal PanelComunicadosAdmin
const PanelComunicadosAdmin = ({ admin, onClose }) => {
  const [comunicados, setComunicados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    contenidoHtml: '',
    link_externo: '',
    estado: 'publicado'
  });
  const [editId, setEditId] = useState(null);
  const [expandedComunicado, setExpandedComunicado] = useState(null);

  useEffect(() => {
    fetchComunicadosAdmin();
  }, []);

  const fetchComunicadosAdmin = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://api1.strideutmat.com/api/university/comunicados-admin');
      
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleContentChange = (htmlContent) => {
    setFormData({
      ...formData,
      contenido: htmlContent.replace(/<[^>]*>/g, ''), // Texto plano para búsquedas
      contenidoHtml: htmlContent // HTML formateado
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.contenidoHtml.trim()) {
      toast.error('Título y contenido son requeridos');
      return;
    }

    try {
      const comunicadoData = {
        titulo: formData.titulo,
        contenido: formData.contenidoHtml, // Usar HTML formateado
        link_externo: formData.link_externo,
        estado: formData.estado,
        publicado_por_id: admin.id
      };

      if (editId) {
        // Actualizar comunicado existente
        await axios.put(`https://api1.strideutmat.com/api/university/comunicados/${editId}`, comunicadoData);
        toast.success('Comunicado actualizado exitosamente');
      } else {
        // Crear nuevo comunicado
        await axios.post('https://api1.strideutmat.com/api/university/comunicados', comunicadoData);
        toast.success('Comunicado publicado exitosamente');
      }

      // Limpiar formulario y recargar lista
      resetForm();
      fetchComunicadosAdmin();
      setShowForm(false);
      
    } catch (error) {
      console.error('Error guardando comunicado:', error);
      toast.error(error.response?.data?.error || 'Error al guardar el comunicado');
    }
  };

  const handleEdit = (comunicado) => {
    setFormData({
      titulo: comunicado.titulo,
      contenido: comunicado.contenido.replace(/<[^>]*>/g, ''), // Texto plano
      contenidoHtml: comunicado.contenido, // HTML original
      link_externo: comunicado.link_externo || '',
      estado: comunicado.estado
    });
    setEditId(comunicado.id);
    setShowForm(true);
  };

  const handleDelete = async (id, titulo) => {
    if (!window.confirm(`¿Estás seguro de eliminar el comunicado "${titulo}"?`)) {
      return;
    }

    try {
      await axios.delete(`https://api1.strideutmat.com/api/university/comunicados/${id}`);
      toast.success('Comunicado eliminado exitosamente');
      fetchComunicadosAdmin();
    } catch (error) {
      console.error('Error eliminando comunicado:', error);
      toast.error('Error al eliminar el comunicado');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      contenido: '',
      contenidoHtml: '',
      link_externo: '',
      estado: 'publicado'
    });
    setEditId(null);
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

  const toggleExpand = (id) => {
    if (expandedComunicado === id) {
      setExpandedComunicado(null);
    } else {
      setExpandedComunicado(id);
    }
  };

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'publicado':
        return <span className="badge estado-publicado">✅ Publicado</span>;
      case 'borrador':
        return <span className="badge estado-borrador">📝 Borrador</span>;
      case 'archivado':
        return <span className="badge estado-archivado">📁 Archivado</span>;
      default:
        return <span className="badge">❓ {estado}</span>;
    }
  };

  // Configuración completa de la barra de herramientas estilo Word
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ]
  }), []);

  const quillFormats = [
    'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'header',
    'align',
    'list', 'bullet', 'indent',
    'blockquote', 'code-block',
    'link'
  ];

  return (
    <div className="panel-comunicados-admin">
      <div className="panel-header">
        <div className="header-content">
          <h2>📢 Administración de Comunicados</h2>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? '← Volver a lista' : '+ Nuevo Comunicado'}
          </button>
        </div>
      </div>

      {showForm ? (
        <div className="comunicados-form-container">
          <form onSubmit={handleSubmit} className="comunicados-form">
            <div className="form-header">
              <h3>{editId ? '✏️ Editar Comunicado' : '📝 Nuevo Comunicado'}</h3>
            </div>

            <div className="form-group">
              <label htmlFor="titulo">Título *</label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                placeholder="Título del comunicado"
                required
                maxLength="200"
              />
              <div className="form-hint">Máximo 200 caracteres</div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="contenido">Contenido *</label>
              
              {/* Editor de texto enriquecido con Quill - Estilo Word */}
              <div className="quill-editor-wrapper">
                <ReactQuill
                  theme="snow"
                  value={formData.contenidoHtml}
                  onChange={handleContentChange}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Escribe el contenido del comunicado aquí..."
                  style={{ minHeight: '300px', background: 'white' }}
                />
              </div>
              
              <div className="word-counter" style={{ marginTop: '0.5rem' }}>
                <span style={{ color: 'var(--secondary-blue)' }}>
                  📊 {formData.contenidoHtml.replace(/<[^>]*>/g, '').length} caracteres • {formData.contenidoHtml.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length} palabras
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="link_externo">Enlace relacionado (opcional)</label>
              <input
                type="url"
                id="link_externo"
                name="link_externo"
                value={formData.link_externo}
                onChange={handleInputChange}
                placeholder="https://ejemplo.com"
              />
              <div className="form-hint">Enlace externo relacionado con el comunicado</div>
            </div>

            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
              >
                <option value="publicado">✅ Publicado (visible para todos)</option>
                <option value="borrador">📝 Borrador (solo visible en admin)</option>
                <option value="archivado">📁 Archivado (no visible)</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => { resetForm(); setShowForm(false); }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {editId ? '💾 Actualizar Comunicado' : '📢 Publicar Comunicado'}
              </button>
            </div>

            <div className="form-info">
              <p><strong>💡 Consejos para redactar comunicados:</strong></p>
              <ul>
                <li>Utilice títulos claros y descriptivos</li>
                <li>Use el editor para resaltar información importante</li>
                <li>Incluya fechas y plazos cuando sea necesario</li>
                <li>Verifique los enlaces antes de publicar</li>
                <li>Guarde como borrador antes de publicar</li>
              </ul>
            </div>
          </form>
        </div>
      ) : (
        <div className="comunicados-list-admin">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Cargando comunicados...</p>
            </div>
          ) : comunicados.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">📭</div>
              <h3>No hay comunicados</h3>
              <p>Crea el primer comunicado para empezar.</p>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                + Crear Primer Comunicado
              </button>
            </div>
          ) : (
            <div className="comunicados-container">
              <div className="table-summary">
                <span>
                  <strong>{comunicados.length}</strong> comunicado(s) en total
                </span>
                <span>
                  <strong>{comunicados.filter(c => c.estado === 'publicado').length}</strong> publicados
                </span>
                <span>
                  <strong>{comunicados.filter(c => c.estado === 'borrador').length}</strong> borradores
                </span>
                <span>
                  <strong>{comunicados.filter(c => c.estado === 'archivado').length}</strong> archivados
                </span>
              </div>

              <div className="comunicados-grid-admin">
                {comunicados.map(comunicado => (
                  <div 
                    key={comunicado.id} 
                    className={`comunicado-card-admin ${expandedComunicado === comunicado.id ? 'expanded' : ''}`}
                  >
                    <div 
                      className="comunicado-header-admin" 
                      onClick={() => toggleExpand(comunicado.id)}
                    >
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
                          {getEstadoBadge(comunicado.estado)}
                        </div>
                      </div>
                      <div className="comunicado-toggle-admin">
                        {expandedComunicado === comunicado.id ? '▲' : '▼'}
                      </div>
                    </div>

                    {expandedComunicado === comunicado.id && (
                      <div className="comunicado-content-admin">
                        <div 
                          className="comunicado-contenido-admin ql-editor"
                          lang="es"
                          style={{ padding: 0 }}
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

                        <div className="comunicado-footer-admin">
                          <div className="comunicado-actions-admin">
                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => handleEdit(comunicado)}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              className="btn btn-danger btn-small"
                              onClick={() => handleDelete(comunicado.id, comunicado.titulo)}
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                          <span className="comunicado-id-admin">
                            ID: {comunicado.id}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PanelComunicadosAdmin;