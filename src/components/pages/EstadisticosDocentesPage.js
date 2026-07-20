import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api';
import '../../styles/EstadisticosDocentesPage.css';
import { handleApiError } from '../../utils/errorHandler';

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

const parseNum = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const getInfoTipo = (tipo) => TIPOS_SECCION.find(t => t.value === tipo) || { label: tipo, color: 'gray' };

const EstadisticosDocentesPage = ({ user }) => {
  const [misHojas, setMisHojas] = useState([]);
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [selectedAnio, setSelectedAnio] = useState(null);
  const [selectedHoja, setSelectedHoja] = useState(null);
  const [loading, setLoading] = useState(true);

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
    try {
      const r = await api.get(`/api/university/estadisticos-docentes-mis-hojas?usuario_id=${user.id}&usuario_tipo=${user.tipo}`);
      const h = r.data.data || [];
      setMisHojas(h);
      const anios = [...new Set(h.map(x => x.anio).filter(Boolean))].sort((a, b) => b - a);
      setAniosDisponibles(anios);
      if (anios.length > 0) setSelectedAnio(anios[0]);
    } catch (e) { handleApiError(e, 'Error al cargar'); } finally { setLoading(false); }
  };

  const cargarSecciones = async (hojaId) => {
    setSeccionesLoading(true);
    try {
      const r = await api.get(`/api/university/estadisticos-docentes-secciones?hoja_id=${hojaId}`);
      const secs = r.data.data || [];
      setSecciones(secs);
      const fm = {};
      for (const sec of secs) {
        const fr = await api.get(`/api/university/estadisticos-docentes-filas?seccion_id=${sec.id}`);
        fm[sec.id] = fr.data.data || [];
      }
      setFilasPorSeccion(fm);
    } catch (e) { handleApiError(e, 'Error al cargar'); } finally { setSeccionesLoading(false); }
  };

  const handleSelectHoja = (hoja) => {
    setSelectedHoja(hoja); setEditingCelda(null); cargarSecciones(hoja.id);
    api.get('/api/university/estadisticos-docentes-notas').then(r => setGlobalNotas(r.data.data?.contenido || '')).catch(() => {});
  };

  const getValor = (fila, key) => { try { const v = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {}); return v[key] ?? ''; } catch { return ''; } };

  const startEditCelda = (fila, key, val) => {
    if (fila.nombre_fila === 'Total Acumulado') return;
    setEditingCelda({ filaId: fila.id, key });
    setEditValue(val);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveCelda = useCallback(async () => {
    if (!editingCelda) return;
    const { filaId, key } = editingCelda;
    try {
      await api.patch(`/api/university/estadisticos-docentes-filas/${filaId}/celda`, { key, value: editValue });
      setFilasPorSeccion(prev => {
        const next = { ...prev };
        for (const sid of Object.keys(next)) {
          next[sid] = next[sid].map(f => {
            if (f.id !== filaId) return f;
            const vals = typeof f.valores === 'string' ? JSON.parse(f.valores) : (f.valores || {});
            vals[key] = editValue;
            return { ...f, valores: vals };
          });
          const ptc = next[sid].find(f => f.nombre_fila === 'PTC');
          const asig = next[sid].find(f => f.nombre_fila === 'Asignatura');
          const total = next[sid].find(f => f.nombre_fila === 'Total Acumulado');
          if (ptc && asig && total) {
            const pv = typeof ptc.valores === 'string' ? JSON.parse(ptc.valores) : (ptc.valores || {});
            const av = typeof asig.valores === 'string' ? JSON.parse(asig.valores) : (asig.valores || {});
            const tv = {};
            const ks = [...new Set([...Object.keys(pv), ...Object.keys(av)])];
            for (const k of ks) tv[k] = String(parseNum(pv[k]) + parseNum(av[k]));
            next[sid] = next[sid].map(f => {
              if (f.nombre_fila !== 'Total Acumulado') return f;
              const vals = typeof f.valores === 'string' ? JSON.parse(f.valores) : (f.valores || {});
              for (const [k, v] of Object.entries(tv)) vals[k] = v;
              return { ...f, valores: vals };
            });
            const tf = next[sid].find(f => f.nombre_fila === 'Total Acumulado');
            if (tf) for (const [k, v] of Object.entries(tv)) api.patch(`/api/university/estadisticos-docentes-filas/${tf.id}/celda`, { key: k, value: v }).catch(() => {});
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

  const hojasFiltradas = misHojas.filter(h => !selectedAnio || h.anio === selectedAnio);

  if (selectedHoja) {
    return (
      <div className="edp-container">
        <div className="edp-header">
          <button className="btn btn-secondary" onClick={() => { setSelectedHoja(null); setSecciones([]); setEditingCelda(null); }}>← Volver</button>
          <div><h2>Datos Estadísticos - Docentes</h2><p className="text-muted">{selectedHoja.cuatrimestre} - {selectedHoja.anio}</p></div>
        </div>
        {seccionesLoading ? <div className="loading" style={{ padding: '3rem', textAlign: 'center' }}>Cargando...</div>
          : <div className="edp-secciones">{secciones.map(sec => {
            const info = getInfoTipo(sec.tipo);
            const cols = COLUMNAS_POR_TIPO[sec.tipo] || [];
            const filas = filasPorSeccion[sec.id] || [];
            const total = filas.find(f => f.nombre_fila === 'Total Acumulado');
            const ptc = filas.find(f => f.nombre_fila === 'PTC');
            const asig = filas.find(f => f.nombre_fila === 'Asignatura');
            return (
              <div key={sec.id} className={`edp-panel edp-panel-${info.color}`}>
                <h2>{sec.nombre}</h2>
                <table className="edp-tabla">
                  <thead>
                    <tr><th></th>{cols.map(c => <th key={c.keys[0]} colSpan={2}>{c.label}</th>)}</tr>
                    <tr><th></th>{cols.map(c => <React.Fragment key={c.keys[0]}><th>H</th><th>M</th></React.Fragment>)}</tr>
                  </thead>
                  <tbody>
                    {[total, ptc, asig].filter(Boolean).map(fila => {
                      const esTotal = fila.nombre_fila === 'Total Acumulado';
                      return (
                        <tr key={fila.id} className={esTotal ? 'edp-total-row' : ''}>
                          <td className="edp-rowlabel">{fila.nombre_fila}</td>
                          {cols.map(c => c.keys.map(key => {
                            const ck = `${fila.id}_${key}`;
                            const isEditing = editingCelda?.filaId === fila.id && editingCelda?.key === key;
                            const val = getValor(fila, key);
                            if (esTotal) return <td key={ck} className="edp-readonly">{val || ''}</td>;
                            return (
                              <td key={ck} className="edp-edit" onClick={() => !isEditing && startEditCelda(fila, key, val)}>
                                {isEditing ? <input ref={inputRef} type="number" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveCelda} onKeyDown={handleCeldaKeyDown} className="edp-input" />
                                  : <span>{val || ''}</span>}
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
          })}</div>}
        {globalNotas && <div className="edp-notas"><p>{globalNotas}</p></div>}
        <div className="edp-nav">{hojasFiltradas.map(hoja => (
          <button key={hoja.id} className={`edp-nav-btn ${selectedHoja.id === hoja.id ? 'active' : ''}`} onClick={() => handleSelectHoja(hoja)}>
            {hoja.cuatrimestre || 'Sin nombre'}</button>
        ))}</div>
      </div>
    );
  }

  return (
    <div className="edp-container">
      <div className="edp-header"><h2>Datos Estadísticos - Docentes</h2><p className="text-muted">Selecciona un año y una hoja.</p></div>
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
