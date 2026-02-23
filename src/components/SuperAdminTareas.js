import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/SuperAdminTareas.css';
import DownloadButton from './DownloadButton';

const SuperAdminTareas = ({ admin }) => {
  const [tareas, setTareas] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPersonal, setLoadingPersonal] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tareaAEditar, setTareaAEditar] = useState(null);
  const [selectedTarea, setSelectedTarea] = useState(null);
  const [filtro, setFiltro] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_entrega: ''
  });
  
  const [archivos, setArchivos] = useState([]);
  const [archivosEliminar, setArchivosEliminar] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState({});
  const [filtroPersonal, setFiltroPersonal] = useState('');

  useEffect(() => {
    cargarTareas();
    cargarPersonal();
  }, []);

  const cargarTareas = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://api1.strideutmat.com/api/university/tareas');
      
      if (response.data.success) {
        setTareas(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando tareas:', error);
      toast.error('Error al cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  const cargarPersonal = async () => {
    try {
      setLoadingPersonal(true);
      const response = await axios.get('https://api1.strideutmat.com/api/university/tareas/usuarios-disponibles');
      
      if (response.data.success) {
        setPersonal(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando personal:', error);
      toast.error('Error al cargar el personal');
    } finally {
      setLoadingPersonal(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + archivos.length > 5) {
      toast.error('Máximo 5 archivos por tarea');
      return;
    }
    
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`El archivo ${file.name} excede los 10MB`);
        return;
      }
    }
    
    setArchivos(prev => [...prev, ...files]);
  };

  const removeArchivo = (index) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const removeArchivoExistente = async (archivoId) => {
    if (!window.confirm('¿Eliminar este archivo?')) return;
    
    try {
      await axios.delete(`https://api1.strideutmat.com/api/university/tareas/archivo/${archivoId}`);
      setArchivosEliminar(prev => [...prev, archivoId]);
      toast.success('Archivo eliminado');
    } catch (error) {
      toast.error('Error al eliminar archivo');
    }
  };

  const togglePersonal = (persona) => {
    const key = `personal-${persona.id}`;
    
    setUsuariosSeleccionados(prev => {
      const newState = { ...prev };
      
      if (newState[key]) {
        delete newState[key];
      } else {
        newState[key] = {
          usuario_id: persona.id,
          usuario_tipo: 'personal',
          nombre: persona.nombre,
          cargo: persona.cargo,
          direccion: persona.direccion_nombre
        };
      }
      
      return newState;
    });
  };

  const seleccionarTodos = () => {
    const nuevosSeleccionados = {};
    
    personal.forEach(persona => {
      const key = `personal-${persona.id}`;
      nuevosSeleccionados[key] = {
        usuario_id: persona.id,
        usuario_tipo: 'personal',
        nombre: persona.nombre,
        cargo: persona.cargo,
        direccion: persona.direccion_nombre
      };
    });
    
    setUsuariosSeleccionados(nuevosSeleccionados);
  };

  const limpiarSeleccion = () => {
    setUsuariosSeleccionados({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      toast.error('El título es requerido');
      return;
    }
    
    if (!formData.fecha_entrega) {
      toast.error('La fecha de entrega es requerida');
      return;
    }
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaEntrega = new Date(formData.fecha_entrega);
    
    if (fechaEntrega < hoy) {
      toast.error('La fecha de entrega no puede ser en el pasado');
      return;
    }
    
    if (Object.keys(usuariosSeleccionados).length === 0) {
      toast.error('Debe seleccionar al menos un miembro del personal');
      return;
    }
    
    setSubiendo(true);
    
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('descripcion', formData.descripcion || '');
      formDataToSend.append('fecha_entrega', formData.fecha_entrega);
      formDataToSend.append('creado_por_id', admin.id);
      formDataToSend.append('creado_por_tipo', admin.tipo || 'superadmin');
      
      const asignacionesArray = Object.values(usuariosSeleccionados).map(u => ({
        usuario_id: u.usuario_id,
        usuario_tipo: 'personal'
      }));
      
      formDataToSend.append('asignaciones', JSON.stringify(asignacionesArray));
      
      archivos.forEach(file => {
        formDataToSend.append('archivos', file);
      });
      
      const response = await axios.post(
        'https://api1.strideutmat.com/api/university/tareas',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Tarea creada exitosamente');
        
        setFormData({
          titulo: '',
          descripcion: '',
          fecha_entrega: ''
        });
        setArchivos([]);
        setUsuariosSeleccionados({});
        setShowForm(false);
        
        cargarTareas();
      }
      
    } catch (error) {
      console.error('Error creando tarea:', error);
      toast.error(error.response?.data?.error || 'Error al crear la tarea');
    } finally {
      setSubiendo(false);
    }
  };

  const handleEditClick = (tarea, e) => {
    e.stopPropagation();
    
    setTareaAEditar(tarea);
    setFormData({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion || '',
      fecha_entrega: tarea.fecha_entrega.split('T')[0]
    });
    
    // Cargar asignaciones existentes
    const seleccionados = {};
    tarea.asignaciones?.forEach(asig => {
      const key = `personal-${asig.usuario_id}`;
      seleccionados[key] = {
        usuario_id: asig.usuario_id,
        usuario_tipo: 'personal',
        nombre: asig.usuario_nombre,
        cargo: asig.usuario_cargo,
        direccion: asig.direccion_nombre
      };
    });
    setUsuariosSeleccionados(seleccionados);
    
    setArchivos([]);
    setArchivosEliminar([]);
    setShowEditModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      toast.error('El título es requerido');
      return;
    }
    
    if (!formData.fecha_entrega) {
      toast.error('La fecha de entrega es requerida');
      return;
    }
    
    if (Object.keys(usuariosSeleccionados).length === 0) {
      toast.error('Debe seleccionar al menos un miembro del personal');
      return;
    }
    
    setSubiendo(true);
    
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('descripcion', formData.descripcion || '');
      formDataToSend.append('fecha_entrega', formData.fecha_entrega);
      
      const asignacionesArray = Object.values(usuariosSeleccionados).map(u => ({
        usuario_id: u.usuario_id,
        usuario_tipo: 'personal'
      }));
      
      formDataToSend.append('asignaciones', JSON.stringify(asignacionesArray));
      
      archivos.forEach(file => {
        formDataToSend.append('archivos', file);
      });
      
      const response = await axios.put(
        `https://api1.strideutmat.com/api/university/tareas/${tareaAEditar.id}`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Tarea actualizada exitosamente');
        setShowEditModal(false);
        setTareaAEditar(null);
        cargarTareas();
      }
      
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      toast.error('Error al actualizar la tarea');
    } finally {
      setSubiendo(false);
    }
  };

  const handleDeleteTarea = async (tareaId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('¿Estás seguro de eliminar esta tarea? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const response = await axios.delete(`https://api1.strideutmat.com/api/university/tareas/${tareaId}`);
      
      if (response.data.success) {
        toast.success('Tarea eliminada correctamente');
        cargarTareas();
      }
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      toast.error('Error al eliminar la tarea');
    }
  };

  const verDetalleTarea = (tarea) => {
    setSelectedTarea(tarea);
  };

  const getDiasRestantes = (fechaEntrega) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const entrega = new Date(fechaEntrega);
    entrega.setHours(0, 0, 0, 0);
    const diffTime = entrega - hoy;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getEstadoColor = (dias) => {
    if (dias < 0) return 'vencida';
    if (dias === 0) return 'hoy';
    if (dias <= 3) return 'urgente';
    if (dias <= 7) return 'proxima';
    return 'normal';
  };

  const tareasFiltradas = tareas.filter(tarea => {
    if (filtro === 'activas') return tarea.estado === 'activa';
    if (filtro === 'completadas') {
      const completadas = tarea.asignaciones?.filter(a => a.estado === 'completada').length || 0;
      return completadas === tarea.total_asignaciones;
    }
    if (filtro === 'pendientes') {
      return tarea.asignaciones?.some(a => a.estado === 'pendiente' || a.estado === 'en_progreso');
    }
    return true;
  }).filter(tarea => 
    tarea.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tarea.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const personalFiltrado = personal.filter(p => 
    p.nombre.toLowerCase().includes(filtroPersonal.toLowerCase())
  );

  const totalSeleccionados = Object.keys(usuariosSeleccionados).length;

  return (
    <div className="tareas-container">
      <div className="tareas-header">
        <div className="header-left">
          <h1>
            <span className="header-icon"></span>
            Gestión de Tareas
          </h1>
          <p className="header-subtitle">Crea y asigna tareas al personal</p>
        </div>
        
        <button 
          className="btn-nueva-tarea"
          onClick={() => {
            setFormData({ titulo: '', descripcion: '', fecha_entrega: '' });
            setUsuariosSeleccionados({});
            setArchivos([]);
            setShowForm(true);
          }}
        >
          <span className="btn-icon"></span>
          Nueva Tarea
        </button>
      </div>

      <div className="tareas-filtros">
        <div className="filtro-group">
          <select 
            value={filtro} 
            onChange={(e) => setFiltro(e.target.value)}
            className="filtro-select"
          >
            <option value="todas">Todas las tareas</option>
            <option value="activas">Activas</option>
            <option value="pendientes">Con pendientes</option>
            <option value="completadas">Completadas</option>
          </select>
          
          <div className="search-box">
            <span className="search-icon"></span>
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="stats-badge">
          <span>Total: {tareas.length}</span>
          <span>•</span>
          <span>Activas: {tareas.filter(t => t.estado === 'activa').length}</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando tareas...</p>
        </div>
      ) : (
        <div className="tareas-grid">
          {tareasFiltradas.length === 0 ? (
            <div className="no-tareas">
              <div className="no-tareas-icon">📋</div>
              <h3>No hay tareas</h3>
              <p>Crea tu primera tarea haciendo clic en "Nueva Tarea"</p>
            </div>
          ) : (
            tareasFiltradas.map(tarea => {
              const diasRestantes = getDiasRestantes(tarea.fecha_entrega);
              const estadoClase = getEstadoColor(diasRestantes);
              const progreso = tarea.progreso || 0;
              
              return (
                <div 
                  key={tarea.id} 
                  className={`tarea-card ${estadoClase}`}
                  onClick={() => verDetalleTarea(tarea)}
                >
                  <div className="tarea-card-header">
                    <div className="tarea-titulo">
                      <h3>{tarea.titulo}</h3>
                      {tarea.archivos?.length > 0 && (
                        <span className="archivos-badge" title={`${tarea.archivos.length} archivo(s)`}>
                          📎 {tarea.archivos.length}
                        </span>
                      )}
                    </div>
                    <div className="card-actions">
                      <button 
                        className="btn-editar-tarea"
                        onClick={(e) => handleEditClick(tarea, e)}
                        title="Editar tarea"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-eliminar-tarea"
                        onClick={(e) => handleDeleteTarea(tarea.id, e)}
                        title="Eliminar tarea"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  <p className="tarea-descripcion">
                    {tarea.descripcion?.substring(0, 120)}
                    {tarea.descripcion?.length > 120 ? '...' : ''}
                  </p>
                  
                  <div className="tarea-meta">
                    <div className={`fecha-entrega ${estadoClase}`}>
                      <span className="meta-icon"></span>
                      <span>
                        {new Date(tarea.fecha_entrega).toLocaleDateString()}
                        {diasRestantes < 0 && ` (Vencida)`}
                        {diasRestantes === 0 && ' (Hoy)'}
                        {diasRestantes > 0 && ` (${diasRestantes} días)`}
                      </span>
                    </div>
                    
                    <div className="progreso-info">
                      <span className="asignaciones-count">
                        👥 {tarea.completadas || 0}/{tarea.total_asignaciones || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="progreso-bar">
                    <div 
                      className="progreso-fill"
                      style={{ width: `${progreso}%` }}
                    ></div>
                  </div>
                  
                  <div className="tarea-footer">
                    <span className="creado-por">
                      <span className="footer-icon">👤</span>
                      {tarea.creado_por_nombre || 'Sistema'}
                    </span>
                    
                    <div className="asignaciones-mini">
                      {tarea.asignaciones?.slice(0, 3).map((asig, idx) => (
                        <span 
                          key={idx} 
                          className={`asignacion-mini ${asig.estado}`}
                          title={`${asig.usuario_nombre} - ${asig.estado}`}
                        >
                          {asig.usuario_nombre?.charAt(0)}
                        </span>
                      ))}
                      {tarea.total_asignaciones > 3 && (
                        <span className="asignacion-mini-mas">
                          +{tarea.total_asignaciones - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal de nueva tarea */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content tarea-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Crear Nueva Tarea</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="tarea-form">
              <div className="form-section">
                <h3>Información de la tarea</h3>
                
                <div className="form-group">
                  <label>Título *</label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    placeholder="Ej: Revisar documentación del proyecto"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    placeholder="Describe los detalles de la tarea..."
                    rows="4"
                  />
                </div>
                
                <div className="form-group">
                  <label>Fecha de entrega *</label>
                  <input
                    type="date"
                    name="fecha_entrega"
                    value={formData.fecha_entrega}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Archivos adjuntos (opcional, máx. 5)</label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="archivos"
                      multiple
                      onChange={handleFileChange}
                      className="file-input"
                    />
                    <label htmlFor="archivos" className="file-upload-label">
                      <span className="upload-icon"></span>
                      <span>Seleccionar archivos</span>
                      <span className="upload-hint">Máx. 5 archivos, 10MB c/u</span>
                    </label>
                  </div>
                  
                  {archivos.length > 0 && (
                    <div className="archivos-preview">
                      {archivos.map((file, index) => (
                        <div key={index} className="archivo-preview-item">
                          <span className="archivo-icon">
                            {file.type.startsWith('image/') ? '🖼️' : '📄'}
                          </span>
                          <span className="archivo-nombre">{file.name}</span>
                          <span className="archivo-tamaño">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                          <button
                            type="button"
                            className="archivo-remove"
                            onClick={() => removeArchivo(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-section">
                <div className="seleccion-header">
                  <h3>Asignar a Personal</h3>
                  <div className="seleccion-actions">
                    <button 
                      type="button" 
                      className="btn-small"
                      onClick={seleccionarTodos}
                    >
                      Seleccionar Todos
                    </button>
                    <button 
                      type="button" 
                      className="btn-small"
                      onClick={limpiarSeleccion}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
                
                <div className="seleccion-stats">
                  <span className="stat-badge">Seleccionados: {totalSeleccionados}</span>
                </div>
                
                <div className="filtros-usuarios">
                  <input
                    type="text"
                    placeholder="Buscar personal..."
                    value={filtroPersonal}
                    onChange={(e) => setFiltroPersonal(e.target.value)}
                    className="filtro-usuarios-input"
                  />
                </div>
                
                {loadingPersonal ? (
                  <div className="loading-small">Cargando personal...</div>
                ) : (
                  <div className="usuarios-lista">
                    {personalFiltrado.length === 0 ? (
                      <div className="no-usuarios">
                        No se encontró personal
                      </div>
                    ) : (
                      personalFiltrado.map(persona => {
                        const key = `personal-${persona.id}`;
                        const seleccionado = !!usuariosSeleccionados[key];
                        
                        return (
                          <div 
                            key={key}
                            className={`usuario-item ${seleccionado ? 'seleccionado' : ''}`}
                            onClick={() => togglePersonal(persona)}
                          >
                            <div className="usuario-info">
                              <span className="usuario-nombre">{persona.nombre}</span>
                              <span className="usuario-cargo">
                                {persona.cargo}
                              </span>
                              {persona.direccion_nombre && (
                                <span className="usuario-direccion">
                                  {persona.direccion_nombre}
                                </span>
                              )}
                            </div>
                            {seleccionado && (
                              <span className="check-icon">✓</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancelar"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-crear"
                  disabled={subiendo || loadingPersonal}
                >
                  {subiendo ? 'Creando...' : 'Crear Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && tareaAEditar && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content tarea-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Tarea</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="tarea-form">
              <div className="form-section">
                <h3>Información de la tarea</h3>
                
                <div className="form-group">
                  <label>Título *</label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows="4"
                  />
                </div>
                
                <div className="form-group">
                  <label>Fecha de entrega *</label>
                  <input
                    type="date"
                    name="fecha_entrega"
                    value={formData.fecha_entrega}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Archivos actuales</label>
                  {tareaAEditar.archivos?.filter(a => !archivosEliminar.includes(a.id)).map(arch => (
                    <div key={arch.id} className="archivo-existente">
                      <a href={arch.url} target="_blank" rel="noopener noreferrer">
                        {arch.nombre_original}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeArchivoExistente(arch.id)}
                        className="btn-eliminar-archivo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="form-group">
                  <label>Agregar nuevos archivos</label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="archivos-edit"
                      multiple
                      onChange={handleFileChange}
                      className="file-input"
                    />
                    <label htmlFor="archivos-edit" className="file-upload-label">
                      <span className="upload-icon"></span>
                      <span>Seleccionar archivos</span>
                    </label>
                  </div>
                  
                  {archivos.length > 0 && (
                    <div className="archivos-preview">
                      {archivos.map((file, index) => (
                        <div key={index} className="archivo-preview-item">
                          <span className="archivo-nombre">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeArchivo(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-section">
                <h3>Asignar a Personal</h3>
                <div className="seleccion-stats">
                  <span className="stat-badge">Seleccionados: {totalSeleccionados}</span>
                </div>
                
                <div className="filtros-usuarios">
                  <input
                    type="text"
                    placeholder="Buscar personal..."
                    value={filtroPersonal}
                    onChange={(e) => setFiltroPersonal(e.target.value)}
                  />
                </div>
                
                <div className="usuarios-lista">
                  {personalFiltrado.map(persona => {
                    const key = `personal-${persona.id}`;
                    const seleccionado = !!usuariosSeleccionados[key];
                    
                    return (
                      <div 
                        key={key}
                        className={`usuario-item ${seleccionado ? 'seleccionado' : ''}`}
                        onClick={() => togglePersonal(persona)}
                      >
                        <div className="usuario-info">
                          <span className="usuario-nombre">{persona.nombre}</span>
                          <span className="usuario-cargo">{persona.cargo}</span>
                        </div>
                        {seleccionado && <span className="check-icon">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" disabled={subiendo}>
                  {subiendo ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalle de tarea */}
      {selectedTarea && (
        <div className="modal-overlay" onClick={() => setSelectedTarea(null)}>
          <div className="modal-content detalle-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalle de Tarea</h2>
              <button className="modal-close" onClick={() => setSelectedTarea(null)}>×</button>
            </div>
            
            <div className="detalle-content">
              <div className="detalle-info">
                <h3>{selectedTarea.titulo}</h3>
                
                <div className="detalle-meta">
                  <div className="meta-item">
                    <span className="meta-label"> Fecha de entrega:</span>
                    <span>{new Date(selectedTarea.fecha_entrega).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="meta-item">
                    <span className="meta-label">👤 Creado por:</span>
                    <span>{selectedTarea.creado_por_nombre || 'Sistema'}</span>
                  </div>
                </div>
                
                {selectedTarea.descripcion && (
                  <div className="detalle-descripcion">
                    <h4>Descripción</h4>
                    <p>{selectedTarea.descripcion}</p>
                  </div>
                )}
                
                {selectedTarea.archivos?.length > 0 && (
                  <div className="detalle-archivos">
                    <h4>Archivos de la tarea</h4>
                    <div className="archivos-lista">
                      {selectedTarea.archivos?.map(arch => (
                        <div key={arch.id} className="archivo-item-con-boton">
                          <div className="archivo-info">
                            <span className="archivo-icon">
                              {arch.tipo_mime?.startsWith('image/') ? '🖼️' : '📄'}
                            </span>
                            <span className="archivo-nombre">{arch.nombre_original}</span>
                            <span className="archivo-tamano">
                              ({(arch.tamano / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <DownloadButton 
                            onClick={() => window.open(arch.url, '_blank')}
                            tooltip={`Descargar ${arch.nombre_original}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="detalle-asignaciones">
                  <h4>Respuestas del Personal</h4>
                  
                  {selectedTarea.asignaciones?.filter(a => a.estado === 'completada').length === 0 ? (
                    <p className="sin-respuestas">Aún no hay respuestas</p>
                  ) : (
                    selectedTarea.asignaciones
                      .filter(a => a.estado === 'completada')
                      .map(asig => (
                        <div key={asig.id} className="respuesta-card">
                          <div className="respuesta-header">
                            <div className="respuesta-usuario">
                              <strong>{asig.usuario_nombre}</strong>
                              <span className="respuesta-cargo">{asig.usuario_cargo}</span>
                              {asig.direccion_nombre && (
                                <span className="respuesta-direccion">{asig.direccion_nombre}</span>
                              )}
                            </div>
                            <span className="respuesta-fecha">
                              {new Date(asig.fecha_completado).toLocaleString()}
                            </span>
                          </div>
                          
                          {asig.comentarios && (
                            <div className="respuesta-comentario">
                              <strong>Descripción:</strong>
                              <p>{asig.comentarios}</p>
                            </div>
                          )}
                          
                          {selectedTarea.archivos?.filter(a => a.tarea_id === asig.tarea_id).length > 0 && (
                            <div className="respuesta-archivos">
                              <strong>Archivos adjuntos:</strong>
                              <div className="archivos-lista">
                                {selectedTarea.archivos
                                  .filter(a => a.tarea_id === asig.tarea_id)
                                  .map(arch => (
                                    <a 
                                      key={arch.id}
                                      href={arch.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="archivo-link"
                                      download
                                    >
                                      <span className="archivo-icon">
                                        {arch.tipo_mime?.startsWith('image/') ? '🖼️' : '📄'}
                                      </span>
                                      <span className="archivo-nombre">{arch.nombre_original}</span>
                                      <span className="archivo-tamaño">
                                        ({(arch.tamano / 1024).toFixed(1)} KB)
                                      </span>
                                      <span className="descargar-icon">⬇️</span>
                                    </a>
                                  ))
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn-cerrar" onClick={() => setSelectedTarea(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminTareas;