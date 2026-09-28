import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api';
import { toast } from 'react-toastify';
import '../../styles/SuperAdminEstadisticosGenero.css';
import FormInput from '../shared/FormInput';
import { handleApiError } from '../../utils/errorHandler';
import useSocketEvent from '../../hooks/useSocketEvent';
import { getUserColor } from '../../utils/userColors';

const COLUMNAS_FIJAS = [
  { key: 'programa', label: 'Programa', tipo: 'texto' },
  { key: 'grupos', label: 'Grupos', tipo: 'numero' },
  { key: 'cant_total', label: 'Cantidad Total', tipo: 'numero', readOnly: true },
  { key: 'cant_hombres', label: 'Cantidad Hombres', tipo: 'numero' },
  { key: 'cant_mujeres', label: 'Cantidad Mujeres', tipo: 'numero' },
  { key: 'aprov_hombres', label: 'Aprovechamiento Hombres', tipo: 'decimal' },
  { key: 'aprov_mujeres', label: 'Aprovechamiento Mujeres', tipo: 'decimal' },
  { key: 'aprov_total', label: 'Aprovechamiento Total', tipo: 'decimal', readOnly: true }
];

const parseNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

const round2 = (v) => { const n = parseFloat(v); return isNaN(n) ? v : n.toFixed(2); };

const computeTotals = (valores) => {
  const next = { ...valores };
  const h = parseNum(next.cant_hombres);
  const m = parseNum(next.cant_mujeres);
  next.cant_total = String(h + m);
  const ah = parseNum(next.aprov_hombres);
  const am = parseNum(next.aprov_mujeres);
  next.aprov_total = (ah + am) > 0 ? ((ah + am) / 2).toFixed(2) : '';
  return next;
};

const computeTotalesGenerales = (filas, getValorFn) => {
  const total = { programa: 'Total', grupos: 0, cant_total: 0, cant_hombres: 0, cant_mujeres: 0, aprov_hombres: [], aprov_mujeres: [], aprov_total: [] };
  for (const f of filas) {
    total.grupos += parseNum(getValorFn(f, 'grupos'));
    total.cant_total += parseNum(getValorFn(f, 'cant_total'));
    total.cant_hombres += parseNum(getValorFn(f, 'cant_hombres'));
    total.cant_mujeres += parseNum(getValorFn(f, 'cant_mujeres'));
    const ah = parseNum(getValorFn(f, 'aprov_hombres'));
    const am = parseNum(getValorFn(f, 'aprov_mujeres'));
    const at = parseNum(getValorFn(f, 'aprov_total'));
    if (ah > 0) total.aprov_hombres.push(ah);
    if (am > 0) total.aprov_mujeres.push(am);
    if (at > 0) total.aprov_total.push(at);
  }
  const avg = (arr) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : '';
  return {
    grupos: String(total.grupos),
    cant_total: String(total.cant_total),
    cant_hombres: String(total.cant_hombres),
    cant_mujeres: String(total.cant_mujeres),
    aprov_hombres: avg(total.aprov_hombres),
    aprov_mujeres: avg(total.aprov_mujeres),
    aprov_total: avg(total.aprov_total)
  };
};

const SuperAdminEstadisticosGenero = ({ onClose }) => {
  const [hojas, setHojas] = useState([]);
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [selectedAnio, setSelectedAnio] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showFormHoja, setShowFormHoja] = useState(false);
  const [editHojaId, setEditHojaId] = useState(null);
  const [formCuatrimestre, setFormCuatrimestre] = useState('');
  const [formAnio, setFormAnio] = useState('');
  const [savingHoja, setSavingHoja] = useState(false);

  const [selectedHoja, setSelectedHoja] = useState(null);

  const [filas, setFilas] = useState([]);
  const [filasLoading, setFilasLoading] = useState(false);

  const [usuariosAsignados, setUsuariosAsignados] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [showAsignarUsuarios, setShowAsignarUsuarios] = useState(false);
  const [selectedAsignar, setSelectedAsignar] = useState(new Set());
  const [usuariosLoading, setUsuariosLoading] = useState(false);

  // Asignación por fila
  const [showModalFilaUsuarios, setShowModalFilaUsuarios] = useState(false);
  const [selectedFilaForUsuarios, setSelectedFilaForUsuarios] = useState(null);
  const [filaUsuarios, setFilaUsuarios] = useState([]);
  const [selectedFilaAsignar, setSelectedFilaAsignar] = useState(new Set());
  const [savingFilaUsuarios, setSavingFilaUsuarios] = useState(false);

  const [editingCelda, setEditingCelda] = useState(null);
  const [editValue, setEditValue] = useState('');

  const inputRef = useRef(null);

  useEffect(() => {
    fetchAnios();
    fetchHojas();
    fetchUsuariosGlobal();
  }, []);

  const refreshRef = useRef();
  useSocketEvent('estadisticos-genero:updated', () => refreshRef.current && refreshRef.current());

  const fetchAnios = async () => {
    try {
      const res = await api.get('/api/university/estadisticos-genero-hojas-anios');
      setAniosDisponibles(res.data.data || []);
    } catch (e) { console.warn('Error al cargar años:', e.message); }
  };

  const fetchHojas = async (anio) => {
    setLoading(true);
    try {
      const params = anio ? `?anio=${encodeURIComponent(anio)}` : '';
      const res = await api.get(`/api/university/estadisticos-genero-hojas${params}`);
      setHojas(res.data.data || []);
    } catch (error) {
      handleApiError(error, 'Error al cargar hojas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshRef.current = () => { fetchHojas(selectedAnio); fetchAnios(); fetchUsuariosGlobal(); };
  });

  const fetchUsuariosGlobal = async () => {
    setUsuariosLoading(true);
    try {
      const [asigRes, dispRes] = await Promise.all([
        api.get('/api/university/estadisticos-genero-usuarios'),
        api.get('/api/university/estadisticos-genero-usuarios-disponibles')
      ]);
      setUsuariosAsignados(asigRes.data.data || []);
      setUsuariosDisponibles(dispRes.data.data || []);
    } catch (error) {
      handleApiError(error, 'Error al cargar usuarios');
    } finally {
      setUsuariosLoading(false);
    }
  };

  const handleSelectAnio = (anio) => {
    setSelectedAnio(anio);
    setSelectedHoja(null);
    fetchHojas(anio);
  };

  const handleOpenNewHoja = () => {
    setEditHojaId(null);
    setFormCuatrimestre('');
    setFormAnio(selectedAnio || '');
    setShowFormHoja(true);
  };

  const handleOpenEditHoja = (hoja) => {
    setEditHojaId(hoja.id);
    setFormCuatrimestre(hoja.cuatrimestre || '');
    setFormAnio(hoja.anio || '');
    setShowFormHoja(true);
  };

  const handleSaveHoja = async (e) => {
    e.preventDefault();
    setSavingHoja(true);
    try {
      if (editHojaId) {
        await api.put(`/api/university/estadisticos-genero-hojas/${editHojaId}`, {
          cuatrimestre: formCuatrimestre.trim(),
          anio: formAnio.trim()
        });
        toast.success('Hoja actualizada');
      } else {
        await api.post('/api/university/estadisticos-genero-hojas', {
          cuatrimestre: formCuatrimestre.trim(),
          anio: formAnio.trim()
        });
        toast.success('Hoja creada');
      }
      setShowFormHoja(false);
      setEditHojaId(null);
      fetchHojas(selectedAnio);
      fetchAnios();
    } catch (error) {
      handleApiError(error, 'Error al guardar hoja');
    } finally {
      setSavingHoja(false);
    }
  };

  const handleDeleteHoja = async (hoja) => {
    const nombre = [hoja.cuatrimestre, hoja.anio].filter(Boolean).join(' - ') || 'Sin nombre';
    if (!window.confirm(`¿Eliminar la hoja "${nombre}"?\nTambién se eliminarán sus filas.`)) return;
    try {
      await api.delete(`/api/university/estadisticos-genero-hojas/${hoja.id}`);
      toast.success('Hoja eliminada');
      if (selectedHoja?.id === hoja.id) setSelectedHoja(null);
      fetchHojas(selectedAnio);
      fetchAnios();
    } catch (error) {
      handleApiError(error, 'Error al eliminar hoja');
    }
  };

  const handleSelectHoja = (hoja) => {
    setSelectedHoja(hoja);
    fetchFilas(hoja.id);
    fetchHojas(selectedAnio);
  };

  const fetchFilas = async (hojaId) => {
    setFilasLoading(true);
    try {
      const res = await api.get(`/api/university/estadisticos-genero-filas?hoja_id=${hojaId}`);
      setFilas(res.data.data || []);
    } catch (error) {
      handleApiError(error, 'Error al cargar filas');
    } finally {
      setFilasLoading(false);
    }
  };

  const toggleAsignarUsuario = (usuario) => {
    const key = `${usuario.id}_${usuario.tipo}`;
    setSelectedAsignar(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleConfirmarAsignacion = async () => {
    if (selectedAsignar.size === 0) { toast.error('Selecciona al menos un usuario'); return; }
    try {
      for (const key of selectedAsignar) {
        const [id, tipo] = key.split('_');
        await api.post('/api/university/estadisticos-genero-usuarios', {
          usuario_id: parseInt(id), usuario_tipo: tipo
        });
      }
      toast.success(`${selectedAsignar.size} usuario(s) asignado(s)`);
      setShowAsignarUsuarios(false);
      setSelectedAsignar(new Set());
      fetchUsuariosGlobal();
    } catch (error) {
      handleApiError(error, 'Error al asignar usuarios');
    }
  };

  const handleQuitarUsuario = async (asignacion) => {
    if (!window.confirm('¿Quitar este usuario?')) return;
    try {
      await api.delete(`/api/university/estadisticos-genero-usuarios/${asignacion.asignacion_id}`);
      toast.success('Usuario quitado');
      fetchUsuariosGlobal();
    } catch (error) {
      handleApiError(error, 'Error al quitar usuario');
    }
  };

  const getUsuariosDisponibles = () => {
    const asignadosKey = new Set(usuariosAsignados.map(u => `${u.usuario_id}_${u.usuario_tipo}`));
    return usuariosDisponibles.filter(u => !asignadosKey.has(`${u.id}_${u.tipo}`));
  };

  // --- Handlers de asignación por fila ---
  const handleOpenAsignarFila = (fila) => {
    setSelectedFilaForUsuarios(fila);
    setFilaUsuarios(fila.usuarios || []);
    setSelectedFilaAsignar(new Set());
    if (!usuariosDisponibles || usuariosDisponibles.length === 0) {
      fetchUsuariosGlobal();
    }
    setShowModalFilaUsuarios(true);
  };

  const toggleFilaAsignarUsuario = (usuario) => {
    const key = `${usuario.id}_${usuario.tipo}`;
    setSelectedFilaAsignar(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleConfirmarFilaAsignacion = async () => {
    if (selectedFilaAsignar.size === 0) { toast.error('Selecciona al menos un usuario'); return; }
    setSavingFilaUsuarios(true);
    try {
      for (const key of selectedFilaAsignar) {
        const [id, tipo] = key.split('_');
        await api.post('/api/university/estadisticos-genero-fila-usuarios', {
          fila_id: selectedFilaForUsuarios.id,
          usuario_id: parseInt(id),
          usuario_tipo: tipo
        });
      }
      toast.success(`${selectedFilaAsignar.size} usuario(s) asignado(s) a la fila`);
      setShowModalFilaUsuarios(false);
      setSelectedFilaAsignar(new Set());
      if (selectedHoja) fetchFilas(selectedHoja.id);
    } catch (error) {
      handleApiError(error, 'Error al asignar usuario a la fila');
    } finally {
      setSavingFilaUsuarios(false);
    }
  };

  const handleQuitarUsuarioFila = async (asignacion) => {
    if (!window.confirm(`¿Quitar a "${asignacion.nombre}" de esta fila?`)) return;
    try {
      await api.delete(`/api/university/estadisticos-genero-fila-usuarios/${asignacion.asignacion_id}`);
      toast.success('Usuario quitado de la fila');
      setFilaUsuarios(prev => prev.filter(u => u.asignacion_id !== asignacion.asignacion_id));
      if (selectedHoja) fetchFilas(selectedHoja.id);
    } catch (error) {
      handleApiError(error, 'Error al quitar usuario de la fila');
    }
  };

  const getUsuariosDisponiblesFila = () => {
    const asignadosKey = new Set((filaUsuarios || []).map(u => `${u.usuario_id}_${u.usuario_tipo}`));
    return usuariosDisponibles.filter(u => !asignadosKey.has(`${u.id}_${u.tipo}`));
  };

  const getValor = (fila, key) => {
    try {
      const valores = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
      return valores[key] ?? '';
    } catch {
      return '';
    }
  };

  const startEditCelda = (fila, key, currentValue) => {
    setEditingCelda({ filaId: fila.id, key });
    setEditValue(currentValue);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const CAMPOS_DECIMALES = new Set(['aprov_hombres', 'aprov_mujeres', 'aprov_total']);

  const saveCelda = useCallback(async () => {
    if (!editingCelda) return;
    const { filaId, key } = editingCelda;
    try {
      const valorFinal = CAMPOS_DECIMALES.has(key) ? round2(editValue) : editValue;
      await api.patch(`/api/university/estadisticos-genero-filas/${filaId}/celda`, { key, value: valorFinal });
      setFilas(prev => prev.map(f => {
        if (f.id !== filaId) return f;
        const valores = typeof f.valores === 'string' ? JSON.parse(f.valores) : (f.valores || {});
        valores[key] = valorFinal;
        const h = parseFloat(valores.cant_hombres) || 0;
        const m = parseFloat(valores.cant_mujeres) || 0;
        valores.cant_total = String(h + m);
        const ah = parseFloat(valores.aprov_hombres) || 0;
        const am = parseFloat(valores.aprov_mujeres) || 0;
        valores.aprov_total = (ah + am) > 0 ? ((ah + am) / 2).toFixed(2) : '';
        return { ...f, valores };
      }));
    } catch (error) {
      handleApiError(error, 'Error al guardar celda');
    }
    setEditingCelda(null);
    setEditValue('');
  }, [editingCelda, editValue, filas]);

  const handleCeldaKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveCelda(); }
    if (e.key === 'Escape') { setEditingCelda(null); setEditValue(''); }
    if (e.key === 'Tab') { e.preventDefault(); saveCelda(); }
  };

  const handleAddFila = async () => {
    if (!selectedHoja) return;
    try {
      const initial = computeTotals({});
      COLUMNAS_FIJAS.forEach(c => { if (!(c.key in initial)) initial[c.key] = ''; });
      const res = await api.post('/api/university/estadisticos-genero-filas', {
        valores: initial,
        hoja_id: selectedHoja.id
      });
      setFilas(prev => [...prev, res.data.data]);
      toast.success('Fila agregada');
    } catch (error) {
      handleApiError(error, 'Error al agregar fila');
    }
  };

  const handleDeleteFila = async (fila) => {
    const nombre = getValor(fila, 'programa') || `Fila #${fila.id}`;
    if (!window.confirm(`¿Eliminar la fila "${nombre}"?`)) return;
    try {
      await api.delete(`/api/university/estadisticos-genero-filas/${fila.id}`);
      setFilas(prev => prev.filter(f => f.id !== fila.id));
      toast.success('Fila eliminada');
    } catch (error) {
      handleApiError(error, 'Error al eliminar fila');
    }
  };

  const nombreHoja = (hoja) => [hoja.cuatrimestre, hoja.anio].filter(Boolean).join(' - ');

  if (selectedHoja) {
    return (
      <><div className="tab-content estadisticos-genero">
        <div className="tab-header">
          <div>
            <h2>Información Estadística de Aprovechamiento Académico</h2>
            <p className="text-muted" style={{ margin: 0 }}>{nombreHoja(selectedHoja)}</p>
          </div>
          <div className="tab-actions">
            <button className="btn btn-secondary" onClick={() => setSelectedHoja(null)}>← Volver</button>
          </div>
        </div>

        <div className="eg-hoja-view">
          <div className="eg-vista-previa">
            <h3 style={{ textAlign: 'center', margin: 0 }}>Información Estadística de Aprovechamiento Académico</h3>
            <p style={{ textAlign: 'center', color: '#6b7280', margin: '0.25rem 0 1rem' }}>{nombreHoja(selectedHoja)}</p>
            {filasLoading ? (
              <div className="loading" style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="eg-preview-table">
                  <thead>
                    <tr>
                      <th className="th-accion" rowSpan="2"></th>
                      <th className="th-blue" rowSpan="2">Programa</th>
                      <th className="th-blue" rowSpan="2" style={{ width: '90px', minWidth: '85px', maxWidth: '95px' }}>Responsables</th>
                      <th className="th-blue" rowSpan="2">Grupos</th>
                      <th className="th-orange" colSpan="3">Cantidad</th>
                      <th className="th-green" colSpan="3">Aprovechamiento</th>
                    </tr>
                    <tr>
                      <th className="th-orange">Total</th>
                      <th className="th-orange">Hombres</th>
                      <th className="th-orange">Mujeres</th>
                      <th className="th-green">Hombres</th>
                      <th className="th-green">Mujeres</th>
                      <th className="th-green">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.length === 0 ? (
                      <tr>
                        <td colSpan={COLUMNAS_FIJAS.length + 2} style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                          Sin filas aún
                        </td>
                      </tr>
                    ) : filas.map((fila, index) => (
                      <tr key={fila.id}>
                        <td className="td-accion">
                          <button className="btn btn-danger btn-small" onClick={() => handleDeleteFila(fila)} title="Eliminar fila">×</button>
                        </td>
                        {/* Programa */}
                        <td
                          className="editable-cell"
                          onClick={() => !editingCelda && startEditCelda(fila, 'programa', getValor(fila, 'programa'))}
                        >
                          {editingCelda?.filaId === fila.id && editingCelda?.key === 'programa' ? (
                            <input
                              ref={inputRef}
                              type="text"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={saveCelda}
                              onKeyDown={handleCeldaKeyDown}
                              className="celda-input"
                            />
                          ) : (
                            <span className="celda-valor" style={{ fontWeight: 600 }}>{getValor(fila, 'programa')}</span>
                          )}
                        </td>
                        {/* Responsable(s) asignados */}
                        <td className="td-responsable" style={{ padding: '0.35rem 0.4rem', textAlign: 'center', width: '90px', maxWidth: '95px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center' }}>
                              {fila.usuarios && fila.usuarios.length > 0 ? (
                                fila.usuarios.map(u => {
                                  const cStyle = getUserColor(u.nombre || u.usuario_id);
                                  return (
                                    <span
                                      key={u.asignacion_id}
                                      className="eg-user-badge"
                                      style={{
                                        backgroundColor: cStyle.bg,
                                        color: cStyle.text,
                                        borderColor: cStyle.border
                                      }}
                                      title={`${u.nombre} (${u.usuario_tipo === 'directivo' ? 'Directivo' : 'Personal'})`}
                                    >
                                      <span className="eg-user-dot" style={{ backgroundColor: cStyle.dot }}></span>
                                      <span className="eg-user-name">{u.nombre}</span>
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="eg-user-badge eg-badge-unassigned">⚠️ Sin asignar</span>
                              )}
                            </div>
                            <button
                              type="button"
                              className="btn-asignar-fila"
                              onClick={() => handleOpenAsignarFila(fila)}
                              title="Asignar o cambiar personal que puede llenar esta fila"
                            >
                              👥 Asignar
                            </button>
                          </div>
                        </td>
                        {/* Demás columnas */}
                        {COLUMNAS_FIJAS.filter(col => col.key !== 'programa').map(col => {
                          const cellKey = `${fila.id}_${col.key}`;
                          const isEditing = editingCelda?.filaId === fila.id && editingCelda?.key === col.key;
                          const val = getValor(fila, col.key);
                          if (col.readOnly) {
                            return (
                              <td key={cellKey} className="celda-readonly">
                                <span className="celda-valor">{val}</span>
                              </td>
                            );
                          }
                          return (
                            <td
                              key={cellKey}
                              className="editable-cell"
                              onClick={() => !isEditing && startEditCelda(fila, col.key, val)}
                            >
                              {isEditing ? (
                                <input
                                  ref={inputRef}
                                  type={col.tipo === 'numero' ? 'number' : col.tipo === 'decimal' ? 'number' : 'text'}
                                  step={col.tipo === 'decimal' ? '0.01' : undefined}
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  onBlur={saveCelda}
                                  onKeyDown={handleCeldaKeyDown}
                                  className="celda-input"
                                />
                              ) : (
                                <span className="celda-valor">{val}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  {filas.length > 0 && (
                    <tfoot>
                      <tr className="tr-total">
                        <td className="td-accion"></td>
                        <td className="celda-total" style={{ fontWeight: 700 }}>Total</td>
                        <td className="celda-total"></td>
                        {(() => {
                          const tg = computeTotalesGenerales(filas, getValor);
                          return COLUMNAS_FIJAS.filter(col => col.key !== 'programa').map(col => (
                            <td key={col.key} className="celda-total">{tg[col.key] ?? ''}</td>
                          ));
                        })()}
                      </tr>
                    </tfoot>
                  )}
                </table>
                <div className="eg-add-fila-bar">
                  <button className="btn btn-primary btn-small" onClick={handleAddFila}>+ Nueva Fila</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="eg-navegador">
          <span className="eg-navegador-label">Hojas:</span>
          <div className="eg-navegador-lista">
            {hojas.map(hoja => (
              <button
                key={hoja.id}
                className={`eg-navegador-btn ${selectedHoja.id === hoja.id ? 'active' : ''}`}
                onClick={() => handleSelectHoja(hoja)}
              >
                {nombreHoja(hoja) || 'Sin nombre'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para asignación de usuarios por FILA */}
      {showModalFilaUsuarios && selectedFilaForUsuarios && (
        <div className="form-modal" onClick={() => setShowModalFilaUsuarios(false)}>
          <div className="form-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="form-header">
              <div>
                <h2>Asignar personal a fila</h2>
                <p className="text-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
                  Programa: <strong>{getValor(selectedFilaForUsuarios, 'programa') || `Fila #${selectedFilaForUsuarios.id}`}</strong>
                </p>
              </div>
              <button className="close-btn" onClick={() => setShowModalFilaUsuarios(false)}>×</button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#1e293b', fontSize: '0.9rem' }}>
                Personal asignado actualmente a esta fila:
              </strong>
              {filaUsuarios.length === 0 ? (
                <span className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>
                  No hay personal asignado a esta fila todavía.
                </span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {filaUsuarios.map(u => {
                    const cStyle = getUserColor(u.nombre || u.usuario_id);
                    return (
                      <span
                        key={u.asignacion_id}
                        className="eg-usuario-tag"
                        style={{
                          backgroundColor: cStyle.bg,
                          color: cStyle.text,
                          border: `1px solid ${cStyle.border}`
                        }}
                      >
                        <span className="eg-user-dot" style={{ backgroundColor: cStyle.dot }}></span>
                        {u.nombre} <small>({u.usuario_tipo === 'directivo' ? 'Directivo' : 'Personal'})</small>
                        <button
                          className="tag-remove"
                          style={{ color: cStyle.text }}
                          onClick={() => handleQuitarUsuarioFila(u)}
                          title="Quitar de esta fila"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="asignar-modal-body">
              <strong style={{ display: 'block', padding: '0 1.5rem 0.5rem', color: '#475569', fontSize: '0.85rem' }}>
                Selecciona personal disponible para agregar:
              </strong>
              <div className="asignar-columnas">
                <div className="asignar-seccion">
                  <h4>Directivos</h4>
                  <div className="asignar-lista">
                    {getUsuariosDisponiblesFila().filter(u => u.tipo === 'directivo').length === 0 ? (
                      <p className="text-muted">No hay directivos disponibles</p>
                    ) : (
                      getUsuariosDisponiblesFila().filter(u => u.tipo === 'directivo').map(u => {
                        const key = `${u.id}_${u.tipo}`;
                        return (
                          <button key={key} className={`asignar-btn-usuario${selectedFilaAsignar.has(key) ? ' selected' : ''}`} onClick={() => toggleFilaAsignarUsuario(u)}>
                            <span className="asignar-check">{selectedFilaAsignar.has(key) ? '✓' : ''}</span>
                            <span className="asignar-usuario-nombre">{u.nombre}</span>
                            <span className="asignar-usuario-tipo">Directivo</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className="asignar-divider-vertical"></div>
                <div className="asignar-seccion">
                  <h4>Personal</h4>
                  <div className="asignar-lista">
                    {getUsuariosDisponiblesFila().filter(u => u.tipo === 'personal').length === 0 ? (
                      <p className="text-muted">No hay personal disponible</p>
                    ) : (
                      getUsuariosDisponiblesFila().filter(u => u.tipo === 'personal').map(u => {
                        const key = `${u.id}_${u.tipo}`;
                        return (
                          <button key={key} className={`asignar-btn-usuario${selectedFilaAsignar.has(key) ? ' selected' : ''}`} onClick={() => toggleFilaAsignarUsuario(u)}>
                            <span className="asignar-check">{selectedFilaAsignar.has(key) ? '✓' : ''}</span>
                            <span className="asignar-usuario-nombre">{u.nombre}</span>
                            <span className="asignar-usuario-tipo">Personal</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              <div className="asignar-footer">
                <span className="asignar-seleccionados">{selectedFilaAsignar.size} seleccionado(s)</span>
                <div className="asignar-footer-actions">
                  <button className="btn btn-secondary" onClick={() => setShowModalFilaUsuarios(false)}>Cerrar</button>
                  <button className="btn btn-primary" onClick={handleConfirmarFilaAsignacion} disabled={selectedFilaAsignar.size === 0 || savingFilaUsuarios}>
                    {savingFilaUsuarios ? 'Guardando...' : 'Asignar a fila'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

  return (
    <div className="tab-content estadisticos-genero">
      <div className="tab-header">
        <h2>📊 Estadísticos de Aprovechamiento Académico</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={onClose}>← Volver al Dashboard</button>
          <button className="btn btn-primary" onClick={handleOpenNewHoja}>+ Nueva Hoja</button>
        </div>
      </div>

      <div className="eg-info-bar">
        <h3>Información Estadística de Aprovechamiento Académico</h3>
        <p>Selecciona un año y luego una hoja para ver y editar sus datos.</p>
      </div>

      <div className="eg-anios-bar">
        {aniosDisponibles.length === 0 ? (
          <span className="text-muted">Sin años registrados</span>
        ) : (
          <>
            <span className="eg-anios-label">Años:</span>
            <div className="eg-anios-lista">
              {aniosDisponibles.map(anio => (
                <button
                  key={anio}
                  className={`eg-anio-btn ${selectedAnio === anio ? 'active' : ''}`}
                  onClick={() => handleSelectAnio(anio)}
                >
                  {anio}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedAnio && (
        <>
          {loading ? (
            <div className="loading" style={{ padding: '2rem' }}>Cargando...</div>
          ) : hojas.length === 0 ? (
            <div className="eg-empty">
              <p>No hay hojas para {selectedAnio}</p>
              <button className="btn btn-primary" onClick={handleOpenNewHoja}>Crear Primera Hoja</button>
            </div>
          ) : (
            <div className="eg-hojas-list">
              {hojas.map(hoja => (
                <div key={hoja.id} className="eg-hoja-card">
                  <div className="eg-hoja-info">
                    <h3>{nombreHoja(hoja) || 'Sin nombre'}</h3>
                  </div>
                  <div className="eg-hoja-actions">
                    <button className="btn btn-success" onClick={() => handleSelectHoja(hoja)}>
                      Entrar
                    </button>
                    <button className="btn btn-secondary btn-small" onClick={() => handleOpenEditHoja(hoja)}>✏️ Editar</button>
                    <button className="btn btn-danger btn-small" onClick={() => handleDeleteHoja(hoja)}>🗑️ Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="eg-usuarios-panel" style={{ marginTop: '2rem' }}>
        <div className="eg-usuarios-header">
          <h3>Usuarios con acceso general</h3>
          <button className="btn btn-outline btn-small" onClick={() => { setSelectedAsignar(new Set()); setShowAsignarUsuarios(true); }}>+ Asignar</button>
        </div>
        {usuariosLoading ? (
          <div className="loading" style={{ padding: '1rem' }}>Cargando...</div>
        ) : usuariosAsignados.length === 0 ? (
          <p className="text-muted" style={{ padding: '0.5rem 1rem', margin: 0 }}>Sin usuarios asignados</p>
        ) : (
          <div className="eg-usuarios-tags">
            {usuariosAsignados.map(u => {
              const cStyle = getUserColor(u.nombre || u.usuario_id);
              return (
                <span
                  key={u.asignacion_id}
                  className="eg-usuario-tag"
                  style={{
                    backgroundColor: cStyle.bg,
                    color: cStyle.text,
                    border: `1px solid ${cStyle.border}`
                  }}
                >
                  <span className="eg-user-dot" style={{ backgroundColor: cStyle.dot }}></span>
                  {u.nombre} <small>({u.usuario_tipo === 'directivo' ? 'Directivo' : 'Personal'})</small>
                  <button className="tag-remove" style={{ color: cStyle.text }} onClick={() => handleQuitarUsuario(u)}>×</button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para asignación global */}
      {showAsignarUsuarios && (
        <div className="form-modal" onClick={() => setShowAsignarUsuarios(false)}>
          <div className="form-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="form-header">
              <h2>Asignar usuarios con acceso general</h2>
              <button className="close-btn" onClick={() => setShowAsignarUsuarios(false)}>×</button>
            </div>
            <div className="asignar-modal-body">
              <div className="asignar-columnas">
                <div className="asignar-seccion">
                  <h4>Directivos</h4>
                  <div className="asignar-lista">
                    {getUsuariosDisponibles().filter(u => u.tipo === 'directivo').length === 0 ? (
                      <p className="text-muted">No hay directivos disponibles</p>
                    ) : (
                      getUsuariosDisponibles().filter(u => u.tipo === 'directivo').map(u => {
                        const key = `${u.id}_${u.tipo}`;
                        return (
                          <button key={key} className={`asignar-btn-usuario${selectedAsignar.has(key) ? ' selected' : ''}`} onClick={() => toggleAsignarUsuario(u)}>
                            <span className="asignar-check">{selectedAsignar.has(key) ? '✓' : ''}</span>
                            <span className="asignar-usuario-nombre">{u.nombre}</span>
                            <span className="asignar-usuario-tipo">Directivo</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className="asignar-divider-vertical"></div>
                <div className="asignar-seccion">
                  <h4>Personal</h4>
                  <div className="asignar-lista">
                    {getUsuariosDisponibles().filter(u => u.tipo === 'personal').length === 0 ? (
                      <p className="text-muted">No hay personal disponible</p>
                    ) : (
                      getUsuariosDisponibles().filter(u => u.tipo === 'personal').map(u => {
                        const key = `${u.id}_${u.tipo}`;
                        return (
                          <button key={key} className={`asignar-btn-usuario${selectedAsignar.has(key) ? ' selected' : ''}`} onClick={() => toggleAsignarUsuario(u)}>
                            <span className="asignar-check">{selectedAsignar.has(key) ? '✓' : ''}</span>
                            <span className="asignar-usuario-nombre">{u.nombre}</span>
                            <span className="asignar-usuario-tipo">Personal</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              <div className="asignar-footer">
                <span className="asignar-seleccionados">{selectedAsignar.size} seleccionado(s)</span>
                <div className="asignar-footer-actions">
                  <button className="btn btn-secondary" onClick={() => setShowAsignarUsuarios(false)}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleConfirmarAsignacion} disabled={selectedAsignar.size === 0}>
                    Confirmar asignación
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {showFormHoja && (
        <div className="form-modal" onClick={() => setShowFormHoja(false)}>
          <div className="form-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="form-header">
              <h2>{editHojaId ? 'Editar Hoja' : 'Nueva Hoja'}</h2>
              <button className="close-btn" onClick={() => setShowFormHoja(false)}>×</button>
            </div>
            <form onSubmit={handleSaveHoja} style={{ padding: '20px 30px 30px' }}>
              <FormInput
                label="Cuatrimestre *"
                name="form-cuatrimestre"
                value={formCuatrimestre}
                onChange={e => setFormCuatrimestre(e.target.value)}
                placeholder="Ej: Mayo - Agosto"
                required
              />
              <FormInput
                label="Año *"
                name="form-anio"
                value={formAnio}
                onChange={e => setFormAnio(e.target.value)}
                placeholder="Ej: 2025"
                required
              />
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormHoja(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={savingHoja}>
                  {savingHoja ? 'Guardando...' : '💾 Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminEstadisticosGenero;
