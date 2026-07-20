import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { ROUTES } from '../../constants/routes';
import '../../styles/EstadisticosGeneroPage.css';
import { handleApiError } from '../../utils/errorHandler';
import { toast } from 'react-toastify';

const EDITABLES = new Set(['grupos', 'cant_hombres', 'cant_mujeres', 'aprov_hombres', 'aprov_mujeres']);

const COLUMNAS = [
  { key: 'programa', label: 'Programa' },
  { key: 'grupos', label: 'Grupos' },
  { key: 'cant_total', label: 'Cantidad Total' },
  { key: 'cant_hombres', label: 'Cantidad Hombres' },
  { key: 'cant_mujeres', label: 'Cantidad Mujeres' },
  { key: 'aprov_hombres', label: 'Aprovechamiento Hombres' },
  { key: 'aprov_mujeres', label: 'Aprovechamiento Mujeres' },
  { key: 'aprov_total', label: 'Aprovechamiento Total' }
];

const parseNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

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
      if (anios.length > 0) setSelectedAnio(anios[0]);
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

  const getValor = (fila, key) => {
    try {
      const valores = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
      return valores[key] ?? '';
    } catch { return ''; }
  };

  const startEditCelda = (fila, key, currentValue) => {
    setEditingCelda({ filaId: fila.id, key });
    setEditValue(currentValue);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveCelda = useCallback(async () => {
    if (!editingCelda) return;
    const { filaId, key } = editingCelda;
    try {
      const filaActual = filas.find(f => f.id === filaId);
      const valsActual = filaActual ? (typeof filaActual.valores === 'string' ? JSON.parse(filaActual.valores) : (filaActual.valores || {})) : {};
      const conTotales = computeTotals({ ...valsActual, [key]: editValue });
      const updates = { [key]: editValue };
      for (const k of ['cant_total', 'aprov_total']) {
        if (conTotales[k] !== (valsActual[k] ?? '')) {
          updates[k] = conTotales[k];
        }
      }
      for (const [k, v] of Object.entries(updates)) {
        await api.patch(`/api/university/estadisticos-genero-filas/${filaId}/celda`, { key: k, value: v });
      }
      setFilas(prev => prev.map(f => {
        if (f.id !== filaId) return f;
        const valores = typeof f.valores === 'string' ? JSON.parse(f.valores) : (f.valores || {});
        for (const [k, v] of Object.entries(updates)) valores[k] = v;
        return { ...f, valores };
      }));
    } catch (error) {
      handleApiError(error, 'Error al guardar');
    }
    setEditingCelda(null);
    setEditValue('');
  }, [editingCelda, editValue, filas]);

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

  if (selectedHoja) {
    return (
      <div className="eg-page-container">
        <div className="eg-page-header">
          <button className="btn btn-secondary" onClick={() => { setSelectedHoja(null); setFilas([]); setEditingCelda(null); }}>← Volver</button>
          <div>
            <h2>Información Estadística por Género</h2>
            <p className="text-muted">{selectedHoja.cuatrimestre} - {selectedHoja.anio}</p>
          </div>
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
                {filas.map((fila, index) => (
                  <tr key={fila.id}>
                    {['programa', 'grupos', 'cant_total', 'cant_hombres', 'cant_mujeres', 'aprov_hombres', 'aprov_mujeres', 'aprov_total'].map(key => {
                      const cellKey = `${fila.id}_${key}`;
                      const isEditing = editingCelda?.filaId === fila.id && editingCelda?.key === key;
                      const val = getValor(fila, key);
                      const editable = EDITABLES.has(key);
                      const readonly = !editable;

                      if (readonly) {
                        return <td key={cellKey} className="celda-readonly"><span>{val}</span></td>;
                      }

                      return (
                        <td
                          key={cellKey}
                          className="editable-cell"
                          onClick={() => !isEditing && startEditCelda(fila, key, val)}
                        >
                          {isEditing ? (
                            <input
                              ref={inputRef}
                              type={getTipo(key) === 'decimal' ? 'number' : getTipo(key) === 'numero' ? 'number' : 'text'}
                              step={getTipo(key) === 'decimal' ? '0.01' : undefined}
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
                    {['programa', 'grupos', 'cant_total', 'cant_hombres', 'cant_mujeres', 'aprov_hombres', 'aprov_mujeres', 'aprov_total'].map(key => {
                      const tg = computeTotalesGenerales(filas, getValor);
                      return <td key={key} className="celda-total">{tg[key] ?? ''}</td>;
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>

        <div className="eg-page-nav">
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
        <h2>Información Estadística por Género</h2>
        <p className="text-muted">Selecciona un año y una hoja para ver la información.</p>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: '3rem', textAlign: 'center' }}>Cargando...</div>
      ) : misHojas.length === 0 ? (
        <p className="text-muted" style={{ padding: '3rem', textAlign: 'center' }}>No tienes hojas asignadas.</p>
      ) : (
        <>
          <div className="eg-page-anios">
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
                <h3>{hoja.cuatrimestre || 'Sin nombre'}</h3>
                <p>{hoja.anio}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default EstadisticosGeneroPage;
