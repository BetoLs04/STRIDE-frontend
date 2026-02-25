import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/PersonalTareas.css';

const API_URL = 'https://api1.strideutmat.com';

const PersonalTareas = ({ user }) => {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('pendientes');
  const [selectedTarea, setSelectedTarea] = useState(null);
  const [editandoRespuesta, setEditandoRespuesta] = useState(null);
  const [showResponderModal, setShowResponderModal] = useState(false);
  const [tareaAResponder, setTareaAResponder] = useState(null);
  const [responderForm, setResponderForm] = useState({ comentarios: '' });
  const [archivos, setArchivos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [stats, setStats] = useState({
    pendientes: 0,
    en_progreso: 0,
    completadas: 0,
    vencidas: 0
  });

  useEffect(() => {
    cargarTareas();
  }, [user.id]);

  const cargarTareas = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/university/tareas/personal/${user.id}`);
      if (response.data.success) {
        setTareas(response.data.data);
        calcularStats(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando tareas:', error);
      toast.error('Error al cargar tus tareas');
    } finally {
      setLoading(false);
    }
  };

  const handleEditarRespuesta = (tarea) => {
    setTareaAResponder(tarea);
    setResponderForm({ comentarios: tarea.asignacion_comentarios || '' });
    setArchivos([]);
    setEditandoRespuesta(true);
    setShowResponderModal(true);
  };

  const calcularStats = (tareasList) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const nuevasStats = { pendientes: 0, en_progreso: 0, completadas: 0, vencidas: 0 };
    tareasList.forEach(t => {
      if (t.asignacion_estado === 'pendiente') {
        nuevasStats.pendientes++;
        const fechaEntrega = new Date(t.fecha_entrega);
        fechaEntrega.setHours(0, 0, 0, 0);
        if (fechaEntrega < hoy) nuevasStats.vencidas++;
      } else if (t.asignacion_estado === 'en_progreso') {
        nuevasStats.en_progreso++;
      } else if (t.asignacion_estado === 'completada') {
        nuevasStats.completadas++;
      }
    });
    setStats(nuevasStats);
  };

  const handleResponderClick = (tarea) => {
    setTareaAResponder(tarea);
    setResponderForm({ comentarios: '' });
    setArchivos([]);
    setShowResponderModal(true);
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

  const handleSubmitResponder = async (e) => {
    e.preventDefault();
    if (!responderForm.comentarios.trim() && archivos.length === 0) {
      toast.error('Debes agregar una descripción o un archivo para responder la tarea');
      return;
    }
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('comentarios', responderForm.comentarios);
      archivos.forEach(file => formData.append('archivos', file));
      const response = await axios.post(
        `${API_URL}/api/university/tareas/completar/${tareaAResponder.asignacion_id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (response.data.success) {
        toast.success('¡Respuesta enviada! Tarea completada 🎉');
        setShowResponderModal(false);
        setTareaAResponder(null);
        cargarTareas();
      }
    } catch (error) {
      console.error('Error enviando respuesta:', error);
      toast.error(error.response?.data?.error || 'Error al enviar la respuesta');
    } finally {
      setSubiendo(false);
    }
  };

  const getDiasRestantes = (fechaEntrega) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const entrega = new Date(fechaEntrega);
    entrega.setHours(0, 0, 0, 0);
    const diffTime = entrega - hoy;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getEstadoClase = (dias, estado) => {
    if (estado === 'completada') return 'completada';
    if (dias < 0) return 'vencida';
    if (dias === 0) return 'hoy';
    if (dias <= 2) return 'urgente';
    if (dias <= 5) return 'proxima';
    return 'normal';
  };

  const tareasFiltradas = tareas.filter(t => {
    if (filtro === 'pendientes') return t.asignacion_estado === 'pendiente' || t.asignacion_estado === 'en_progreso';
    if (filtro === 'completadas') return t.asignacion_estado === 'completada';
    return true;
  });

  const pendientesCount = stats.pendientes + stats.en_progreso;

  return (
    <div className="personal-tareas-container">
      <div className="personal-tareas-header">
        <div className="header-left">
          <h1>
            <span className="header-icon"></span>
            Mis Tareas
          </h1>
          <p className="header-subtitle">Gestiona tus tareas asignadas</p>
        </div>
        <div className="stats-circles">
          <div className="stat-circle pendientes">
            <span className="stat-number">{pendientesCount}</span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat-circle completadas">
            <span className="stat-number">{stats.completadas}</span>
            <span className="stat-label">Completadas</span>
          </div>
          {stats.vencidas > 0 && (
            <div className="stat-circle vencidas">
              <span className="stat-number">{stats.vencidas}</span>
              <span className="stat-label">Vencidas</span>
            </div>
          )}
        </div>
      </div>

      <div className="tareas-filtros">
        <div className="filtro-buttons">
          <button className={`filtro-btn ${filtro === 'pendientes' ? 'active' : ''}`} onClick={() => setFiltro('pendientes')}>
            Pendientes ({pendientesCount})
          </button>
          <button className={`filtro-btn ${filtro === 'completadas' ? 'active' : ''}`} onClick={() => setFiltro('completadas')}>
            Completadas ({stats.completadas})
          </button>
          <button className={`filtro-btn ${filtro === 'todas' ? 'active' : ''}`} onClick={() => setFiltro('todas')}>
            Todas ({tareas.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando tus tareas...</p>
        </div>
      ) : (
        <div className="tareas-lista">
          {tareasFiltradas.length === 0 ? (
            <div className="no-tareas">
              <div className="no-tareas-icon">🎉</div>
              <h3>¡No hay tareas {filtro === 'pendientes' ? 'pendientes' : 'completadas'}!</h3>
              <p>Disfruta mientras tanto</p>
            </div>
          ) : (
            tareasFiltradas.map(tarea => {
              const diasRestantes = getDiasRestantes(tarea.fecha_entrega);
              const estadoClase = getEstadoClase(diasRestantes, tarea.asignacion_estado);
              const puedeResponder = tarea.asignacion_estado !== 'completada';
              return (
                <div key={tarea.id} className={`tarea-item ${estadoClase} ${tarea.asignacion_estado}`}>
                  <div className="tarea-item-header">
                    <div className="tarea-titulo">
                      <h3>{tarea.titulo}</h3>
                      {(tarea.archivos?.length > 0 || tarea.archivos_respuesta?.length > 0) && (
                        <span className="archivos-badge" title="Archivos adjuntos">
                          📎 {tarea.archivos?.length || 0} / {tarea.archivos_respuesta?.length || 0}
                        </span>
                      )}
                    </div>
                    <span className={`estado-badge ${tarea.asignacion_estado}`}>
                      {tarea.asignacion_estado === 'pendiente' && '⏳ Pendiente'}
                      {tarea.asignacion_estado === 'en_progreso' && '🔄 En progreso'}
                      {tarea.asignacion_estado === 'completada' && '✅ Completada'}
                    </span>
                  </div>
                  <p className="tarea-descripcion">{tarea.descripcion || 'Sin descripción'}</p>
                  <div className="tarea-meta">
                    <div className={`fecha-info ${estadoClase}`}>
                      <span className="meta-icon">📅</span>
                      <span>
                        {new Date(tarea.fecha_entrega).toLocaleDateString()}
                        {tarea.asignacion_estado !== 'completada' && (
                          <>
                            {diasRestantes < 0 && ` (Vencida)`}
                            {diasRestantes === 0 && ' (Hoy)'}
                            {diasRestantes > 0 && ` (${diasRestantes} días)`}
                          </>
                        )}
                      </span>
                    </div>
                    <div className="creador-info">
                      <span className="meta-icon"></span>
                      <span>{tarea.creado_por_nombre || 'Sistema'}</span>
                    </div>
                  </div>
                  {tarea.asignacion_estado === 'completada' && tarea.asignacion_comentarios && (
                    <div className="tarea-comentario">
                      <span className="comentario-icon">💬</span>
                      <span>{tarea.asignacion_comentarios}</span>
                    </div>
                  )}
                  {(tarea.archivos?.length > 0 || tarea.archivos_respuesta?.length > 0) && (
                    <div className="tarea-archivos-container">
                      {tarea.archivos?.length > 0 && (
                        <div className="archivos-seccion">
                          <div className="archivos-seccion-header">
                            <span className="archivos-titulo">📎 Adjuntados</span>
                            <span className="archivos-badge">{tarea.archivos.length}</span>
                          </div>
                          <div className="archivos-lista-completa">
                            {tarea.archivos.map(arch => (
                              <a key={arch.id} href={`${API_URL}${arch.url}`} target="_blank" rel="noopener noreferrer" className="archivo-link-completo" title={`Haz clic para descargar ${arch.nombre_original}`}>
                                <span className="archivo-icono">{arch.tipo_mime?.startsWith('image/') ? '🖼️' : '📄'}</span>
                                <span className="archivo-nombre-completo">{arch.nombre_original}</span>
                                <span className="archivo-tamano">{(arch.tamano / 1024).toFixed(1)} KB</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {tarea.archivos_respuesta?.length > 0 && (
                        <div className="archivos-seccion respuesta">
                          <div className="archivos-seccion-header">
                            <span className="archivos-titulo">📤 Enviados</span>
                            <span className="archivos-badge">{tarea.archivos_respuesta.length}</span>
                          </div>
                          <div className="archivos-lista-completa">
                            {tarea.archivos_respuesta.map(arch => (
                              <a key={arch.id} href={`${API_URL}${arch.url}`} target="_blank" rel="noopener noreferrer" className="archivo-link-completo" title={`Haz clic para descargar ${arch.nombre_original}`}>
                                <span className="archivo-icono">{arch.tipo_mime?.startsWith('image/') ? '🖼️' : '📄'}</span>
                                <span className="archivo-nombre-completo">{arch.nombre_original}</span>
                                <span className="archivo-tamano">{(arch.tamano / 1024).toFixed(1)} KB</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {puedeResponder ? (
                    <button className="btn-responder" onClick={() => handleResponderClick(tarea)}>
                      <span className="btn-icon">📝</span>
                      {tarea.asignacion_estado === 'pendiente' ? 'Enviar Respuesta' : 'Actualizar Respuesta'}
                    </button>
                  ) : (
                    <button className="btn-editar-respuesta" onClick={() => handleEditarRespuesta(tarea)} title="Editar respuesta">
                      <span className="btn-icon">✏️</span>
                      Editar Respuesta
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {showResponderModal && tareaAResponder && (
        <div className="modal-overlay" onClick={() => setShowResponderModal(false)}>
          <div className="modal-content responder-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Responder Tarea</h2>
              <button className="modal-close" onClick={() => setShowResponderModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitResponder} className="responder-form">
              <div className="tarea-info-resumen">
                <h3>{tareaAResponder.titulo}</h3>
                <p className="fecha-entrega-resumen">
                  Fecha de entrega: {new Date(tareaAResponder.fecha_entrega).toLocaleDateString()}
                </p>
              </div>
              <div className="form-group">
                <label>Descripción para la tarea <span className="required">*</span></label>
                <textarea
                  value={responderForm.comentarios}
                  onChange={(e) => setResponderForm({ ...responderForm, comentarios: e.target.value })}
                  placeholder="Redacta la información solicitada para completar la tarea."
                  rows="4"
                  required={archivos.length === 0}
                />
                <small className="form-hint">
                  {!responderForm.comentarios.trim() && archivos.length === 0 ? 'ⓘ Debes agregar una descripción o un archivo' : '✓ Todo bien'}
                </small>
              </div>
              <div className="form-group">
                <label>Archivos adjuntos (opcional)</label>
                <div className="file-upload-area">
                  <input type="file" id="archivos-responder" multiple onChange={handleFileChange} className="file-input" />
                  <label htmlFor="archivos-responder" className="file-upload-label">
                    <span className="upload-icon"></span>
                    <span>Seleccionar archivos</span>
                    <span className="upload-hint">Máx. 5 archivos, 10MB c/u</span>
                  </label>
                </div>
                {archivos.length > 0 && (
                  <div className="archivos-preview">
                    {archivos.map((file, index) => (
                      <div key={index} className="archivo-preview-item">
                        <span className="archivo-icon">{file.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                        <span className="archivo-nombre">{file.name}</span>
                        <span className="archivo-tamaño">{(file.size / 1024).toFixed(1)} KB</span>
                        <button type="button" className="archivo-remove" onClick={() => removeArchivo(index)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancelar" onClick={() => setShowResponderModal(false)}>Cancelar</button>
                <button type="submit" className="btn-responder-submit" disabled={subiendo || (!responderForm.comentarios.trim() && archivos.length === 0)}>
                  {subiendo ? 'Enviando...' : '📤 Enviar Respuesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalTareas;
