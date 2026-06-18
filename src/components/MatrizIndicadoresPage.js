import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import '../styles/MatrizIndicadoresPage.css';

const API_URL = 'https://api1.strideutmat.com';

const COLUMNAS_RESULTADO = [
  '1er Cuatrimestre',
  '2do Cuatrimestre',
  '3er Cuatrimestre',
  'Anual'
];

const OPCIONES_UNIDAD = ['Numero Absoluto', 'Porcentaje', 'Moneda'];

const MatrizIndicadoresPage = ({ user }) => {
  const { seccionId } = useParams();
  const navigate = useNavigate();

  const isSuperAdmin = user?.tipo === 'superadmin';

  const [seccion, setSeccion] = useState(null);
  const [encabezado, setEncabezado] = useState(null);
  const [columnas, setColumnas] = useState([]);
  const [filas, setFilas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalFila, setModalFila] = useState(null);
  const [modalKey, setModalKey] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  const columnasActivas = columnas.filter(c => c.activa !== 0);
  const totalColumnas = columnasActivas.length + COLUMNAS_RESULTADO.length;

  const colUnidadIndex = columnasActivas.findIndex(
    c => c.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'unidad de medida'
  );
  const colUnidad = colUnidadIndex >= 0 ? columnasActivas[colUnidadIndex] : null;

  const getUnidadMedida = (fila) => {
    if (!colUnidad) return null;
    return getValor(fila, `d_${colUnidad.id}`);
  };

  const getValor = (fila, key) => {
    try {
      const valores = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
      return valores[key] || '';
    } catch {
      return '';
    }
  };

  const formatNumero = (raw, unidad) => {
    if (!raw || raw === '') return '';
    if (unidad === 'Porcentaje') return `${raw}%`;
    if (unidad === 'Moneda') return `$${raw}`;
    return raw;
  };

  const parseNumero = (str) => {
    if (!str) return NaN;
    const cleaned = str.replace(/[$%]/g, '').trim();
    return parseFloat(cleaned);
  };

  const calcularAnual = (fila) => {
    const unidad = getUnidadMedida(fila);
    if (!unidad) return '';

    const v0 = parseNumero(getValor(fila, 'f_0'));
    const v1 = parseNumero(getValor(fila, 'f_1'));
    const v2 = parseNumero(getValor(fila, 'f_2'));

    const valores = [v0, v1, v2].filter(v => !isNaN(v));
    if (valores.length === 0) return '';

    let resultado;
    if (unidad === 'Moneda') {
      resultado = valores.reduce((a, b) => a + b, 0);
    } else {
      resultado = valores.reduce((a, b) => a + b, 0) / valores.length;
    }

    const numStr = resultado % 1 === 0 ? resultado.toString() : resultado.toFixed(2);
    if (unidad === 'Porcentaje') return `${numStr}%`;
    if (unidad === 'Moneda') return `$${numStr}`;
    return numStr;
  };

  const setValorEnFila = (fila, key, value) => {
    const valores = typeof fila.valores === 'string' ? JSON.parse(fila.valores) : (fila.valores || {});
    valores[key] = value;
    return valores;
  };

  const saveFila = async (fila, valores) => {
    const res = await axios.put(`${API_URL}/api/university/matriz-filas/${fila.id}`, { valores });
    setFilas(prev => prev.map(f => f.id === fila.id ? res.data.data : f));
    return res.data.data;
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [secRes, encRes, colRes, filasRes] = await Promise.all([
        axios.get(`${API_URL}/api/university/matriz-secciones`),
        axios.get(`${API_URL}/api/university/matriz-encabezado`),
        axios.get(`${API_URL}/api/university/matriz-columnas`),
        axios.get(`${API_URL}/api/university/matriz-filas/${seccionId}`)
      ]);

      const found = (secRes.data.data || []).find(s => s.id === parseInt(seccionId));
      setSeccion(found || null);
      setEncabezado(encRes.data.data || null);
      setColumnas(colRes.data.data || []);
      setFilas(filasRes.data.data || []);
    } catch (error) {
      toast.error('Error al cargar datos de la matriz');
    } finally {
      setLoading(false);
    }
  }, [seccionId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const socket = io(API_URL);
    socket.on('matriz-update', () => {
      fetchAll();
    });
    return () => { socket.disconnect(); };
  }, [fetchAll]);

  const handleUnidadChange = async (fila, value) => {
    const valores = setValorEnFila(fila, `d_${colUnidad.id}`, value);
    try {
      const updated = await saveFila(fila, valores);
      const anual = calcularAnual(updated);
      if (anual !== '') {
        const valsConAnual = setValorEnFila(updated, 'f_3', anual);
        await saveFila(updated, valsConAnual);
      }
      toast.success('Unidad de medida actualizada');
    } catch (error) {
      toast.error('Error al guardar unidad de medida');
    }
  };

  const openModal = (fila, key) => {
    let valor = getValor(fila, key);
    if (key.startsWith('f_') && key !== 'f_3') {
      const raw = parseNumero(valor);
      valor = isNaN(raw) ? '' : raw.toString();
    }
    setModalFila(fila);
    setModalKey(key);
    setModalValue(valor);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalFila(null);
    setModalKey('');
    setModalValue('');
  };

  const handleSaveModal = async () => {
    if (!modalFila) return;
    if ((modalKey === 'f_0' || modalKey === 'f_1' || modalKey === 'f_2') && modalValue) {
      const unidad = getUnidadMedida(modalFila);
      const num = parseFloat(modalValue);
      if (unidad === 'Porcentaje' && !isNaN(num) && num > 100) {
        toast.error('El valor no puede ser mayor a 100 en porcentaje');
        return;
      }
    }
    setModalSaving(true);
    try {
      const valores = setValorEnFila(modalFila, modalKey, modalValue);
      const updated = await saveFila(modalFila, valores);

      if (modalKey === 'f_0' || modalKey === 'f_1' || modalKey === 'f_2') {
        const anual = calcularAnual(updated);
        if (anual !== '') {
          const valsConAnual = setValorEnFila(updated, 'f_3', anual);
          await saveFila(updated, valsConAnual);
        }
      }

      closeModal();
      toast.success('Celda guardada');
    } catch (error) {
      toast.error('Error al guardar celda');
    } finally {
      setModalSaving(false);
    }
  };

  const handleAddFila = async () => {
    setAdding(true);
    try {
      const res = await axios.post(`${API_URL}/api/university/matriz-filas`, {
        seccion_id: parseInt(seccionId),
        valores: {}
      });
      setFilas(prev => [...prev, res.data.data]);
      toast.success('Fila agregada');
    } catch (error) {
      toast.error('Error al agregar fila');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteFila = async (fila) => {
    if (!window.confirm('¿Eliminar esta fila?')) return;
    try {
      await axios.delete(`${API_URL}/api/university/matriz-filas/${fila.id}`);
      setFilas(prev => prev.filter(f => f.id !== fila.id));
      toast.success('Fila eliminada');
    } catch (error) {
      toast.error('Error al eliminar fila');
    }
  };

  const goBack = () => {
    if (user?.tipo === 'superadmin') navigate('/admin/dashboard', { state: { tab: 'matriz' } });
    else if (user?.tipo === 'directivo') navigate('/directivo/dashboard');
    else navigate('/personal/dashboard');
  };

  if (loading) {
    return (
      <div className="matriz-page-container">
        <div className="loading">Cargando matriz de indicadores...</div>
      </div>
    );
  }

  if (!seccion) {
    return (
      <div className="matriz-page-container">
        <div className="no-data">
          <p>Sección no encontrada</p>
          <button className="btn btn-secondary" onClick={goBack}>← Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="matriz-page-container">
      <div className="matriz-page-toolbar">
        <button className="btn btn-secondary" onClick={goBack}>← Volver</button>
        <span className="matriz-page-seccion">{seccion.nombre}</span>
        {isSuperAdmin && !encabezado?.bloqueo_filas && (
          <button className="btn btn-primary" onClick={handleAddFila} disabled={adding}>+ Agregar fila</button>
        )}
      </div>

      <div className="wrapper">
        <div className="header-row">
          <div className="logo-cell">Logo</div>
          <div className="title-cell">MATRIZ DE INDICADORES</div>
          <div className="ficha-cell">
            <div className="ficha-row">
              <div className="ficha-label">Código</div>
              <div className="ficha-value">{encabezado?.codigo || ''}</div>
            </div>
            <div className="ficha-row">
              <div className="ficha-label">Revisión</div>
              <div className="ficha-value">{encabezado?.revision || ''}</div>
            </div>
            <div className="ficha-row">
              <div className="ficha-label">Fecha de actualización</div>
              <div className="ficha-value">{encabezado?.fecha_actualizacion || ''}</div>
            </div>
          </div>
        </div>

        <div className="meta-row">
          <div className="meta-cell"><span>Fecha de revisión de indicadores:</span> {encabezado?.fecha_revision_indicadores || ''}</div>
          <div className="meta-cell"><span>Responsable de la matriz:</span> {encabezado?.responsable || ''}</div>
          <div className="meta-cell"><span>Año:</span> {encabezado?.anio || ''}</div>
        </div>

        <div className="resultados-banner">RESULTADOS</div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {columnasActivas.map((col) => (
                  <th key={col.id}>{col.nombre}</th>
                ))}
                {COLUMNAS_RESULTADO.map((col, i) => (
                  <th key={i} className={col === 'Anual' ? 'anual' : 'resultado'}>{col}</th>
                ))}
                {isSuperAdmin && !encabezado?.bloqueo_filas && <th className="th-acciones">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 ? (
                <tr>
                  <td colSpan={totalColumnas + (isSuperAdmin && !encabezado?.bloqueo_filas ? 1 : 0)} className="td-empty">
                    Sin filas registradas. {isSuperAdmin && !encabezado?.bloqueo_filas ? 'Haz clic en "+ Agregar fila"' : ''}
                  </td>
                </tr>
              ) : (
                filas.map((fila) => (
                  <tr key={fila.id}>
                    {columnasActivas.map((col, idx) => {
                      const key = `d_${col.id}`;
                      const colBloqueada = col.bloqueada;
                      const puedeEditarCol = isSuperAdmin && !colBloqueada;
                      if (colUnidad && idx === colUnidadIndex) {
                        return (
                          <td key={col.id} className="cell-td">
                            <select
                              className="cell-select"
                              value={getValor(fila, key)}
                              onChange={e => handleUnidadChange(fila, e.target.value)}
                              disabled={!puedeEditarCol}
                            >
                              <option value="">Seleccionar...</option>
                              {OPCIONES_UNIDAD.map(op => (
                                <option key={op} value={op}>{op}</option>
                              ))}
                            </select>
                          </td>
                        );
                      }
                      return (
                        <td
                          key={col.id}
                          className={`cell-td${!puedeEditarCol ? ' cell-td-readonly' : ''}`}
                          style={{ textAlign: col.alineacion || 'center' }}
                          onClick={() => puedeEditarCol && openModal(fila, key)}
                        >
                          <span className="cell-text">{getValor(fila, key) || (puedeEditarCol ? <span className="cell-placeholder">Escribir...</span> : '')}</span>
                        </td>
                      );
                    })}
                    {COLUMNAS_RESULTADO.map((_, i) => {
                      const key = `f_${i}`;
                      const unidad = getUnidadMedida(fila);
                      const isAnual = i === 3;
                      const displayVal = isAnual
                        ? getValor(fila, key)
                        : formatNumero(getValor(fila, key), unidad);
                      const campoBloqueo = `bloqueo_${['1er_cuatrimestre', '2do_cuatrimestre', '3er_cuatrimestre'][i]}`;
                      const bloqueadoCuatri = isAnual ? false : encabezado?.[campoBloqueo];
                      const puedeEditarCuatri = isSuperAdmin && !bloqueadoCuatri;

                      if (isAnual) {
                        return (
                          <td
                            key={i}
                            className={`cell-td cell-td-anual${!puedeEditarCuatri ? ' cell-td-readonly' : ''}`}
                            style={{ textAlign: 'center' }}
                            onClick={() => puedeEditarCuatri && openModal(fila, key)}
                          >
                            <span className="cell-text">{displayVal || (puedeEditarCuatri ? <span className="cell-placeholder">Editar...</span> : '')}</span>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={i}
                          className={`cell-td${!puedeEditarCuatri ? ' cell-td-readonly' : ''}`}
                          style={{ textAlign: 'center' }}
                          onClick={() => puedeEditarCuatri && openModal(fila, key)}
                        >
                          <span className="cell-text">{displayVal || (puedeEditarCuatri ? <span className="cell-placeholder">Escribir...</span> : '')}</span>
                        </td>
                      );
                    })}
                    {isSuperAdmin && !encabezado?.bloqueo_filas && (
                      <td>
                        <button className="btn btn-danger btn-small" onClick={() => handleDeleteFila(fila)}>🗑️</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="cell-modal-overlay" onClick={closeModal}>
          <div className="cell-modal" onClick={e => e.stopPropagation()}>
            <div className="cell-modal-header">
              <h3>Editar celda</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="cell-modal-body">
              <textarea
                className="cell-modal-textarea"
                value={modalValue}
                onChange={e => setModalValue(e.target.value)}
                autoFocus
              />
            </div>
            <div className="cell-modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveModal} disabled={modalSaving}>
                {modalSaving ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatrizIndicadoresPage;
