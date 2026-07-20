import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api';
import { toast } from 'react-toastify';
import '../../styles/SuperAdminEstadisticosDocentes.css';
import FormInput from '../shared/FormInput';
import { handleApiError } from '../../utils/errorHandler';
import useSocketEvent from '../../hooks/useSocketEvent';

const TIPOS_SECCION = [
  { value: 'ultimo_grado', label: 'Último grado de estudios', color: 'green' },
  { value: 'solo_utma', label: 'Sólo en la UTMA', color: 'blue' },
  { value: 'laboral', label: 'Laboral en general', color: 'blue' },
  { value: 'edad', label: 'Edad', color: 'red' },
  { value: 'investigadores', label: 'Investigadores', color: 'orange' }
];

const COLUMNAS_POR_TIPO = {
  ultimo_grado: [
    { label: 'Con TSU', keys: ['tsu_h', 'tsu_m'] },
    { label: 'Con Ingeniería Técnica', keys: ['ing_tec_h', 'ing_tec_m'] },
    { label: 'Con Licenciatura', keys: ['lic_h', 'lic_m'] },
    { label: 'Con Especialidad', keys: ['esp_h', 'esp_m'] },
    { label: 'Con Maestría', keys: ['maestria_h', 'maestria_m'] },
    { label: 'Con Doctorado', keys: ['doctorado_h', 'doctorado_m'] },
    { label: 'Total', keys: ['total_h', 'total_m'] }
  ],
  solo_utma: [
    { label: '0 años', keys: ['cero_h', 'cero_m'] },
    { label: '1-4 años', keys: ['uno_cuatro_h', 'uno_cuatro_m'] },
    { label: '5-10 años', keys: ['cinco_diez_h', 'cinco_diez_m'] },
    { label: '10+ años', keys: ['diez_mas_h', 'diez_mas_m'] },
    { label: 'Total', keys: ['total_h', 'total_m'] }
  ],
  laboral: [
    { label: '0 años', keys: ['cero_h', 'cero_m'] },
    { label: '1-4 años', keys: ['uno_cuatro_h', 'uno_cuatro_m'] },
    { label: '5-10 años', keys: ['cinco_diez_h', 'cinco_diez_m'] },
    { label: '10+ años', keys: ['diez_mas_h', 'diez_mas_m'] },
    { label: 'Total', keys: ['total_h', 'total_m'] }
  ],
  edad: [
    { label: 'Entre 18 y 22 años', keys: ['edad_18_22_h', 'edad_18_22_m'] },
    { label: 'Entre 23 y 27 años', keys: ['edad_23_27_h', 'edad_23_27_m'] },
    { label: 'Entre 28 y 32 años', keys: ['edad_28_32_h', 'edad_28_32_m'] },
    { label: 'Entre 33 y 37 años', keys: ['edad_33_37_h', 'edad_33_37_m'] },
    { label: 'Más de 37 años', keys: ['edad_mas_37_h', 'edad_mas_37_m'] },
    { label: 'Total', keys: ['total_h', 'total_m'] }
  ],
  investigadores: [
    { label: 'PRODEP', keys: ['prodep_h', 'prodep_m'] },
    { label: 'SNI Candidato', keys: ['sni_candidato_h', 'sni_candidato_m'] },
    { label: 'SNI 1', keys: ['sni_1_h', 'sni_1_m'] },
    { label: 'SNI 2', keys: ['sni_2_h', 'sni_2_m'] },
    { label: 'SNI 3', keys: ['sni_3_h', 'sni_3_m'] },
    { label: 'Total', keys: ['total_h', 'total_m'] }
  ]
};

const NOMBRES_FILA = ['Total Acumulado', 'PTC', 'Asignatura'];

const parseNum = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

const sumarFilas = (filas, key) => filas.reduce((s, f) => s + parseNum(f.valores?.[key]), 0);

const getInfoTipo = (tipo) => TIPOS_SECCION.find(t => t.value === tipo) || { label: tipo, color: 'gray' };

const SuperAdminEstadisticosDocentes = ({ onClose }) => {
  const [hojas, setHojas] = useState([]);
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [selectedAnio, setSelectedAnio] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showFormHoja, setShowFormHoja] = useState(false);
  const [editHojaId, setEditHojaId] = useState(null);
  const [formCuatrimestre, setFormCuatrimestre] = useState('');
  const [formAnio, setFormAnio] = useState('');
  const [formNotas, setFormNotas] = useState('');
  const [savingHoja, setSavingHoja] = useState(false);

  const [selectedHoja, setSelectedHoja] = useState(null);

  const [secciones, setSecciones] = useState([]);
  const [filasPorSeccion, setFilasPorSeccion] = useState({});
  const [seccionesLoading, setSeccionesLoading] = useState(false);

  const [usuariosAsignados, setUsuariosAsignados] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [showAsignarUsuarios, setShowAsignarUsuarios] = useState(false);
  const [selectedAsignar, setSelectedAsignar] = useState(new Set());

  const [editingCelda, setEditingCelda] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { fetchAnios(); fetchHojas(); }, []);

  const refreshRef = useRef();
  useSocketEvent('estadisticos-docentes:updated', () => refreshRef.current?.());
  useEffect(() => { refreshRef.current = () => { fetchHojas(selectedAnio); fetchAnios(); }; });

  const fetchAnios = async () => {
    try { const r = await api.get('/api/university/estadisticos-docentes-hojas-anios'); setAniosDisponibles(r.data.data || []); }
    catch (e) { console.warn(e.message); }
  };

  const fetchHojas = async (anio) => {
    setLoading(true);
    try { const p = anio ? `?anio=${encodeURIComponent(anio)}` : ''; const r = await api.get(`/api/university/estadisticos-docentes-hojas${p}`); setHojas(r.data.data || []); }
    catch (e) { handleApiError(e, 'Error al cargar hojas'); } finally { setLoading(false); }
  };

  const handleSelectAnio = (anio) => { setSelectedAnio(anio); setSelectedHoja(null); fetchHojas(anio); };

  const handleOpenNewHoja = () => { setEditHojaId(null); setFormCuatrimestre(''); setFormAnio(selectedAnio || ''); setFormNotas(''); setShowFormHoja(true); };
  const handleOpenEditHoja = (hoja) => { setEditHojaId(hoja.id); setFormCuatrimestre(hoja.cuatrimestre || ''); setFormAnio(hoja.anio || ''); setFormNotas(hoja.notas || ''); setShowFormHoja(true); };

  const handleSaveHoja = async (e) => {
    e.preventDefault(); setSavingHoja(true);
    try {
      if (editHojaId) { await api.put(`/api/university/estadisticos-docentes-hojas/${editHojaId}`, { cuatrimestre: formCuatrimestre.trim(), anio: formAnio.trim(), notas: formNotas.trim() }); toast.success('Hoja actualizada'); }
      else { await api.post('/api/university/estadisticos-docentes-hojas', { cuatrimestre: formCuatrimestre.trim(), anio: formAnio.trim(), notas: formNotas.trim() }); toast.success('Hoja creada'); }
      setShowFormHoja(false); setEditHojaId(null); fetchHojas(selectedAnio); fetchAnios();
    } catch (e) { handleApiError(e, 'Error al guardar hoja'); } finally { setSavingHoja(false); }
  };

  const handleDeleteHoja = async (hoja) => {
    const n = [hoja.cuatrimestre, hoja.anio].filter(Boolean).join(' - ') || 'Sin nombre';
    if (!window.confirm(`¿Eliminar "${n}"?\nSe eliminarán secciones y filas.`)) return;
    try { await api.delete(`/api/university/estadisticos-docentes-hojas/${hoja.id}`); toast.success('Hoja eliminada'); if (selectedHoja?.id === hoja.id) setSelectedHoja(null); fetchHojas(selectedAnio); fetchAnios(); }
    catch (e) { handleApiError(e, 'Error al eliminar'); }
  };

  const handleSelectHoja = async (hoja) => {
    setSelectedHoja(hoja);
    setEditingCelda(null);
    fetchHojas(selectedAnio);
    fetchUsuariosHoja(hoja.id);
    await cargarSecciones(hoja.id);
  };

  const cargarSecciones = async (hojaId) => {
    setSeccionesLoading(true);
    try {
      const r = await api.get(`/api/university/estadisticos-docentes-secciones?hoja_id=${hojaId}`);
      let secs = r.data.data || [];
      if (secs.length === 0) {
        for (const t of TIPOS_SECCION) {
          await api.post('/api/university/estadisticos-docentes-secciones', { hoja_id: hojaId, nombre: t.label, tipo: t.value });
        }
        const r2 = await api.get(`/api/university/estadisticos-docentes-secciones?hoja_id=${hojaId}`);
        secs = r2.data.data || [];
      }
      setSecciones(secs);
      const filasMap = {};
      for (const sec of secs) {
        const fRes = await api.get(`/api/university/estadisticos-docentes-filas?seccion_id=${sec.id}`);
        let filas = fRes.data.data || [];
        if (filas.length === 0) {
          for (const nf of NOMBRES_FILA) {
            await api.post('/api/university/estadisticos-docentes-filas', { seccion_id: sec.id, nombre_fila: nf, valores: {} });
          }
          const fRes2 = await api.get(`/api/university/estadisticos-docentes-filas?seccion_id=${sec.id}`);
          filas = fRes2.data.data || [];
        }
        filasMap[sec.id] = filas;
      }
      setFilasPorSeccion(filasMap);
    } catch (e) { handleApiError(e, 'Error al cargar secciones'); } finally { setSeccionesLoading(false); }
  };

  const fetchUsuariosHoja = async (hojaId) => {
    try { const [a, d] = await Promise.all([api.get(`/api/university/estadisticos-docentes-hojas/${hojaId}/usuarios`), api.get('/api/university/estadisticos-docentes-usuarios-disponibles')]); setUsuariosAsignados(a.data.data || []); setUsuariosDisponibles(d.data.data || []); }
    catch (e) { handleApiError(e, 'Error al cargar usuarios'); }
  };

  const toggleAsignarUsuario = (u) => {
    const k = `${u.id}_${u.tipo}`;
    setSelectedAsignar(p => { const n = new Set(p); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  };

  const handleConfirmarAsignacion = async () => {
    if (selectedAsignar.size === 0) { toast.error('Selecciona al menos un usuario'); return; }
    try { for (const k of selectedAsignar) { const [id, tipo] = k.split('_'); await api.post('/api/university/estadisticos-docentes-usuarios', { hoja_id: selectedHoja.id, usuario_id: parseInt(id), usuario_tipo: tipo }); } toast.success(`${selectedAsignar.size} usuario(s) asignado(s)`); setShowAsignarUsuarios(false); setSelectedAsignar(new Set()); fetchUsuariosHoja(selectedHoja.id); }
    catch (e) { handleApiError(e, 'Error al asignar'); }
  };

  const handleQuitarUsuario = async (a) => {
    if (!window.confirm('¿Quitar este usuario de la hoja?')) return;
    try { await api.delete(`/api/university/estadisticos-docentes-usuarios/${a.asignacion_id}`); toast.success('Usuario quitado'); fetchUsuariosHoja(selectedHoja.id); }
    catch (e) { handleApiError(e, 'Error al quitar'); }
  };

  const getUsuariosDisponibles = () => { const a = new Set(usuariosAsignados.map(u => `${u.usuario_id}_${u.usuario_tipo}`)); return usuariosDisponibles.filter(u => !a.has(`${u.id}_${u.tipo}`)); };

  const getValor = (fila, key) => { try { const v = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {}); return v[key] ?? ''; } catch { return ''; } };

  const CAMPOS_EDITABLES = new Set(['ptc', 'asignatura']);

  const startEditCelda = (fila, key, currentValue) => {
    if (fila.nombre_fila === 'Total Acumulado') return;
    setEditingCelda({ filaId: fila.id, key, filaNombre: fila.nombre_fila });
    setEditValue(currentValue);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveCelda = useCallback(async () => {
    if (!editingCelda) return;
    const { filaId, key } = editingCelda;
    try {
      await api.patch(`/api/university/estadisticos-docentes-filas/${filaId}/celda`, { key, value: editValue });
      setFilasPorSeccion(prev => {
        const next = { ...prev };
        for (const secId of Object.keys(next)) {
          next[secId] = next[secId].map(f => {
            if (f.id !== filaId) return f;
            const vals = typeof f.valores === 'string' ? JSON.parse(f.valores) : (f.valores || {});
            vals[key] = editValue;
            const updatedFila = { ...f, valores: vals };
            return updatedFila;
          });
          const filas = next[secId];
          const ptc = filas.find(f => f.nombre_fila === 'PTC');
          const asig = filas.find(f => f.nombre_fila === 'Asignatura');
          const total = filas.find(f => f.nombre_fila === 'Total Acumulado');
          if (ptc && asig && total) {
            const ptcVals = typeof ptc.valores === 'string' ? JSON.parse(ptc.valores) : (ptc.valores || {});
            const asigVals = typeof asig.valores === 'string' ? JSON.parse(asig.valores) : (asig.valores || {});
            const totalVals = {};
            const allKeys = [...new Set([...Object.keys(ptcVals), ...Object.keys(asigVals)])];
            for (const k of allKeys) {
              totalVals[k] = String(parseNum(ptcVals[k]) + parseNum(asigVals[k]));
            }
            next[secId] = next[secId].map(f => {
              if (f.nombre_fila === 'Total Acumulado') {
                const vals = typeof f.valores === 'string' ? JSON.parse(f.valores) : (f.valores || {});
                for (const [k, v] of Object.entries(totalVals)) vals[k] = v;
                return { ...f, valores: vals };
              }
              return f;
            });
            const totalFila = next[secId].find(f => f.nombre_fila === 'Total Acumulado');
            if (totalFila) {
              const vals = typeof totalFila.valores === 'string' ? JSON.parse(totalFila.valores) : (totalFila.valores || {});
              for (const [k, v] of Object.entries(totalVals)) {
                api.patch(`/api/university/estadisticos-docentes-filas/${totalFila.id}/celda`, { key: k, value: v }).catch(() => {});
              }
            }
          }
        }
        return next;
      });
    } catch (e) { handleApiError(e, 'Error al guardar'); }
    setEditingCelda(null);
    setEditValue('');
  }, [editingCelda, editValue]);

  const handleCeldaKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveCelda(); }
    if (e.key === 'Escape') { setEditingCelda(null); setEditValue(''); }
    if (e.key === 'Tab') { e.preventDefault(); saveCelda(); }
  };

  const nombreHoja = (hoja) => [hoja.cuatrimestre, hoja.anio].filter(Boolean).join(' - ');

  if (selectedHoja) {
    return (
      <div className="tab-content estadisticos-docentes">
        <div className="tab-header">
          <div><h2>Datos Estadísticos - Docentes</h2><p className="text-muted" style={{ margin: 0 }}>{nombreHoja(selectedHoja)}</p></div>
          <div className="tab-actions"><button className="btn btn-secondary" onClick={() => setSelectedHoja(null)}>← Volver</button></div>
        </div>

        {seccionesLoading ? (
          <div className="loading" style={{ padding: '3rem', textAlign: 'center' }}>Cargando secciones...</div>
        ) : (
          <div className="ed-secciones-wrap">
            {secciones.map(sec => {
              const info = getInfoTipo(sec.tipo);
              const columnas = COLUMNAS_POR_TIPO[sec.tipo] || [];
              const filas = filasPorSeccion[sec.id] || [];
              const ptc = filas.find(f => f.nombre_fila === 'PTC');
              const asig = filas.find(f => f.nombre_fila === 'Asignatura');
              const total = filas.find(f => f.nombre_fila === 'Total Acumulado');
              return (
                <div key={sec.id} className={`ed-panel ed-panel-${info.color}`}>
                  <h2>{sec.nombre}</h2>
                  <table className="ed-tabla">
                    <thead>
                      <tr>
                        <th></th>
                        {columnas.map(col => <th key={col.keys[0]} colSpan={2}>{col.label}</th>)}
                      </tr>
                      <tr>
                        <th></th>
                        {columnas.map(col => <React.Fragment key={col.keys[0]}><th>H</th><th>M</th></React.Fragment>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[total, ptc, asig].filter(Boolean).map(fila => {
                        const esTotal = fila.nombre_fila === 'Total Acumulado';
                        return (
                          <tr key={fila.id} className={esTotal ? 'ed-total-row' : ''}>
                            <td className="ed-rowlabel">{fila.nombre_fila}</td>
                            {columnas.map(col => col.keys.map(key => {
                              const cellKey = `${fila.id}_${key}`;
                              const isEditing = editingCelda?.filaId === fila.id && editingCelda?.key === key;
                              const val = getValor(fila, key);
                              if (esTotal) return <td key={cellKey} className="ed-celda-readonly">{val || ''}</td>;
                              return (
                                <td key={cellKey} className="ed-celda-edit" onClick={() => !isEditing && startEditCelda(fila, key, val)}>
                                  {isEditing ? (
                                    <input ref={inputRef} type="number" value={editValue}
                                      onChange={e => setEditValue(e.target.value)}
                                      onBlur={saveCelda} onKeyDown={handleCeldaKeyDown} className="ed-input" />
                                  ) : <span>{val || ''}</span>}
                                </td>
                              );
                            }))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {selectedHoja.notas && (
          <div className="ed-notas">
            <strong>Notas:</strong>
            <p>{selectedHoja.notas}</p>
          </div>
        )}

        <div className="ed-usuarios-panel">
          <div className="ed-usuarios-header"><h3>Usuarios con acceso a esta hoja</h3>
            <button className="btn btn-outline btn-small" onClick={() => { setSelectedAsignar(new Set()); setShowAsignarUsuarios(true); }}>+ Asignar</button>
          </div>
          {usuariosAsignados.length === 0 ? <p className="text-muted" style={{ padding: '0.5rem 1rem', margin: 0 }}>Sin usuarios asignados</p>
            : <div className="ed-usuarios-tags">{usuariosAsignados.map(u => (
              <span key={u.asignacion_id} className="ed-usuario-tag">{u.nombre} <small>({u.usuario_tipo === 'directivo' ? 'Directivo' : 'Personal'})</small>
                <button className="tag-remove" onClick={() => handleQuitarUsuario(u)}>×</button>
              </span>
            ))}</div>}
        </div>

        <div className="ed-navegador">
          <span className="ed-navegador-label">Hojas:</span>
          <div className="ed-navegador-lista">{hojas.map(hoja => (
            <button key={hoja.id} className={`ed-navegador-btn ${selectedHoja.id === hoja.id ? 'active' : ''}`}
              onClick={() => handleSelectHoja(hoja)}>{nombreHoja(hoja) || 'Sin nombre'}</button>
          ))}</div>
        </div>

        {showAsignarUsuarios && (
          <div className="form-modal" onClick={() => setShowAsignarUsuarios(false)}>
            <div className="form-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="form-header"><h2>Asignar usuarios a: {nombreHoja(selectedHoja)}</h2>
                <button className="close-btn" onClick={() => setShowAsignarUsuarios(false)}>×</button>
              </div>
              <div className="asignar-modal-body">
                <div className="asignar-columnas">
                  <div className="asignar-seccion"><h4>Directivos</h4>
                    <div className="asignar-lista">{getUsuariosDisponibles().filter(u => u.tipo === 'directivo').length === 0 ? <p className="text-muted">No hay directivos disponibles</p>
                      : getUsuariosDisponibles().filter(u => u.tipo === 'directivo').map(u => { const k = `${u.id}_${u.tipo}`; return (
                        <button key={k} className={`asignar-btn-usuario${selectedAsignar.has(k) ? ' selected' : ''}`} onClick={() => toggleAsignarUsuario(u)}>
                          <span className="asignar-check">{selectedAsignar.has(k) ? '✓' : ''}</span>
                          <span className="asignar-usuario-nombre">{u.nombre}</span>
                          <span className="asignar-usuario-tipo">Directivo</span>
                        </button>); })}
                    </div>
                  </div>
                  <div className="asignar-divider-vertical"></div>
                  <div className="asignar-seccion"><h4>Personal</h4>
                    <div className="asignar-lista">{getUsuariosDisponibles().filter(u => u.tipo === 'personal').length === 0 ? <p className="text-muted">No hay personal disponible</p>
                      : getUsuariosDisponibles().filter(u => u.tipo === 'personal').map(u => { const k = `${u.id}_${u.tipo}`; return (
                        <button key={k} className={`asignar-btn-usuario${selectedAsignar.has(k) ? ' selected' : ''}`} onClick={() => toggleAsignarUsuario(u)}>
                          <span className="asignar-check">{selectedAsignar.has(k) ? '✓' : ''}</span>
                          <span className="asignar-usuario-nombre">{u.nombre}</span>
                          <span className="asignar-usuario-tipo">Personal</span>
                        </button>); })}
                    </div>
                  </div>
                </div>
                <div className="asignar-footer">
                  <span className="asignar-seleccionados">{selectedAsignar.size} seleccionado(s)</span>
                  <div className="asignar-footer-actions">
                    <button className="btn btn-secondary" onClick={() => setShowAsignarUsuarios(false)}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleConfirmarAsignacion} disabled={selectedAsignar.size === 0}>Confirmar asignación</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tab-content estadisticos-docentes">
      <div className="tab-header">
        <h2>📊 Datos Estadísticos - Docentes</h2>
        <div className="tab-actions">
          <button className="btn btn-secondary" onClick={onClose}>← Volver al Dashboard</button>
          <button className="btn btn-primary" onClick={handleOpenNewHoja}>+ Nueva Hoja</button>
        </div>
      </div>
      <div className="ed-info-bar"><h3>Datos Estadísticos - Docentes</h3><p>Selecciona un año y luego una hoja.</p></div>
      <div className="ed-anios-bar">{aniosDisponibles.length === 0 ? <span className="text-muted">Sin años registrados</span>
        : <><span className="ed-anios-label">Años:</span><div className="ed-anios-lista">{aniosDisponibles.map(anio => (
          <button key={anio} className={`ed-anio-btn ${selectedAnio === anio ? 'active' : ''}`} onClick={() => handleSelectAnio(anio)}>{anio}</button>
        ))}</div></>}
      </div>
      {selectedAnio && (<>{loading ? <div className="loading" style={{ padding: '2rem' }}>Cargando...</div>
        : hojas.length === 0 ? <div className="ed-empty"><p>No hay hojas para {selectedAnio}</p><button className="btn btn-primary" onClick={handleOpenNewHoja}>Crear Primera Hoja</button></div>
          : <div className="ed-hojas-list">{hojas.map(hoja => (
            <div key={hoja.id} className="ed-hoja-card">
              <div className="ed-hoja-info"><h3>{nombreHoja(hoja) || 'Sin nombre'}</h3></div>
              <div className="ed-hoja-actions">
                <button className="btn btn-success" onClick={() => handleSelectHoja(hoja)}>Entrar</button>
                <button className="btn btn-secondary btn-small" onClick={() => handleOpenEditHoja(hoja)}>✏️ Editar</button>
                <button className="btn btn-danger btn-small" onClick={() => handleDeleteHoja(hoja)}>🗑️ Eliminar</button>
              </div>
            </div>
          ))}</div>}
      </>)}
      {showFormHoja && (
        <div className="form-modal" onClick={() => setShowFormHoja(false)}>
          <div className="form-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="form-header"><h2>{editHojaId ? 'Editar Hoja' : 'Nueva Hoja'}</h2>
              <button className="close-btn" onClick={() => setShowFormHoja(false)}>×</button>
            </div>
            <form onSubmit={handleSaveHoja} style={{ padding: '20px 30px 30px' }}>
              <FormInput label="Cuatrimestre *" name="form-cuatrimestre" value={formCuatrimestre} onChange={e => setFormCuatrimestre(e.target.value)} placeholder="Ej: Mayo - Agosto" required />
              <FormInput label="Año *" name="form-anio" value={formAnio} onChange={e => setFormAnio(e.target.value)} placeholder="Ej: 2025" required />
              <FormInput label="Notas" name="form-notas" value={formNotas} onChange={e => setFormNotas(e.target.value)} placeholder="Notas al pie (opcional)" />
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormHoja(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={savingHoja}>{savingHoja ? 'Guardando...' : '💾 Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminEstadisticosDocentes;
