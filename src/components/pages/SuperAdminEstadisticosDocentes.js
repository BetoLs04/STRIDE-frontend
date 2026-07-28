import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api';
import { toast } from 'react-toastify';
import '../../styles/SuperAdminEstadisticosDocentes.css';
import FormInput from '../shared/FormInput';
import { handleApiError } from '../../utils/errorHandler';
import useSocketEvent from '../../hooks/useSocketEvent';

const TIPOS_SECCION = [
  { value: 'ultimo_grado', label: 'Último grado de estudios', color: 'green' },
  { value: 'solo_utma', label: 'EXPERIENCIA DOCENTE Y LABORAL (SOLO EN LA UTMA)', color: 'blue' },
  { value: 'laboral', label: 'EXPERIENCIA DOCENTE Y LABORAL EN GENERAL (INCLUYENDO LA UTMA)', color: 'blue' },
  { value: 'edad', label: 'Edad', color: 'red' },
  { value: 'investigadores', label: 'Investigadores', color: 'orange' }
];

const isTotalKey = (key) => key === 'total_h' || key === 'total_m';
const parseNum = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

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
  const [savingHoja, setSavingHoja] = useState(false);

  const [selectedHoja, setSelectedHoja] = useState(null);
  const [carreras, setCarreras] = useState([]);
  const [carrerasLoading, setCarrerasLoading] = useState(false);

  const [showFormCarrera, setShowFormCarrera] = useState(false);
  const [editCarreraId, setEditCarreraId] = useState(null);
  const [formCarreraNombre, setFormCarreraNombre] = useState('');
  const [savingCarrera, setSavingCarrera] = useState(false);

  const [selectedCarrera, setSelectedCarrera] = useState(null);
  const [showConcentrado, setShowConcentrado] = useState(false);
  const [concentradoData, setConcentradoData] = useState(null);
  const [concentradoLoading, setConcentradoLoading] = useState(false);

  const [secciones, setSecciones] = useState([]);
  const [filasPorSeccion, setFilasPorSeccion] = useState({});
  const [seccionesLoading, setSeccionesLoading] = useState(false);

  const [globalNotas, setGlobalNotas] = useState('');
  const [globalNotasLoading, setGlobalNotasLoading] = useState(false);
  const [globalNotasSaving, setGlobalNotasSaving] = useState(false);
  const [editingNotas, setEditingNotas] = useState(false);

  const [usuariosAsignados, setUsuariosAsignados] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [showAsignarUsuarios, setShowAsignarUsuarios] = useState(false);
  const [selectedAsignar, setSelectedAsignar] = useState(new Set());

  const [editingCelda, setEditingCelda] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { fetchAnios(); fetchHojas(); fetchGlobalNotas(); }, []);
  const refreshRef = useRef();
  useSocketEvent('estadisticos-docentes:updated', () => refreshRef.current?.());
  useEffect(() => { refreshRef.current = () => { fetchHojas(selectedAnio); fetchAnios(); }; });

  const fetchAnios = async () => { try { const r = await api.get('/api/university/estadisticos-docentes-hojas-anios'); setAniosDisponibles(r.data.data || []); } catch (e) { console.warn(e.message); } };
  const fetchHojas = async (anio) => { setLoading(true); try { const p = anio ? `?anio=${encodeURIComponent(anio)}` : ''; const r = await api.get(`/api/university/estadisticos-docentes-hojas${p}`); setHojas(r.data.data || []); } catch (e) { handleApiError(e, 'Error'); } finally { setLoading(false); } };
  const fetchGlobalNotas = async () => { setGlobalNotasLoading(true); try { const r = await api.get('/api/university/estadisticos-docentes-notas'); setGlobalNotas(r.data.data?.contenido || ''); } catch (e) { console.warn(e.message); } finally { setGlobalNotasLoading(false); } };

  const handleSelectAnio = (anio) => { setSelectedAnio(anio); setSelectedHoja(null); setSelectedCarrera(null); fetchHojas(anio); };
  const handleOpenNewHoja = () => { setEditHojaId(null); setFormCuatrimestre(''); setFormAnio(selectedAnio || ''); setShowFormHoja(true); };
  const handleOpenEditHoja = (hoja) => { setEditHojaId(hoja.id); setFormCuatrimestre(hoja.cuatrimestre || ''); setFormAnio(hoja.anio || ''); setShowFormHoja(true); };

  const handleSaveHoja = async (e) => {
    e.preventDefault(); setSavingHoja(true);
    try { if (editHojaId) { await api.put(`/api/university/estadisticos-docentes-hojas/${editHojaId}`, { cuatrimestre: formCuatrimestre.trim(), anio: formAnio.trim() }); toast.success('Hoja actualizada'); } else { await api.post('/api/university/estadisticos-docentes-hojas', { cuatrimestre: formCuatrimestre.trim(), anio: formAnio.trim() }); toast.success('Hoja creada'); } setShowFormHoja(false); setEditHojaId(null); fetchHojas(selectedAnio); fetchAnios(); }
    catch (e) { handleApiError(e, 'Error'); } finally { setSavingHoja(false); }
  };

  const handleDeleteHoja = async (hoja) => {
    const n = [hoja.cuatrimestre, hoja.anio].filter(Boolean).join(' - ') || 'Sin nombre';
    if (!window.confirm(`¿Eliminar "${n}"?`)) return;
    try { await api.delete(`/api/university/estadisticos-docentes-hojas/${hoja.id}`); toast.success('Eliminada'); if (selectedHoja?.id === hoja.id) { setSelectedHoja(null); setSelectedCarrera(null); } fetchHojas(selectedAnio); fetchAnios(); }
    catch (e) { handleApiError(e, 'Error'); }
  };

  const handleSelectHoja = async (hoja) => {
    setSelectedHoja(hoja); setSelectedCarrera(null); setEditingCelda(null);
    fetchHojas(selectedAnio);
    await fetchCarreras(hoja.id);
  };

  const fetchCarreras = async (hojaId) => {
    setCarrerasLoading(true);
    try { const r = await api.get(`/api/university/estadisticos-docentes-carreras?hoja_id=${hojaId}`); setCarreras(r.data.data || []); }
    catch (e) { handleApiError(e, 'Error'); } finally { setCarrerasLoading(false); }
  };

  const cargarConcentrado = async (hojaId) => {
    setConcentradoLoading(true);
    try {
      const r = await api.get(`/api/university/estadisticos-docentes-carreras?hoja_id=${hojaId}`);
      const carreras = r.data.data || [];
      const TIPOS = ['ultimo_grado', 'solo_utma', 'laboral', 'edad', 'investigadores'];
      const NFS = ['PTC', 'Asignatura'];
      const resultado = {};

      for (const tipo of TIPOS) {
        const allFilas = {};
        for (const nf of NFS) allFilas[nf] = {};

        for (const c of carreras) {
          const sR = await api.get(`/api/university/estadisticos-docentes-secciones?carrera_id=${c.id}`);
          const secciones = sR.data.data || [];
          const sec = secciones.find(s => s.tipo === tipo);
          if (!sec) continue;
          const fR = await api.get(`/api/university/estadisticos-docentes-filas?seccion_id=${sec.id}`);
          const filas = fR.data.data || [];
          for (const nf of NFS) {
            const fila = filas.find(f => f.nombre_fila === nf);
            if (!fila) continue;
            const vals = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
            for (const [key, val] of Object.entries(vals)) {
              if (!allFilas[nf][key]) allFilas[nf][key] = 0;
              allFilas[nf][key] += parseFloat(val) || 0;
            }
          }
        }

        resultado[tipo] = {};
        for (const nf of NFS) {
          const vals = {};
          for (const [key, sum] of Object.entries(allFilas[nf])) {
            vals[key] = String(sum);
          }
          resultado[tipo][nf] = vals;
        }
      }
      setConcentradoData(resultado);
      setShowConcentrado(true);
    } catch (e) { handleApiError(e, 'Error al cargar concentrado'); }
    finally { setConcentradoLoading(false); }
  };

  const handleOpenNewCarrera = () => { setEditCarreraId(null); setFormCarreraNombre(''); setShowFormCarrera(true); };
  const handleOpenEditCarrera = (c) => { setEditCarreraId(c.id); setFormCarreraNombre(c.nombre || ''); setShowFormCarrera(true); };

  const handleSaveCarrera = async (e) => {
    e.preventDefault(); setSavingCarrera(true);
    try { if (editCarreraId) { await api.put(`/api/university/estadisticos-docentes-carreras/${editCarreraId}`, { nombre: formCarreraNombre.trim() }); toast.success('Carrera actualizada'); } else { await api.post('/api/university/estadisticos-docentes-carreras', { hoja_id: selectedHoja.id, nombre: formCarreraNombre.trim() }); toast.success('Carrera creada'); } setShowFormCarrera(false); setEditCarreraId(null); fetchCarreras(selectedHoja.id); }
    catch (e) { handleApiError(e, 'Error'); } finally { setSavingCarrera(false); }
  };

  const handleDeleteCarrera = async (c) => {
    if (!window.confirm(`¿Eliminar "${c.nombre}"?\nSe eliminarán sus datos.`)) return;
    try { await api.delete(`/api/university/estadisticos-docentes-carreras/${c.id}`); toast.success('Carrera eliminada'); if (selectedCarrera?.id === c.id) setSelectedCarrera(null); fetchCarreras(selectedHoja.id); }
    catch (e) { handleApiError(e, 'Error'); }
  };

  const handleSelectCarrera = async (carrera) => {
    setSelectedCarrera(carrera); setEditingCelda(null);
    await cargarSecciones(carrera.id);
    fetchUsuariosCarrera(carrera.id);
  };

  const cargarSecciones = async (carreraId) => {
    setSeccionesLoading(true);
    try {
      const r = await api.get(`/api/university/estadisticos-docentes-secciones?carrera_id=${carreraId}`);
      const secs = r.data.data || [];
      setSecciones(secs);
      const fm = {};
      for (const sec of secs) {
        const fr = await api.get(`/api/university/estadisticos-docentes-filas?seccion_id=${sec.id}`);
        fm[sec.id] = (fr.data.data || []).map(f => {
          if (f.nombre_fila === 'Total Acumulado') return f;
          const cols = COLUMNAS_POR_TIPO[sec.tipo] || [];
          const vals = typeof f.valores === 'string' ? JSON.parse(f.valores) : (f.valores || {});
          let sumH = 0, sumM = 0;
          for (const c of cols) {
            if (isTotalKey(c.keys[0])) continue;
            sumH += parseNum(vals[c.keys[0]]);
            sumM += parseNum(vals[c.keys[1]]);
          }
          vals.total_h = String(sumH);
          vals.total_m = String(sumM);
          return { ...f, valores: vals };
        });
      }
      setFilasPorSeccion(fm);
    } catch (e) { handleApiError(e, 'Error'); } finally { setSeccionesLoading(false); }
  };

  const fetchUsuariosCarrera = async (carreraId) => { try { const [a, d] = await Promise.all([api.get(`/api/university/estadisticos-docentes-carreras/${carreraId}/usuarios`), api.get('/api/university/estadisticos-docentes-usuarios-disponibles')]); setUsuariosAsignados(a.data.data || []); setUsuariosDisponibles(d.data.data || []); } catch (e) { handleApiError(e, 'Error'); } };

  const toggleAsignarUsuario = (u) => { const k = `${u.id}_${u.tipo}`; setSelectedAsignar(p => { const n = new Set(p); if (n.has(k)) n.delete(k); else n.add(k); return n; }); };
  const handleConfirmarAsignacion = async () => { if (selectedAsignar.size === 0) { toast.error('Selecciona al menos uno'); return; } try { for (const k of selectedAsignar) { const [id, tipo] = k.split('_'); await api.post('/api/university/estadisticos-docentes-usuarios', { carrera_id: selectedCarrera.id, usuario_id: parseInt(id), usuario_tipo: tipo }); } toast.success(`${selectedAsignar.size} asignado(s)`); setShowAsignarUsuarios(false); setSelectedAsignar(new Set()); fetchUsuariosCarrera(selectedCarrera.id); } catch (e) { handleApiError(e, 'Error'); } };
  const handleQuitarUsuario = async (a) => { if (!window.confirm('¿Quitar usuario?')) return; try { await api.delete(`/api/university/estadisticos-docentes-usuarios/${a.asignacion_id}`); toast.success('Quitado'); fetchUsuariosCarrera(selectedCarrera.id); } catch (e) { handleApiError(e, 'Error'); } };
  const getUsuariosDisponibles = () => { const a = new Set(usuariosAsignados.map(u => `${u.usuario_id}_${u.usuario_tipo}`)); return usuariosDisponibles.filter(u => !a.has(`${u.id}_${u.tipo}`)); };

  const getValor = (fila, key) => { try { const v = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {}); return v[key] ?? ''; } catch { return ''; } };
  const startEditCelda = (fila, key, val) => { if (isTotalKey(key) || fila.nombre_fila === 'Total Acumulado') return; setEditingCelda({ filaId: fila.id, key }); setEditValue(val); setTimeout(() => inputRef.current?.focus(), 0); };

  const saveCelda = useCallback(async () => {
    if (!editingCelda) return;
    const { filaId, key } = editingCelda;
    try {
      await api.patch(`/api/university/estadisticos-docentes-filas/${filaId}/celda`, { key, value: editValue });
      setFilasPorSeccion(prev => {
        const next = { ...prev };
        for (const sid of Object.keys(next)) {
          const secMeta = secciones.find(s => s.id === parseInt(sid));
          const cols = COLUMNAS_POR_TIPO[secMeta?.tipo] || [];
          next[sid] = next[sid].map(f => {
            if (f.nombre_fila === 'Total Acumulado' || f.id !== filaId) return f;
            const vals = typeof f.valores === 'string' ? JSON.parse(f.valores) : (f.valores || {});
            vals[key] = editValue;
            return { ...f, valores: vals };
          });
          next[sid] = next[sid].map(f => {
            if (f.nombre_fila === 'Total Acumulado') return f;
            const vals = typeof f.valores === 'string' ? JSON.parse(f.valores) : (f.valores || {});
            let sumH = 0, sumM = 0;
            for (const c of cols) {
              if (isTotalKey(c.keys[0])) continue;
              sumH += parseNum(vals[c.keys[0]]);
              sumM += parseNum(vals[c.keys[1]]);
            }
            vals.total_h = String(sumH);
            vals.total_m = String(sumM);
            return { ...f, valores: vals };
          });
          next[sid] = next[sid].map(f => {
            if (f.nombre_fila === 'Total Acumulado') return f;
            const vals = typeof f.valores === 'string' ? JSON.parse(f.valores) : (f.valores || {});
            api.patch(`/api/university/estadisticos-docentes-filas/${f.id}/celda`, { key: 'total_h', value: vals.total_h }).catch(() => {});
            api.patch(`/api/university/estadisticos-docentes-filas/${f.id}/celda`, { key: 'total_m', value: vals.total_m }).catch(() => {});
            return f;
          });
          const ptc = next[sid].find(f => f.nombre_fila === 'PTC');
          const asig = next[sid].find(f => f.nombre_fila === 'Asignatura');
          if (ptc && asig) {
            const pv = typeof ptc.valores === 'string' ? JSON.parse(ptc.valores) : (ptc.valores || {});
            const av = typeof asig.valores === 'string' ? JSON.parse(asig.valores) : (asig.valores || {});
            const totalRow = next[sid].find(f => f.nombre_fila === 'Total Acumulado');
            if (totalRow) {
              const tv = typeof totalRow.valores === 'string' ? JSON.parse(totalRow.valores) : (totalRow.valores || {});
              for (const k of Object.keys(pv)) {
                tv[k] = String(parseNum(pv[k]) + parseNum(av[k]));
                api.patch(`/api/university/estadisticos-docentes-filas/${totalRow.id}/celda`, { key: k, value: tv[k] }).catch(() => {});
              }
            }
          }
        }
        return next;
      });
    } catch (e) { handleApiError(e, 'Error al guardar'); }
    setEditingCelda(null); setEditValue('');
  }, [editingCelda, editValue, secciones]);

  const handleCeldaKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); saveCelda(); } if (e.key === 'Escape') { setEditingCelda(null); setEditValue(''); } if (e.key === 'Tab') { e.preventDefault(); saveCelda(); } };

  const nombreHoja = (hoja) => [hoja.cuatrimestre, hoja.anio].filter(Boolean).join(' - ');

  // === CARRERA VIEW ===
  if (selectedCarrera) {
    return (
      <div className="tab-content estadisticos-docentes">
        <div className="tab-header">
          <div><h2>Datos Estadísticos - Docentes</h2><p className="text-muted" style={{ margin: 0 }}>{selectedCarrera.nombre} — {nombreHoja(selectedHoja)}</p></div>
          <div className="tab-actions"><button className="btn btn-secondary" onClick={() => setSelectedCarrera(null)}>← Volver a carreras</button></div>
        </div>
        {seccionesLoading ? <div className="loading" style={{ padding: '3rem', textAlign: 'center' }}>Cargando...</div>
          : <div className="ed-secciones-wrap">{secciones.map(sec => {
            const info = getInfoTipo(sec.tipo);
            const cols = COLUMNAS_POR_TIPO[sec.tipo] || [];
            const filas = filasPorSeccion[sec.id] || [];
            const ptc = filas.find(f => f.nombre_fila === 'PTC');
            const asig = filas.find(f => f.nombre_fila === 'Asignatura');
            const filasVisibles = [ptc, asig].filter(Boolean);
            const colsNormales = cols.filter(c => !isTotalKey(c.keys[0]));
            const colTotal = cols.find(c => isTotalKey(c.keys[0]));
            const totalRow = {};
            if (ptc && asig) {
              const pv = typeof ptc.valores === 'string' ? JSON.parse(ptc.valores) : (ptc.valores || {});
              const av = typeof asig.valores === 'string' ? JSON.parse(asig.valores) : (asig.valores || {});
              for (const k of Object.keys(pv)) totalRow[k] = String(parseNum(pv[k]) + parseNum(av[k]));
            }
            return (
              <div key={sec.id} className={`ed-panel ed-panel-${info.color}`}>
                <h2>{sec.nombre}</h2>
                <table className="ed-tabla">
                  <thead>
                    <tr><th></th>{cols.map(c => <th key={c.keys[0]} colSpan={2}>{c.label}</th>)}</tr>
                    <tr><th></th>{cols.map(c => <React.Fragment key={c.keys[0]}><th>H</th><th>M</th></React.Fragment>)}</tr>
                  </thead>
                  <tbody>
                    {filasVisibles.map(fila => (
                      <tr key={fila.id}>
                        <td className="ed-rowlabel">{fila.nombre_fila}</td>
                        {colsNormales.map(c => c.keys.map(key => {
                          const ck = `${fila.id}_${key}`;
                          const isEditing = editingCelda?.filaId === fila.id && editingCelda?.key === key;
                          const val = getValor(fila, key);
                          return <td key={ck} className="ed-celda-edit" onClick={() => !isEditing && startEditCelda(fila, key, val)}>
                            {isEditing ? <input ref={inputRef} type="number" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveCelda} onKeyDown={handleCeldaKeyDown} className="ed-input" />
                              : <span>{val || ''}</span>}
                          </td>;
                        }))}
                        {colTotal && colTotal.keys.map(key => (
                          <td key={`${fila.id}_${key}`} className="ed-celda-readonly">{getValor(fila, key) || ''}</td>
                        ))}
                      </tr>
                    ))}
                    {Object.keys(totalRow).length > 0 && (
                      <tr className="ed-total-row">
                        <td className="ed-rowlabel">Total</td>
                        {colsNormales.map(c => c.keys.map(key => (
                          <td key={`total_${key}`} className="ed-celda-readonly">{totalRow[key] || ''}</td>
                        )))}
                        {colTotal && colTotal.keys.map(key => (
                          <td key={`total_${key}`} className="ed-celda-readonly">{totalRow[key] || ''}</td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })}</div>}
        <div className="ed-usuarios-panel">
          <div className="ed-usuarios-header"><h3>Usuarios con acceso</h3>
            <button className="btn btn-outline btn-small" onClick={() => { setSelectedAsignar(new Set()); setShowAsignarUsuarios(true); }}>+ Asignar</button>
          </div>
          {usuariosAsignados.length === 0 ? <p className="text-muted" style={{ padding: '0.5rem 1rem', margin: 0 }}>Sin usuarios</p>
            : <div className="ed-usuarios-tags">{usuariosAsignados.map(u => (
              <span key={u.asignacion_id} className="ed-usuario-tag">{u.nombre} <small>({u.usuario_tipo === 'directivo' ? 'Directivo' : 'Personal'})</small>
                <button className="tag-remove" onClick={() => handleQuitarUsuario(u)}>×</button>
              </span>
            ))}</div>}
        </div>

        {globalNotas && <div className="ed-notas"><p>{globalNotas}</p></div>}

        {showAsignarUsuarios && (
          <div className="form-modal" onClick={() => setShowAsignarUsuarios(false)}>
            <div className="form-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="form-header"><h2>Asignar usuarios</h2><button className="close-btn" onClick={() => setShowAsignarUsuarios(false)}>×</button></div>
              <div className="asignar-modal-body">
                <div className="asignar-columnas">
                  <div className="asignar-seccion"><h4>Directivos</h4><div className="asignar-lista">
                    {getUsuariosDisponibles().filter(u => u.tipo === 'directivo').length === 0 ? <p className="text-muted">No hay</p>
                      : getUsuariosDisponibles().filter(u => u.tipo === 'directivo').map(u => { const k = `${u.id}_${u.tipo}`; return (
                        <button key={k} className={`asignar-btn-usuario${selectedAsignar.has(k) ? ' selected' : ''}`} onClick={() => toggleAsignarUsuario(u)}>
                          <span className="asignar-check">{selectedAsignar.has(k) ? '✓' : ''}</span>
                          <span className="asignar-usuario-nombre">{u.nombre}</span>
                          <span className="asignar-usuario-tipo">Directivo</span>
                        </button>); })}
                  </div></div>
                  <div className="asignar-divider-vertical"></div>
                  <div className="asignar-seccion"><h4>Personal</h4><div className="asignar-lista">
                    {getUsuariosDisponibles().filter(u => u.tipo === 'personal').length === 0 ? <p className="text-muted">No hay</p>
                      : getUsuariosDisponibles().filter(u => u.tipo === 'personal').map(u => { const k = `${u.id}_${u.tipo}`; return (
                        <button key={k} className={`asignar-btn-usuario${selectedAsignar.has(k) ? ' selected' : ''}`} onClick={() => toggleAsignarUsuario(u)}>
                          <span className="asignar-check">{selectedAsignar.has(k) ? '✓' : ''}</span>
                          <span className="asignar-usuario-nombre">{u.nombre}</span>
                          <span className="asignar-usuario-tipo">Personal</span>
                        </button>); })}
                  </div></div>
                </div>
                <div className="asignar-footer">
                  <span>{selectedAsignar.size} seleccionado(s)</span>
                  <div className="asignar-footer-actions">
                    <button className="btn btn-secondary" onClick={() => setShowAsignarUsuarios(false)}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleConfirmarAsignacion} disabled={selectedAsignar.size === 0}>Confirmar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // === HOJA VIEW (CARRERAS LIST) ===
  if (selectedHoja) {
    return (
      <div className="tab-content estadisticos-docentes">
        <div className="tab-header">
          <div><h2>Datos Estadísticos - Docentes</h2><p className="text-muted" style={{ margin: 0 }}>{nombreHoja(selectedHoja)}</p></div>
          <div className="tab-actions"><button className="btn btn-secondary" onClick={() => setSelectedHoja(null)}>← Volver</button></div>
        </div>
        <div className="ed-info-bar"><h3>Carreras</h3><p>Selecciona una carrera para ver sus datos.</p></div>
        {carrerasLoading ? <div className="loading" style={{ padding: '2rem' }}>Cargando...</div>
          : carreras.length === 0 ? <div className="ed-empty"><p>No hay carreras. Crea la primera.</p><button className="btn btn-primary" onClick={handleOpenNewCarrera}>+ Nueva Carrera</button></div>
            : <div className="ed-hojas-list">{carreras.map(c => (
              <div key={c.id} className="ed-hoja-card">
                <div className="ed-hoja-info"><h3>{c.nombre || 'Sin nombre'}</h3></div>
                <div className="ed-hoja-actions">
                  <button className="btn btn-success" onClick={() => handleSelectCarrera(c)}>Entrar</button>
                  <button className="btn btn-secondary btn-small" onClick={() => handleOpenEditCarrera(c)}>✏️</button>
                  <button className="btn btn-danger btn-small" onClick={() => handleDeleteCarrera(c)}>🗑️</button>
                </div>
              </div>
            ))}</div>}

        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleOpenNewCarrera}>+ Nueva Carrera</button>

        <button className="btn btn-outline" style={{ marginTop: '1rem', marginLeft: '0.5rem' }} onClick={() => cargarConcentrado(selectedHoja.id)} disabled={concentradoLoading}>
          {concentradoLoading ? 'Cargando...' : '📊 Ver concentrado'}
        </button>

        {globalNotas && <div className="ed-notas" style={{ marginTop: '1.5rem' }}><p>{globalNotas}</p></div>}

        {showFormCarrera && (
          <div className="form-modal" onClick={() => setShowFormCarrera(false)}>
            <div className="form-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
              <div className="form-header"><h2>{editCarreraId ? 'Editar Carrera' : 'Nueva Carrera'}</h2>
                <button className="close-btn" onClick={() => setShowFormCarrera(false)}>×</button>
              </div>
              <form onSubmit={handleSaveCarrera} style={{ padding: '20px 30px 30px' }}>
                <FormInput label="Nombre de la carrera *" name="carrera-nombre" value={formCarreraNombre}
                  onChange={e => setFormCarreraNombre(e.target.value)} placeholder="Ej: TSU OLCE" required />
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowFormCarrera(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={savingCarrera}>{savingCarrera ? 'Guardando...' : '💾 Guardar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  // === CONCENTRADO VIEW ===
  if (showConcentrado && concentradoData) {
    return (
      <div className="tab-content estadisticos-docentes">
        <div className="tab-header">
          <div><h2>Concentrado — {nombreHoja(selectedHoja)}</h2></div>
          <div className="tab-actions"><button className="btn btn-secondary" onClick={() => setShowConcentrado(false)}>← Volver</button></div>
        </div>
        <div className="ed-secciones-wrap">{TIPOS_SECCION.map(({ value: tipo, label, color }) => {
          const cols = COLUMNAS_POR_TIPO[tipo] || [];
          const colsNormales = cols.filter(c => !isTotalKey(c.keys[0]));
          const colTotal = cols.find(c => isTotalKey(c.keys[0]));
          const data = concentradoData[tipo];
          if (!data) return null;
          const ptcVals = data['PTC'] || {};
          const asigVals = data['Asignatura'] || {};
          const totalCalc = {};
          for (const k of Object.keys(ptcVals)) totalCalc[k] = String(parseNum(ptcVals[k]) + parseNum(asigVals[k]));
          return (
            <div key={tipo} className={`ed-panel ed-panel-${color}`}>
              <h2>{label}</h2>
              <table className="ed-tabla">
                <thead>
                  <tr><th></th>{cols.map(c => <th key={c.keys[0]} colSpan={2}>{c.label}</th>)}</tr>
                  <tr><th></th>{cols.map(c => <React.Fragment key={c.keys[0]}><th>H</th><th>M</th></React.Fragment>)}</tr>
                </thead>
                <tbody>
                  {['PTC', 'Asignatura'].map(nf => {
                    const vals = data[nf] || {};
                    return (
                      <tr key={nf}>
                        <td className="ed-rowlabel">{nf}</td>
                        {colsNormales.map(c => c.keys.map(key => <td key={key} className="">{vals[key] || ''}</td>))}
                        {colTotal && colTotal.keys.map(key => <td key={key} className="">{vals[key] || ''}</td>)}
                      </tr>
                    );
                  })}
                  {Object.keys(totalCalc).length > 0 && (
                    <tr className="ed-total-row">
                      <td className="ed-rowlabel">Total</td>
                      {colsNormales.map(c => c.keys.map(key => <td key={`tot_${key}`} className="ed-celda-readonly">{totalCalc[key] || ''}</td>))}
                      {colTotal && colTotal.keys.map(key => <td key={`tot_${key}`} className="ed-celda-readonly">{totalCalc[key] || ''}</td>)}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })}</div>
      </div>
    );
  }

  // === MAIN LIST VIEW ===
  return (
    <div className="tab-content estadisticos-docentes">
      <div className="tab-header">
        <h2>📊 Datos Estadísticos - Docentes</h2>
        <div className="tab-actions"><button className="btn btn-secondary" onClick={onClose}>← Volver al Dashboard</button>
          <button className="btn btn-primary" onClick={handleOpenNewHoja}>+ Nueva Hoja</button></div>
      </div>
      <div className="ed-info-bar"><h3>Datos Estadísticos - Docentes</h3><p>Selecciona un año y un cuatrimestre.</p></div>
      <div className="ed-anios-bar">{aniosDisponibles.length === 0 ? <span className="text-muted">Sin años</span>
        : <><span className="ed-anios-label">Años:</span><div className="ed-anios-lista">{aniosDisponibles.map(anio => (
          <button key={anio} className={`ed-anio-btn ${selectedAnio === anio ? 'active' : ''}`} onClick={() => handleSelectAnio(anio)}>{anio}</button>
        ))}</div></>}
      </div>
      {selectedAnio && (<>{loading ? <div className="loading" style={{ padding: '2rem' }}>Cargando...</div>
        : hojas.length === 0 ? <div className="ed-empty"><p>No hay hojas para {selectedAnio}</p><button className="btn btn-primary" onClick={handleOpenNewHoja}>Crear</button></div>
          : <div className="ed-hojas-list">{hojas.map(hoja => (
            <div key={hoja.id} className="ed-hoja-card">
              <div className="ed-hoja-info"><h3>{nombreHoja(hoja) || 'Sin nombre'}</h3></div>
              <div className="ed-hoja-actions">
                <button className="btn btn-success" onClick={() => handleSelectHoja(hoja)}>Entrar</button>
                <button className="btn btn-secondary btn-small" onClick={() => handleOpenEditHoja(hoja)}>✏️</button>
                <button className="btn btn-danger btn-small" onClick={() => handleDeleteHoja(hoja)}>🗑️</button>
              </div>
            </div>
          ))}</div>}
      </>)}
      <div className="ed-notas-editor" style={{ marginTop: '2rem' }}>
        <div className="ed-usuarios-header"><h3>Notas generales</h3>
          <button className="btn btn-outline btn-small" onClick={() => setEditingNotas(!editingNotas)}>{editingNotas ? 'Cancelar' : 'Editar'}</button>
        </div>
        {globalNotasLoading ? <div className="loading" style={{ padding: '1rem' }}>Cargando...</div>
          : editingNotas ? (
            <div style={{ padding: '1rem 1.25rem' }}>
              <textarea className="ed-notas-textarea" value={globalNotas} onChange={e => setGlobalNotas(e.target.value)} rows={4} />
              <div className="form-actions" style={{ marginTop: '0.5rem' }}>
                <button className="btn btn-primary btn-small" onClick={async () => { setGlobalNotasSaving(true); try { await api.put('/api/university/estadisticos-docentes-notas', { contenido: globalNotas }); toast.success('Notas guardadas'); setEditingNotas(false); } catch (e) { handleApiError(e, 'Error'); } finally { setGlobalNotasSaving(false); } }} disabled={globalNotasSaving}>{globalNotasSaving ? '...' : 'Guardar'}</button>
              </div>
            </div>
          ) : <p className="text-muted" style={{ padding: '0.5rem 1rem', margin: 0 }}>{globalNotas || 'Sin notas'}</p>}
      </div>
      {showFormHoja && (
        <div className="form-modal" onClick={() => setShowFormHoja(false)}>
          <div className="form-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="form-header"><h2>{editHojaId ? 'Editar Hoja' : 'Nueva Hoja'}</h2>
              <button className="close-btn" onClick={() => setShowFormHoja(false)}>×</button>
            </div>
            <form onSubmit={handleSaveHoja} style={{ padding: '20px 30px 30px' }}>
              <FormInput label="Cuatrimestre *" name="form-cuatrimestre" value={formCuatrimestre} onChange={e => setFormCuatrimestre(e.target.value)} placeholder="Ej: Enero - Abril" required />
              <FormInput label="Año *" name="form-anio" value={formAnio} onChange={e => setFormAnio(e.target.value)} placeholder="Ej: 2025" required />
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
