import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/SepladePage.css';

const API_URL = 'https://api1.strideutmat.com';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const SepladePage = ({ user }) => {
  const { hojaId } = useParams();
  const navigate = useNavigate();
  const esSuperAdmin = user?.tipo === 'superadmin';
  const esDirectivo = user?.tipo === 'directivo';
  const esPersonal = user?.tipo === 'personal';

  const puedeEditarRealizado = (indicador) => {
    if (esSuperAdmin) return true;
    const asignados = usuariosAsignados.filter(u => u.indicador_id === indicador?.id);
    if (esDirectivo && asignados.some(u => u.usuario_id === user.id && u.usuario_tipo === 'directivo')) return true;
    if (esPersonal && asignados.some(u => u.usuario_id === user.id && u.usuario_tipo === 'personal')) return true;
    return false;
  };

  const indicadoresVisibles = useMemo(() => {
    if (esSuperAdmin) return indicadores;
    return indicadores.filter(ind => {
      const asignados = usuariosAsignados.filter(u => u.indicador_id === ind.id);
      return asignados.some(u => u.usuario_id === user.id && u.usuario_tipo === user.tipo);
    });
  }, [indicadores, usuariosAsignados, esSuperAdmin, user]);

  const [hoja, setHoja] = useState(null);
  const [hojas, setHojas] = useState([]);
  const [indicadores, setIndicadores] = useState([]);
  const [valores, setValores] = useState([]);
  const [notas, setNotas] = useState([]);
  const [usuariosAsignados, setUsuariosAsignados] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalValue, setModalValue] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalIndicadorId, setModalIndicadorId] = useState(null);
  const [modalField, setModalField] = useState(null);
  const [modalMes, setModalMes] = useState(null);
  const [modalTipo, setModalTipo] = useState(null);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteModalValue, setNoteModalValue] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteIndicadorId, setNoteIndicadorId] = useState(null);
  const [noteMes, setNoteMes] = useState(null);

  const [asignandoUsuario, setAsignandoUsuario] = useState(false);

  const getValor = (indicadorId, mes, tipo) => {
    const v = valores.find(
      val => val.indicador_id === indicadorId && val.mes === mes && val.tipo === tipo
    );
    return v?.valor || '';
  };

  const getNota = (indicadorId, mes) => {
    const n = notas.find(nt => nt.indicador_id === indicadorId && nt.mes === mes);
    return n?.nota || '';
  };

  const fetchHoja = useCallback(async () => {
    setLoading(true);
    try {
      const [hojaRes, usuariosRes, hojasRes] = await Promise.all([
        axios.get(`${API_URL}/api/university/seplade-hojas/${hojaId}`),
        axios.get(`${API_URL}/api/university/seplade-usuarios`),
        axios.get(`${API_URL}/api/university/seplade-hojas`)
      ]);
      if (hojaRes.data.success && hojaRes.data.data) {
        setHoja(hojaRes.data.data);
        setIndicadores(hojaRes.data.data.indicadores || []);
        setValores(hojaRes.data.data.valores || []);
        setNotas(hojaRes.data.data.notas || []);
        setUsuariosAsignados(hojaRes.data.data.usuarios_asignados || []);
      }
      if (usuariosRes.data.success) {
        setUsuariosDisponibles(usuariosRes.data.data || []);
      }
      if (hojasRes.data.success) {
        setHojas(hojasRes.data.data || []);
      }
    } catch (error) {
      toast.error('Error al cargar hoja SEPLADE');
    } finally {
      setLoading(false);
    }
  }, [hojaId]);

  useEffect(() => {
    fetchHoja();
  }, [fetchHoja]);

  const openModal = (indicadorId, field, mes, tipo, currentValue) => {
    setModalIndicadorId(indicadorId);
    setModalField(field);
    setModalMes(mes);
    setModalTipo(tipo);
    setModalValue(currentValue || '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalIndicadorId(null);
    setModalField(null);
    setModalMes(null);
    setModalTipo(null);
    setModalValue('');
  };

  const handleSaveModal = async () => {
    if (!modalIndicadorId) return;
    setModalSaving(true);
    try {
      if (modalField === 'valor') {
        await axios.put(`${API_URL}/api/university/seplade-valores/${modalIndicadorId}`, {
          mes: modalMes,
          tipo: modalTipo,
          valor: modalValue
        });
        setValores(prev => prev.map(v =>
          v.indicador_id === modalIndicadorId && v.mes === modalMes && v.tipo === modalTipo
            ? { ...v, valor: modalValue }
            : v
        ));
      } else {
        await axios.put(`${API_URL}/api/university/seplade-indicadores/${modalIndicadorId}`, {
          [modalField]: modalValue
        });
        setIndicadores(prev => prev.map(i =>
          i.id === modalIndicadorId ? { ...i, [modalField]: modalValue } : i
        ));
      }
      closeModal();
      toast.success('Celda guardada');
    } catch (error) {
      toast.error('Error al guardar celda');
    } finally {
      setModalSaving(false);
    }
  };

  const openNoteModal = (indicadorId, mes) => {
    setNoteIndicadorId(indicadorId);
    setNoteMes(mes);
    setNoteModalValue(getNota(indicadorId, mes));
    setNoteModalOpen(true);
  };

  const closeNoteModal = () => {
    setNoteModalOpen(false);
    setNoteIndicadorId(null);
    setNoteMes(null);
    setNoteModalValue('');
  };

  const handleSaveNote = async () => {
    if (!noteIndicadorId || !noteMes) return;
    setNoteSaving(true);
    try {
      await axios.put(`${API_URL}/api/university/seplade-notas/${noteIndicadorId}/${noteMes}`, {
        nota: noteModalValue
      });
      setNotas(prev => {
        const existing = prev.findIndex(n => n.indicador_id === noteIndicadorId && n.mes === noteMes);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], nota: noteModalValue };
          return updated;
        }
        return [...prev, { indicador_id: noteIndicadorId, mes: noteMes, nota: noteModalValue }];
      });
      closeNoteModal();
      toast.success('Nota guardada');
    } catch (error) {
      toast.error('Error al guardar nota');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleAddIndicador = async () => {
    setAdding(true);
    try {
      const res = await axios.post(`${API_URL}/api/university/seplade-indicadores`, { hoja_id: parseInt(hojaId) });
      setIndicadores(prev => [...prev, res.data.data]);
      // Add empty values for the new indicator
      const newValores = [];
      for (let mes = 1; mes <= 12; mes++) {
        newValores.push({ indicador_id: res.data.data.id, mes, tipo: 'programado', valor: '' });
        newValores.push({ indicador_id: res.data.data.id, mes, tipo: 'realizado', valor: '' });
      }
      setValores(prev => [...prev, ...newValores]);
      toast.success('Indicador agregado');
    } catch (error) {
      toast.error('Error al agregar indicador');
    } finally {
      setAdding(false);
    }
  };

  const getAsignadosIndicador = (indicadorId) => {
    return usuariosAsignados.filter(u => u.indicador_id === indicadorId);
  };

  const handleAsignarUsuario = async (indicadorId, usuarioId, usuarioTipo) => {
    if (asignandoUsuario) return;
    setAsignandoUsuario(true);
    try {
      await axios.post(`${API_URL}/api/university/seplade-indicadores/${indicadorId}/usuarios`, {
        usuario_id: usuarioId,
        usuario_tipo: usuarioTipo
      });
      const usuario = usuariosDisponibles.find(u => u.id === usuarioId && u.tipo === usuarioTipo);
      setUsuariosAsignados(prev => [...prev, {
        indicador_id: indicadorId,
        usuario_id: usuarioId,
        usuario_tipo: usuarioTipo,
        nombre: usuario?.nombre || '—'
      }]);
      toast.success('Usuario asignado');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al asignar usuario');
    } finally {
      setAsignandoUsuario(false);
    }
  };

  const handleQuitarUsuario = async (indicadorId, usuarioId, usuarioTipo) => {
    try {
      await axios.delete(`${API_URL}/api/university/seplade-indicadores/${indicadorId}/usuarios/${usuarioId}/${usuarioTipo}`);
      setUsuariosAsignados(prev => prev.filter(u =>
        !(u.indicador_id === indicadorId && u.usuario_id === usuarioId && u.usuario_tipo === usuarioTipo)
      ));
      toast.success('Usuario quitado');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al quitar usuario');
    }
  };

  const handleDeleteIndicador = async (indicadorId) => {
    if (!window.confirm('¿Eliminar este indicador?')) return;
    try {
      await axios.delete(`${API_URL}/api/university/seplade-indicadores/${indicadorId}`);
      setIndicadores(prev => prev.filter(i => i.id !== indicadorId));
      setValores(prev => prev.filter(v => v.indicador_id !== indicadorId));
      setNotas(prev => prev.filter(n => n.indicador_id !== indicadorId));
      toast.success('Indicador eliminado');
    } catch (error) {
      toast.error('Error al eliminar indicador');
    }
  };

  const goBack = () => {
    if (esSuperAdmin) navigate('/admin/dashboard', { state: { tab: 'seplade' } });
    else if (esDirectivo) navigate('/directivo/dashboard');
    else if (esPersonal) navigate('/personal/dashboard');
    else navigate('/');
  };

  if (loading) {
    return (
      <div className="seplade-page-container">
        <div className="loading">Cargando SEPLADE...</div>
      </div>
    );
  }

  if (!hoja) {
    return (
      <div className="seplade-page-container">
        <div className="no-data">
          <p>Hoja no encontrada</p>
          <button className="btn btn-secondary" onClick={goBack}>← Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="seplade-page-container">
      <div className="seplade-page-toolbar">
        <button className="btn btn-secondary" onClick={goBack}>← Volver</button>
        {esSuperAdmin && (
          <button className="btn btn-primary" onClick={handleAddIndicador} disabled={adding}>
            {adding ? '...' : '+ Agregar indicador'}
          </button>
        )}
      </div>

      <div className="seplade-page">
        <div className="seplade-header">
          <h1>{hoja.titulo}</h1>
          {hoja.subtitulo && <p>{hoja.subtitulo}</p>}
        </div>

        <table className="seplade-table">
          <thead>
            <tr>
              <th rowSpan="3" style={{ minWidth: '200px' }}>Indicador</th>
              <th rowSpan="3">Nivel</th>
              <th rowSpan="3">Unidad de<br />Medida</th>
              <th rowSpan="3">Meta<br />Anual</th>
              <th rowSpan="3">Programado /<br />Realizado</th>
              {MESES.map((mes, i) => (
                <th key={i} className="month-group" colSpan="1">{mes}</th>
              ))}
              <th rowSpan="3">Encargado</th>
              <th rowSpan="3" style={{ minWidth: '160px' }}>Evidencia Física</th>
              <th rowSpan="3" style={{ minWidth: '160px' }}>Evidencia en línea</th>
              {esSuperAdmin && <th rowSpan="3" style={{ width: '40px' }}>Acc</th>}
            </tr>
          </thead>
          <tbody>
            {indicadoresVisibles.length === 0 ? (
              <tr>
                <td colSpan={20 + (esSuperAdmin ? 1 : 0)} className="td-empty">
                  {esSuperAdmin
                    ? 'Sin indicadores registrados. Haz clic en "+ Agregar indicador"'
                    : 'No tienes indicadores asignados en esta hoja'}
                </td>
              </tr>
            ) : (
              indicadoresVisibles.map(ind => (
                <React.Fragment key={ind.id}>
                  <tr className="row-prog">
                    <td
                      className="col-indicador"
                      rowSpan="2"
                      onClick={() => esSuperAdmin && openModal(ind.id, 'nombre', null, null, ind.nombre)}
                      style={{ cursor: esSuperAdmin ? 'pointer' : 'default' }}
                    >{ind.nombre}</td>
                    <td
                      rowSpan="2"
                      onClick={() => esSuperAdmin && openModal(ind.id, 'nivel', null, null, ind.nivel)}
                      style={{ cursor: esSuperAdmin ? 'pointer' : 'default' }}
                    >{ind.nivel || '—'}</td>
                    <td
                      rowSpan="2"
                      onClick={() => esSuperAdmin && openModal(ind.id, 'unidad_medida', null, null, ind.unidad_medida)}
                      style={{ cursor: esSuperAdmin ? 'pointer' : 'default' }}
                    >{ind.unidad_medida || '—'}</td>
                    <td
                      rowSpan="2"
                      onClick={() => esSuperAdmin && openModal(ind.id, 'meta_anual', null, null, ind.meta_anual)}
                      style={{ cursor: esSuperAdmin ? 'pointer' : 'default' }}
                    >{ind.meta_anual || '—'}</td>
                    <td className="meta-label-prog">Programado</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(mes => {
                      const val = getValor(ind.id, mes, 'programado');
                      const hasVal = val !== '';
                      return (
                        <td
                          key={mes}
                          className={hasVal ? '' : 'cell-empty'}
                          onClick={() => esSuperAdmin && openModal(ind.id, 'valor', mes, 'programado', val)}
                          style={{ cursor: esSuperAdmin ? 'pointer' : 'default' }}
                        >{val || ''}</td>
                      );
                    })}
                    <td
                      rowSpan="2"
                      onClick={() => esSuperAdmin && openModal(ind.id, 'encargado', null, null, ind.encargado)}
                      style={{ cursor: esSuperAdmin ? 'pointer' : 'default', textAlign: 'left' }}
                    >
                      {(() => {
                        const asignados = getAsignadosIndicador(ind.id);
                        return asignados.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {asignados.map(a => (
                              <span key={`${a.usuario_id}-${a.usuario_tipo}`} className={`encargado-badge ${a.usuario_tipo === 'directivo' ? 'badge-directivos' : 'badge-personal'}`}>
                                {a.nombre}
                              </span>
                            ))}
                          </div>
                        ) : '—';
                      })()}
                    </td>
                    <td
                      rowSpan="2"
                      className="col-evidencia col-evidence-green"
                      onClick={() => puedeEditarRealizado(ind) && openModal(ind.id, 'evidencia_fisica', null, null, ind.evidencia_fisica)}
                      style={{ cursor: puedeEditarRealizado(ind) ? 'pointer' : 'default' }}
                    >{ind.evidencia_fisica || '—'}</td>
                    <td
                      rowSpan="2"
                      className="col-online col-evidence-green"
                      onClick={() => puedeEditarRealizado(ind) && openModal(ind.id, 'evidencia_online', null, null, ind.evidencia_online)}
                      style={{ cursor: puedeEditarRealizado(ind) ? 'pointer' : 'default' }}
                    >{ind.evidencia_online || '—'}</td>
                    {esSuperAdmin && (
                      <td rowSpan="2">
                        <button className="btn btn-danger btn-small" onClick={() => handleDeleteIndicador(ind.id)}>🗑️</button>
                      </td>
                    )}
                  </tr>
                  <tr className="row-real">
                    <td className="meta-label-real">Realizado</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(mes => {
                      const val = getValor(ind.id, mes, 'realizado');
                      const progVal = getValor(ind.id, mes, 'programado');
                      const progHasVal = progVal !== '';
                      const puedeEditar = puedeEditarRealizado(ind);
                      return (
                        <td
                          key={mes}
                          className={progHasVal ? 'fill-green' : 'fill-red'}
                          onClick={() => puedeEditar && openModal(ind.id, 'valor', mes, 'realizado', val)}
                          style={{
                            cursor: puedeEditar ? 'pointer' : 'default',
                            position: 'relative',
                            opacity: puedeEditar ? 1 : 0.7
                          }}
                          data-nota={getNota(ind.id, mes) || ''}
                        >
                          {val || ''}
                          {getNota(ind.id, mes) && <span className="note-indicator" />}
                          <button
                            className="note-btn"
                            title="Agregar nota"
                            onClick={e => { e.stopPropagation(); puedeEditar && openNoteModal(ind.id, mes); }}
                            disabled={!puedeEditar}
                            style={{ opacity: puedeEditar ? 0.5 : 0.2 }}
                          >📝</button>
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>

        <div className="seplade-symbology">
          <strong>Simbología:</strong>
          <div className="sym-box">
            <div className="sym-color" style={{ background: '#d5f5e3' }}></div>
            <span>Espacios a llenar</span>
          </div>
          <div className="sym-box">
            <div className="sym-color" style={{ background: '#fadbd8' }}></div>
            <span>Se hicieron antes o después del plazo. Se debe de justificar la razón.</span>
          </div>
        </div>

        {hojas.length > 1 && (
          <div className="seplade-hojas-nav">
            <div className="seplade-hojas-nav-list">
              {hojas.map(h => (
                <button
                  key={h.id}
                  className={`seplade-hojas-nav-btn ${parseInt(hojaId) === h.id ? 'active' : ''}`}
                  title={h.titulo}
                  onClick={() => {
                    const path = window.location.pathname.split('/');
                    path[path.length - 1] = h.id;
                    navigate(path.join('/'));
                  }}
                >
                  {h.nombre || h.titulo}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="cell-modal-overlay" onClick={closeModal}>
          <div className="cell-modal" onClick={e => e.stopPropagation()}>
            <div className="cell-modal-header">
              <h3>{modalField === 'encargado' ? 'Asignar encargados' : 'Editar celda'}</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="cell-modal-body">
              {modalField === 'valor' ? (
                <input
                  className="cell-modal-input"
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9.]*"
                  value={modalValue}
                  onChange={e => setModalValue(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                  autoFocus
                />
              ) : modalField === 'encargado' ? (
                <div className="asignar-encargados">
                  <p className="asignar-subtitle">Usuarios que pueden editar las celdas de Realizado:</p>
                  <div className="asignar-lista">
                    {getAsignadosIndicador(modalIndicadorId).length === 0 ? (
                      <p className="asignar-vacio">Ningún usuario asignado aún</p>
                    ) : (
                      getAsignadosIndicador(modalIndicadorId).map(asignado => (
                        <div key={`${asignado.usuario_id}-${asignado.usuario_tipo}`} className="asignar-item">
                          <span className={`asignar-tag ${asignado.usuario_tipo === 'directivo' ? 'tag-directivo' : 'tag-personal'}`}>
                            {asignado.usuario_tipo === 'directivo' ? '👔' : '📝'}
                          </span>
                          <span className="asignar-nombre">{asignado.nombre || '—'}</span>
                          <button
                            className="asignar-quitar"
                            title="Quitar usuario"
                            onClick={() => handleQuitarUsuario(modalIndicadorId, asignado.usuario_id, asignado.usuario_tipo)}
                          >✕</button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="asignar-agregar">
                    <h4>Agregar Directivo</h4>
                    <select
                      className="cell-modal-select"
                      value=""
                      onChange={e => {
                        if (e.target.value) {
                          handleAsignarUsuario(modalIndicadorId, parseInt(e.target.value), 'directivo');
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">Seleccionar directivo...</option>
                      {usuariosDisponibles
                        .filter(u => u.tipo === 'directivo')
                        .filter(u => !getAsignadosIndicador(modalIndicadorId).some(a => a.usuario_id === u.id && a.usuario_tipo === 'directivo'))
                        .map(u => (
                          <option key={`d-${u.id}`} value={u.id}>{u.nombre}</option>
                        ))
                      }
                    </select>
                  </div>
                  <div className="asignar-agregar">
                    <h4>Agregar Personal BD</h4>
                    <select
                      className="cell-modal-select"
                      value=""
                      onChange={e => {
                        if (e.target.value) {
                          handleAsignarUsuario(modalIndicadorId, parseInt(e.target.value), 'personal');
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">Seleccionar personal...</option>
                      {usuariosDisponibles
                        .filter(u => u.tipo === 'personal')
                        .filter(u => !getAsignadosIndicador(modalIndicadorId).some(a => a.usuario_id === u.id && a.usuario_tipo === 'personal'))
                        .map(u => (
                          <option key={`p-${u.id}`} value={u.id}>{u.nombre}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>
              ) : (
                <textarea
                  className="cell-modal-textarea"
                  value={modalValue}
                  onChange={e => setModalValue(e.target.value)}
                  autoFocus
                />
              )}
            </div>
            <div className="cell-modal-footer">
              {modalField === 'encargado' ? (
                <button className="btn btn-secondary" onClick={closeModal}>Cerrar</button>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleSaveModal} disabled={modalSaving}>
                    {modalSaving ? 'Guardando...' : '💾 Guardar'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {noteModalOpen && (
        <div className="cell-modal-overlay" onClick={closeNoteModal}>
          <div className="cell-modal" onClick={e => e.stopPropagation()}>
            <div className="cell-modal-header">
              <h3>Nota - {MESES[noteMes - 1]}</h3>
              <button className="close-btn" onClick={closeNoteModal}>×</button>
            </div>
            <div className="cell-modal-body">
              <textarea
                className="cell-modal-textarea"
                value={noteModalValue}
                onChange={e => setNoteModalValue(e.target.value)}
                autoFocus
                placeholder="Escribe una nota o justificación..."
              />
            </div>
            <div className="cell-modal-footer">
              <button className="btn btn-secondary" onClick={closeNoteModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveNote} disabled={noteSaving}>
                {noteSaving ? 'Guardando...' : '💾 Guardar nota'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SepladePage;
