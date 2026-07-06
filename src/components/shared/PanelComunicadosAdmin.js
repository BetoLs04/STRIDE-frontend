import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import api from '../../api';
import { toast } from 'react-toastify';
import 'react-quill-new/dist/quill.snow.css';
import '../../styles/DownloadButton.css';
import '../../styles/PanelComunicadosAdmin.css';
import { handleApiError } from '../../utils/errorHandler';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import FormFileUpload from './FormFileUpload';
import { STATUS, LIMITS } from '../../constants/index';

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
    estado: STATUS.COMUNICADO.PUBLICADO
  });
  const [editId, setEditId] = useState(null);
  const [expandedComunicado, setExpandedComunicado] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    fetchComunicadosAdmin();
  }, []);

  const fetchComunicadosAdmin = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/university/comunicados-admin');
      
      if (response.data.success) {
        setComunicados(response.data.data || []);
      } else {
        toast.error('Error al cargar comunicados');
      }
    } catch (error) {
      handleApiError(error, 'Error al cargar comunicados');
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + archivos.length > 5) {
      toast.error('Máximo 5 archivos');
      return;
    }
    for (const file of files) {
      if (file.size > LIMITS.FILE_SIZE.DOCUMENT) {
        toast.error(`El archivo ${file.name} excede los 10MB`);
        return;
      }
    }
    setArchivos(prev => [...prev, ...files]);
  };

  const removeArchivo = (index) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.contenidoHtml.trim()) {
      toast.error('Título y contenido son requeridos');
      return;
    }

    setSubiendo(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('contenido', formData.contenidoHtml);
      formDataToSend.append('link_externo', formData.link_externo);
      formDataToSend.append('estado', formData.estado);
      formDataToSend.append('publicado_por_id', admin.id);
      archivos.forEach(file => formDataToSend.append('archivos', file));

      if (editId) {
        await api.put(`/api/university/comunicados/${editId}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Comunicado actualizado exitosamente');
      } else {
        await api.post('/api/university/comunicados', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Comunicado publicado exitosamente');
      }

      resetForm();
      fetchComunicadosAdmin();
      setShowForm(false);
      
    } catch (error) {
      handleApiError(error, 'Error al guardar comunicado');
    } finally {
      setSubiendo(false);
    }
  };

  const handleEdit = (comunicado) => {
    setFormData({
      titulo: comunicado.titulo,
      contenido: comunicado.contenido.replace(/<[^>]*>/g, ''),
      contenidoHtml: comunicado.contenido,
      link_externo: comunicado.link_externo || '',
      estado: comunicado.estado
    });
    setEditId(comunicado.id);
    setArchivos([]);
    setShowForm(true);
  };

  const handleDeleteArchivo = async (comunicadoId, archivoId) => {
    if (!window.confirm('¿Eliminar este archivo?')) return;
    try {
      await api.delete(`/api/university/comunicados/${comunicadoId}/archivo/${archivoId}`);
      toast.success('Archivo eliminado');
      fetchComunicadosAdmin();
    } catch (error) {
      handleApiError(error, 'Error al eliminar archivo');
    }
  };

  const handleDelete = async (id, titulo) => {
    if (!window.confirm(`¿Estás seguro de eliminar el comunicado "${titulo}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/university/comunicados/${id}`);
      toast.success('Comunicado eliminado exitosamente');
      fetchComunicadosAdmin();
    } catch (error) {
      handleApiError(error, 'Error al eliminar comunicado');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      contenido: '',
      contenidoHtml: '',
      link_externo: '',
      estado: STATUS.COMUNICADO.PUBLICADO
    });
    setEditId(null);
    setArchivos([]);
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
      handleApiError(error, 'Error al realizar acción');
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
      case STATUS.COMUNICADO.PUBLICADO:
        return <span className="badge estado-publicado">✅ Publicado</span>;
      case STATUS.COMUNICADO.BORRADOR:
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

            <FormInput label="Título *" name="titulo" value={formData.titulo} onChange={handleInputChange} placeholder="Título del comunicado" required maxLength={200} hint="Máximo 200 caracteres" />

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

            <FormInput label="Enlace relacionado (opcional)" name="link_externo" type="url" value={formData.link_externo} onChange={handleInputChange} placeholder="https://ejemplo.com" hint="Enlace externo relacionado con el comunicado" />

            <FormFileUpload label="Archivos adjuntos (opcional, máx. 5)" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.pptx,.zip" multiple onChange={handleFileChange} files={archivos} onRemove={removeArchivo} maxFiles={LIMITS.MAX_FILES} hint="Máx. 10MB c/u" />

            <FormSelect label="Estado" name="estado" value={formData.estado} onChange={handleInputChange}>
              <option value="publicado">✅ Publicado (visible para todos)</option>
              <option value="borrador">📝 Borrador (solo visible en admin)</option>
              <option value="archivado">📁 Archivado (no visible)</option>
            </FormSelect>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => { resetForm(); setShowForm(false); }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={subiendo}>
                {subiendo ? '⏳ Guardando...' : (editId ? '💾 Actualizar Comunicado' : '📢 Publicar Comunicado')}
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
                  <strong>{comunicados.filter(c => c.estado === STATUS.COMUNICADO.PUBLICADO).length}</strong> publicados
                </span>
                <span>
                  <strong>{comunicados.filter(c => c.estado === STATUS.COMUNICADO.BORRADOR).length}</strong> borradores
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
                          className="comunicado-contenido-admin"
                          lang="es"
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
                          <div className="comunicado-archivos" style={{ marginTop: '1rem' }}>
                            <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--primary-blue)' }}>📎 Archivos adjuntos:</strong>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {comunicado.archivos.map(arch => (
                                <div key={arch.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                  <span>{arch.tipo_mime?.startsWith('image/') ? '🖼️' : '📄'}</span>
                                  <a href={arch.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, color: 'var(--primary-blue)', textDecoration: 'none', cursor: 'pointer' }}
                                    title="Abrir archivo">
                                    {arch.nombre_original}
                                  </a>
                                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>({(arch.tamano / 1024).toFixed(1)} KB)</span>
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
                                      background: 'var(--primary-blue)', border: 'none', cursor: 'pointer', width: '32px', height: '32px',
                                      borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      color: '#fff', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
                                      flexShrink: 0
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.4)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(37,99,235,0.3)' }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                      <polyline points="7 10 12 15 17 10"></polyline>
                                      <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteArchivo(comunicado.id, arch.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#ef4444', padding: '2px', flexShrink: 0 }}
                                    title="Eliminar archivo"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              ))}
                            </div>
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