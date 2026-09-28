import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import '../../styles/EstadisticosGeneroPage.css';
import { handleApiError } from '../../utils/errorHandler';
import { toast } from 'react-toastify';
import useSocketEvent from '../../hooks/useSocketEvent';
import { getUserColor } from '../../utils/userColors';

const EDITABLES = new Set(['grupos', 'cant_hombres', 'cant_mujeres', 'aprov_hombres', 'aprov_mujeres']);

const COLUMNAS_FIJAS = [
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

const computeTotalesGenerales = (filas, getValorFn) => {
  const total = { grupos: 0, cant_total: 0, cant_hombres: 0, cant_mujeres: 0, aprov_hombres: [], aprov_mujeres: [], aprov_total: [] };
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
    programa: 'Total',
    grupos: String(total.grupos),
    cant_total: String(total.cant_total),
    cant_hombres: String(total.cant_hombres),
    cant_mujeres: String(total.cant_mujeres),
    aprov_hombres: avg(total.aprov_hombres),
    aprov_mujeres: avg(total.aprov_mujeres),
    aprov_total: avg(total.aprov_total)
  };
};

const EstadisticosGeneroPage = ({ user }) => {
  const navigate = useNavigate();
  const [misHojas, setMisHojas] = useState([]);
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [selectedAnio, setSelectedAnio] = useState(null);
  const [selectedHoja, setSelectedHoja] = useState(null);
  const [filas, setFilas] = useState([]);
  const [filasLoading, setFilasLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editingCelda, setEditingCelda] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  const refreshRef = useRef();
  useEffect(() => {
    refreshRef.current = () => {
      fetchMisHojas();
      if (selectedHoja) {
        fetchFilas(selectedHoja.id);
      }
    };
  });
  useSocketEvent('estadisticos-genero:updated', () => refreshRef.current && refreshRef.current());

  useEffect(() => {
    fetchMisHojas();
  }, []);

  const fetchMisHojas = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/university/estadisticos-genero-mis-hojas?usuario_id=${user.id}&usuario_tipo=${user.tipo}`);
      const hojas = res.data.data || [];
      setMisHojas(hojas);
      const anios = [...new Set(hojas.map(h => h.anio).filter(Boolean))].sort((a, b) => b - a);
      setAniosDisponibles(anios);
      if (anios.length > 0 && !selectedAnio) setSelectedAnio(anios[0]);
    } catch (error) {
      handleApiError(error, 'Error al cargar tus hojas');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilas = async (hojaId) => {
    setFilasLoading(true);
    try {
      const res = await api.get(`/api/university/estadisticos-genero-filas?hoja_id=${hojaId}`);
      setFilas(res.data.data || []);
    } catch (error) {
      handleApiError(error, 'Error al cargar datos');
    } finally {
      setFilasLoading(false);
    }
  };

  const handleSelectHoja = (hoja) => {
    setSelectedHoja(hoja);
    setEditingCelda(null);
    fetchFilas(hoja.id);
  };

  const isFilaAsignada = (fila) => {
    if (!user) return false;
    if (user.tipo === 'superadmin' || user.isDelegado) return true;
    return Boolean(
      fila.usuarios &&
      fila.usuarios.some(u => u.usuario_id === user.id && u.usuario_tipo === user.tipo)
    );
  };

  const getValor = (fila, key) => {
    try {
      const valores = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
      return valores[key] ?? '';
    } catch { return ''; }
  };

  const startEditCelda = (fila, key, currentValue) => {
    if (!isFilaAsignada(fila)) {
      toast.warning('🔒 Acceso restringido. Solo el personal asignado a esta fila puede modificarla.');
      return;
    }
    setEditingCelda({ filaId: fila.id, key });
    setEditValue(currentValue);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const CAMPOS_DECIMALES = new Set(['aprov_hombres', 'aprov_mujeres', 'aprov_total']);

  const saveCelda = useCallback(async () => {
    if (!editingCelda) return;
    const { filaId, key } = editingCelda;
    const valorFinal = CAMPOS_DECIMALES.has(key) ? round2(editValue) : editValue;
    try {
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
      handleApiError(error, 'Error al guardar');
    }
    setEditingCelda(null);
    setEditValue('');
  }, [editingCelda, editValue]);

  const handleCeldaKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveCelda(); }
    if (e.key === 'Escape') { setEditingCelda(null); setEditValue(''); }
    if (e.key === 'Tab') { e.preventDefault(); saveCelda(); }
  };

  const getTipo = (key) => {
    if (key === 'grupos' || key === 'cant_hombres' || key === 'cant_mujeres' || key === 'cant_total') return 'numero';
    if (key === 'aprov_hombres' || key === 'aprov_mujeres' || key === 'aprov_total') return 'decimal';
    return 'texto';
  };

  const hojasFiltradas = misHojas.filter(h => !selectedAnio || h.anio === selectedAnio);
  const myColor = user ? getUserColor(user.nombre || user.id) : null;

  if (selectedHoja) {
    return (
      <div className="eg-page-container">
        <div className="eg-page-header">
          <button className="btn btn-secondary" onClick={() => { setSelectedHoja(null); setFilas([]); setEditingCelda(null); }}>← Volver a Hojas</button>
          <div>
            <h2>Información Estadística de Aprovechamiento Académico</h2>
            <p className="text-muted">{selectedHoja.cuatrimestre} - {selectedHoja.anio}</p>
          </div>
        </div>

        {/* Banner de información de asignación y leyenda de colores */}
        <div className="eg-info-legend-banner">
          <div className="eg-legend-icon">👥</div>
          <div className="eg-legend-content">
            <div>
              <strong>Asignación por fila:</strong> Cada fila tiene personal asignado con un color único.
              {myColor && user?.nombre && (
                <span className="eg-user-legend-pill">
                  Tu etiqueta de llenado:
                  <span
                    className="eg-user-badge eg-badge-is-you"
                    style={{
                      backgroundColor: myColor.bg,
                      color: myColor.text,
                      borderColor: myColor.border,
                      marginLeft: '0.4rem',
                      display: 'inline-flex'
                    }}
                  >
                    <span className="eg-user-dot" style={{ backgroundColor: myColor.dot }}></span>
                    <strong>{user.nombre}</strong>
                  </span>
                </span>
              )}
            </div>
            <p className="eg-legend-hint">
              Solo puedes editar las filas <strong style={{ color: '#15803d' }}>resaltadas en verde</strong>. Las demás filas son de solo lectura para tu usuario.
            </p>
          </div>
        </div>

        {/* Descripción de columnas */}
        <div className="eg-cols-desc">
          <h4 className="eg-cols-desc-title">Descripción de Columnas</h4>
          <div className="eg-cols-desc-grid">
            <div className="eg-cols-desc-block">
              <span className="eg-cols-desc-block-title" style={{ color: '#3b82f6', borderLeftColor: '#3b82f6' }}>Grupos</span>
              <p className="eg-cols-desc-row">Cantidad total de grupos en dicho PE.</p>
            </div>

            <div className="eg-cols-desc-block">
              <span className="eg-cols-desc-block-title" style={{ color: '#f59e0b', borderLeftColor: '#f59e0b' }}>Cantidad</span>
              <p className="eg-cols-desc-row"><b>Hombres:</b> Cantidad total de hombres en el PE (ej. 54).</p>
              <p className="eg-cols-desc-row"><b>Mujeres:</b> Cantidad total de mujeres en el PE (ej. 67).</p>
            </div>

            <div className="eg-cols-desc-block">
              <span className="eg-cols-desc-block-title" style={{ color: '#10b981', borderLeftColor: '#10b981' }}>Aprovechamiento</span>
              <p className="eg-cols-desc-row"><b>Hombres:</b> Promedio final de hombres al final del Cuatrimestre (ej. 9.54).</p>
              <p className="eg-cols-desc-row"><b>Mujeres:</b> Promedio final de mujeres al final del Cuatrimestre (ej. 9.54).</p>
            </div>
          </div>
          <p className="eg-cols-desc-note">
            Los Totales se calculan automáticamente. No hay botón para guardar, los datos se guardan automáticamente al ingresarlos.
          </p>
        </div>

        <div className="eg-page-table-wrap">
          {filasLoading ? (
            <div className="loading" style={{ padding: '3rem', textAlign: 'center' }}>Cargando...</div>
          ) : filas.length === 0 ? (
            <p className="text-muted" style={{ padding: '3rem', textAlign: 'center' }}>Sin datos disponibles</p>
          ) : (
            <table className="eg-page-table">
              <thead>
                <tr>
                  <th className="th-blue" rowSpan="2">Programa</th>
                  <th className="th-blue" rowSpan="2" style={{ width: '175px', minWidth: '150px', maxWidth: '195px' }}>Responsable(s) de Llenado</th>
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
                {filas.map((fila) => {
                  const isMine = isFilaAsignada(fila);
                  return (
                    <tr key={fila.id} className={isMine ? 'eg-fila-mine' : 'eg-fila-other'}>
                      {/* Programa */}
                      <td className="celda-programa">
                        <span style={{ fontWeight: 600 }}>{getValor(fila, 'programa') || `Fila #${fila.id}`}</span>
                      </td>

                      {/* Responsables de Llenado con colores únicos */}
                      <td className="td-responsables" style={{ textAlign: 'center', padding: '0.4rem 0.35rem' }}>
                        <div className="eg-user-badges-wrap" style={{ justifyContent: 'center' }}>
                          {fila.usuarios && fila.usuarios.length > 0 ? (
                            fila.usuarios.map(u => {
                              const cStyle = getUserColor(u.nombre || u.usuario_id);
                              const isCurrentLoggedInUser = u.usuario_id === user?.id && u.usuario_tipo === user?.tipo;
                              return (
                                <span
                                  key={u.asignacion_id}
                                  className={`eg-user-badge ${isCurrentLoggedInUser ? 'eg-badge-is-you' : ''}`}
                                  style={{
                                    backgroundColor: cStyle.bg,
                                    color: cStyle.text,
                                    borderColor: cStyle.border
                                  }}
                                  title={`${u.nombre} (${u.usuario_tipo === 'directivo' ? 'Directivo' : 'Personal'})${isCurrentLoggedInUser ? ' - ¡Eres tú!' : ''}`}
                                >
                                  <span className="eg-user-name">{u.nombre}</span>
                                </span>
                              );
                            })
                          ) : (
                            <span className="eg-user-badge eg-badge-unassigned">⚠️ Sin asignar</span>
                          )}
                        </div>
                      </td>

                      {/* Columnas de datos */}
                      {COLUMNAS_FIJAS.map(col => {
                        const cellKey = `${fila.id}_${col.key}`;
                        const isEditing = editingCelda?.filaId === fila.id && editingCelda?.key === col.key;
                        const val = getValor(fila, col.key);
                        const isEditableField = EDITABLES.has(col.key) && !col.readOnly;

                        if (!isEditableField) {
                          return (
                            <td key={cellKey} className="celda-readonly">
                              <span className="celda-valor">{val}</span>
                            </td>
                          );
                        }

                        if (!isMine) {
                          return (
                            <td
                              key={cellKey}
                              className="editable-cell cell-locked"
                              onClick={() => startEditCelda(fila, col.key, val)}
                              title="🔒 Solo el personal asignado a esta fila puede editarla"
                            >
                              <span className="celda-valor">{val}</span>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={cellKey}
                            className="editable-cell cell-allowed"
                            onClick={() => !isEditing && startEditCelda(fila, col.key, val)}
                            title="Haz clic para editar este valor"
                          >
                            {isEditing ? (
                              <input
                                ref={inputRef}
                                type={col.tipo === 'decimal' ? 'number' : col.tipo === 'numero' ? 'number' : 'text'}
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
                  );
                })}
              </tbody>
              {filas.length > 0 && (
                <tfoot>
                  <tr className="tr-total">
                    <td className="celda-total" style={{ fontWeight: 700 }}>Total</td>
                    <td className="celda-total"></td>
                    {COLUMNAS_FIJAS.map(col => {
                      const tg = computeTotalesGenerales(filas, getValor);
                      return <td key={col.key} className="celda-total">{tg[col.key] ?? ''}</td>;
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>

        <div className="eg-page-nav">
          <span style={{ fontWeight: 600, color: '#4b5563', alignSelf: 'center', marginRight: '0.5rem', fontSize: '0.85rem' }}>
            Otras Hojas:
          </span>
          {hojasFiltradas.map(hoja => (
            <button
              key={hoja.id}
              className={`eg-page-nav-btn ${selectedHoja.id === hoja.id ? 'active' : ''}`}
              onClick={() => handleSelectHoja(hoja)}
            >
              {hoja.cuatrimestre || 'Sin nombre'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="eg-page-container">
      <div className="eg-page-header">
        <div>
          <h2>📊 Información Estadística de Aprovechamiento Académico</h2>
          <p className="text-muted">Selecciona un año y una hoja cuatrimestral para ver y llenar tus estadísticas asignadas.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: '3rem', textAlign: 'center' }}>Cargando tus hojas...</div>
      ) : misHojas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📋</span>
          <h3 style={{ margin: '0 0 0.5rem', color: '#1f2937' }}>No tienes hojas asignadas</h3>
          <p className="text-muted" style={{ margin: 0 }}>
            El administrador del sistema te asignará a las filas correspondientes para que puedas registrar la información.
          </p>
        </div>
      ) : (
        <>
          <div className="eg-page-anios">
            <span style={{ fontWeight: 600, color: '#4b5563', alignSelf: 'center', marginRight: '0.5rem', fontSize: '0.9rem' }}>
              Año:
            </span>
            {aniosDisponibles.map(anio => (
              <button
                key={anio}
                className={`eg-page-anio-btn ${selectedAnio === anio ? 'active' : ''}`}
                onClick={() => setSelectedAnio(anio)}
              >
                {anio}
              </button>
            ))}
          </div>

          <div className="eg-page-hojas">
            {hojasFiltradas.map(hoja => (
              <div key={hoja.id} className="eg-page-hoja-card" onClick={() => handleSelectHoja(hoja)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>{hoja.cuatrimestre || 'Sin nombre'}</h3>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                    {hoja.anio}
                  </span>
                </div>
                <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
                  Haz clic para ver y llenar datos
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default EstadisticosGeneroPage;
