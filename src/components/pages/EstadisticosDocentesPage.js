import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api';
import '../../styles/EstadisticosDocentesPage.css';
import { handleApiError } from '../../utils/errorHandler';

const TIPOS_SECCION = [
  { value: 'ultimo_grado', label: 'Último grado de estudios', color: 'green' },
  { value: 'solo_utma', label: 'EXPERIENCIA DOCENTE Y LABORAL (SOLO EN LA UTMA)', color: 'blue' },
  { value: 'laboral', label: 'EXPERIENCIA DOCENTE Y LABORAL EN GENERAL (INCLUYENDO LA UTMA)', color: 'blue' },
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

const getInfoTipo = (tipo) => TIPOS_SECCION.find(t => t.value === tipo) || { label: tipo, color: 'gray' };

const parseNum = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

const isTotalKey = (key) => key === 'total_h' || key === 'total_m';

const EstadisticosDocentesPage = ({ user }) => {
  const [misHojas, setMisHojas] = useState([]);
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [selectedAnio, setSelectedAnio] = useState(null);
  const [selectedHoja, setSelectedHoja] = useState(null);
  const [loading, setLoading] = useState(true);

  const [carreras, setCarreras] = useState([]);
  const [carrerasLoading, setCarrerasLoading] = useState(false);
  const [selectedCarrera, setSelectedCarrera] = useState(null);

  const [secciones, setSecciones] = useState([]);
  const [filasPorSeccion, setFilasPorSeccion] = useState({});
  const [seccionesLoading, setSeccionesLoading] = useState(false);
  const [globalNotas, setGlobalNotas] = useState('');

  const [editingCelda, setEditingCelda] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { fetchMisHojas(); }, []);

  const fetchMisHojas = async () => {
    setLoading(true);
    try { const r = await api.get(`/api/university/estadisticos-docentes-mis-hojas?usuario_id=${user.id}&usuario_tipo=${user.tipo}`); const h = r.data.data || []; setMisHojas(h); const anios = [...new Set(h.map(x => x.anio).filter(Boolean))].sort((a, b) => b - a); setAniosDisponibles(anios); if (anios.length > 0) setSelectedAnio(anios[0]); }
    catch (e) { handleApiError(e, 'Error'); } finally { setLoading(false); }
  };

  const handleSelectHoja = async (hoja) => {
    setSelectedHoja(hoja); setSelectedCarrera(null); setEditingCelda(null);
    fetchCarreras(hoja.id);
    api.get('/api/university/estadisticos-docentes-notas').then(r => setGlobalNotas(r.data.data?.contenido || '')).catch(() => {});
  };

  const fetchCarreras = async (hojaId) => {
    setCarrerasLoading(true);
    try { const r = await api.get(`/api/university/estadisticos-docentes-carreras?hoja_id=${hojaId}`); setCarreras(r.data.data || []); }
    catch (e) { handleApiError(e, 'Error'); } finally { setCarrerasLoading(false); }
  };

  const handleSelectCarrera = async (carrera) => {
    setSelectedCarrera(carrera); setEditingCelda(null);
    await cargarSecciones(carrera.id);
  };

  const cargarSecciones = async (carreraId) => {
    setSeccionesLoading(true);
    try {
      const r = await api.get(`/api/university/estadisticos-docentes-secciones?carrera_id=${carreraId}`);
      const secs = r.data.data || []; setSecciones(secs);
      const fm = {};
      for (const sec of secs) { const fr = await api.get(`/api/university/estadisticos-docentes-filas?seccion_id=${sec.id}`); fm[sec.id] = fr.data.data || []; }
      for (const sid of Object.keys(fm)) {
        const secMeta = secs.find(s => s.id === parseInt(sid));
        const cols = COLUMNAS_POR_TIPO[secMeta?.tipo] || [];
        fm[sid] = fm[sid].map(f => {
          if (f.nombre_fila === 'Total Acumulado') return f;
          const vals = typeof f.valores === 'string' ? JSON.parse(f.valores) : (f.valores || {});
          const sumH = cols.filter(c => !isTotalKey(c.keys[0])).reduce((acc, c) => acc + parseNum(vals[c.keys[0]]), 0);
          const sumM = cols.filter(c => !isTotalKey(c.keys[0])).reduce((acc, c) => acc + parseNum(vals[c.keys[1]]), 0);
          vals.total_h = String(sumH);
          vals.total_m = String(sumM);
          return { ...f, valores: vals };
        });
      }
      setFilasPorSeccion(fm);
    } catch (e) { handleApiError(e, 'Error'); } finally { setSeccionesLoading(false); }
  };

  const getValor = (fila, key) => { try { const v = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {}); return v[key] ?? ''; } catch { return ''; } };

  const startEditCelda = (fila, key, val) => { if (isTotalKey(key)) return; setEditingCelda({ filaId: fila.id, key }); setEditValue(val); setTimeout(() => inputRef.current?.focus(), 0); };

  const actualizarTotalesFila = (fila, cols) => {
    const vals = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
    let sumH = 0, sumM = 0;
    for (const c of cols) {
      if (isTotalKey(c.keys[0])) continue;
      sumH += parseNum(vals[c.keys[0]]);
      sumM += parseNum(vals[c.keys[1]]);
    }
    vals.total_h = String(sumH);
    vals.total_m = String(sumM);
    return { ...fila, valores: vals };
  };

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
            return actualizarTotalesFila(f, cols);
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
            for (const k of Object.keys(pv)) {
              const sum = String(parseNum(pv[k]) + parseNum(av[k]));
              const totalRow = next[sid].find(f => f.nombre_fila === 'Total Acumulado');
              if (totalRow) {
                const tv = typeof totalRow.valores === 'string' ? JSON.parse(totalRow.valores) : (totalRow.valores || {});
                tv[k] = sum;
                api.patch(`/api/university/estadisticos-docentes-filas/${totalRow.id}/celda`, { key: k, value: sum }).catch(() => {});
              }
            }
          }
        }
        return next;
      });
    } catch (e) { handleApiError(e, 'Error'); }
    setEditingCelda(null); setEditValue('');
  }, [editingCelda, editValue, secciones]);

  const handleCeldaKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); saveCelda(); } if (e.key === 'Escape') { setEditingCelda(null); setEditValue(''); } if (e.key === 'Tab') { e.preventDefault(); saveCelda(); } };

  const hojasFiltradas = misHojas.filter(h => !selectedAnio || h.anio === selectedAnio);

  if (selectedCarrera) {
    return (
      <div className="edp-container">
        <div className="edp-header">
          <button className="btn btn-secondary" onClick={() => { setSelectedCarrera(null); setSecciones([]); setEditingCelda(null); }}>← Volver</button>
          <div><h2>{selectedCarrera.nombre}</h2><p className="text-muted">{selectedHoja.cuatrimestre} - {selectedHoja.anio}</p></div>
        </div>
        {seccionesLoading ? <div className="loading" style={{ padding: '3rem', textAlign: 'center' }}>Cargando...</div>
          : <div className="edp-secciones">{secciones.map(sec => {
            const info = getInfoTipo(sec.tipo); const cols = COLUMNAS_POR_TIPO[sec.tipo] || [];
            const filas = filasPorSeccion[sec.id] || [];
            const ptc = filas.find(f => f.nombre_fila === 'PTC');
            const asig = filas.find(f => f.nombre_fila === 'Asignatura');
            const filasVisibles = [ptc, asig].filter(Boolean);
            const totalRow = {};
            if (ptc && asig) {
              const pv = typeof ptc.valores === 'string' ? JSON.parse(ptc.valores) : (ptc.valores || {});
              const av = typeof asig.valores === 'string' ? JSON.parse(asig.valores) : (asig.valores || {});
              const allKeys = [...new Set([...Object.keys(pv), ...Object.keys(av)])];
              for (const k of allKeys) totalRow[k] = String(parseNum(pv[k]) + parseNum(av[k]));
            }
            return (
              <div key={sec.id} className={`edp-panel edp-panel-${info.color}`}>
                <h2>{getInfoTipo(sec.tipo).label}</h2>
                <table className="edp-tabla">
                  <thead>
                    <tr><th></th>{cols.map(c => <th key={c.keys[0]} colSpan={2}>{c.label}</th>)}</tr>
                    <tr><th></th>{cols.map(c => <React.Fragment key={c.keys[0]}><th>H</th><th>M</th></React.Fragment>)}</tr>
                  </thead>
                  <tbody>
                    {filasVisibles.map(fila => {
                      const colsNormales = cols.filter(c => !isTotalKey(c.keys[0]));
                      const colTotal = cols.find(c => isTotalKey(c.keys[0]));
                      return (
                      <tr key={fila.id}>
                        <td className="edp-rowlabel">{fila.nombre_fila}</td>
                        {colsNormales.map(c => c.keys.map(key => {
                          const ck = `${fila.id}_${key}`;
                          const isEditing = editingCelda?.filaId === fila.id && editingCelda?.key === key;
                          const val = getValor(fila, key);
                          return <td key={ck} className="edp-edit" onClick={() => !isEditing && startEditCelda(fila, key, val)}>
                            {isEditing ? <input ref={inputRef} type="number" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveCelda} onKeyDown={handleCeldaKeyDown} className="edp-input" />
                              : <span>{val || ''}</span>}
                          </td>;
                        }))}
                        {colTotal && colTotal.keys.map(key => (
                          <td key={`${fila.id}_${key}`} className="edp-readonly">{getValor(fila, key) || ''}</td>
                        ))}
                      </tr>
                    );})}
                    {Object.keys(totalRow).length > 0 && (
                      <tr className="edp-total-row">
                        <td className="edp-rowlabel">Total</td>
                        {cols.filter(c => !isTotalKey(c.keys[0])).map(c => c.keys.map(key => {
                          return <td key={`total_${key}`} className="edp-readonly">{totalRow[key] || ''}</td>;
                        }))}
                        {cols.filter(c => isTotalKey(c.keys[0])).map(c => c.keys.map(key => {
                          return <td key={`total_${key}`} className="edp-readonly">{totalRow[key] || ''}</td>;
                        }))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })}</div>}
        {globalNotas && <div className="edp-notas"><p>{globalNotas}</p></div>}
      </div>
    );
  }

  if (selectedHoja) {
    return (
      <div className="edp-container">
        <div className="edp-header">
          <button className="btn btn-secondary" onClick={() => { setSelectedHoja(null); setCarreras([]); }}>← Volver</button>
          <div><h2>{selectedHoja.cuatrimestre} - {selectedHoja.anio}</h2><p className="text-muted">Carreras</p></div>
        </div>
        {carrerasLoading ? <div className="loading" style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>
          : carreras.length === 0 ? <p className="text-muted" style={{ padding: '3rem', textAlign: 'center' }}>Sin carreras disponibles.</p>
            : <div className="edp-hojas">{carreras.map(c => (
              <div key={c.id} className="edp-hoja-card" onClick={() => handleSelectCarrera(c)}>
                <h3>{c.nombre || 'Sin nombre'}</h3>
              </div>
            ))}</div>}
        {globalNotas && <div className="edp-notas" style={{ marginTop: '1.5rem' }}><p>{globalNotas}</p></div>}
      </div>
    );
  }

  return (
    <div className="edp-container">
      <div className="edp-header"><h2>Datos Estadísticos - Docentes</h2><p className="text-muted">Selecciona un año y un cuatrimestre.</p></div>
      {loading ? <div className="loading" style={{ padding: '3rem', textAlign: 'center' }}>Cargando...</div>
        : misHojas.length === 0 ? <p className="text-muted" style={{ padding: '3rem', textAlign: 'center' }}>No tienes hojas asignadas.</p>
          : <><div className="edp-anios">{aniosDisponibles.map(anio => (
            <button key={anio} className={`edp-anio-btn ${selectedAnio === anio ? 'active' : ''}`} onClick={() => setSelectedAnio(anio)}>{anio}</button>
          ))}</div>
          <div className="edp-hojas">{hojasFiltradas.map(hoja => (
            <div key={hoja.id} className="edp-hoja-card" onClick={() => handleSelectHoja(hoja)}>
              <h3>{hoja.cuatrimestre || 'Sin nombre'}</h3><p>{hoja.anio}</p>
            </div>
          ))}</div></>}
    </div>
  );
};

export default EstadisticosDocentesPage;
