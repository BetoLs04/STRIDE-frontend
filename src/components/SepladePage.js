import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SepladePage.css';

const SepladePage = ({ user }) => {
  const navigate = useNavigate();

  const goBack = () => {
    if (user?.tipo === 'superadmin') navigate('/admin/dashboard', { state: { tab: 'seplade' } });
    else if (user?.tipo === 'directivo') navigate('/directivo/dashboard');
    else navigate('/personal/dashboard');
  };

  return (
    <div className="seplade-page-container">
      <div className="seplade-page-toolbar">
        <button className="btn btn-secondary" onClick={goBack}>← Volver</button>
      </div>

      <div className="seplade-page">
        <div className="seplade-header">
          <h1>Programación Anual de Metas de Indicadores de Desempeño 2026</h1>
          <p>Programa Presupuestario 12684. Programa Universidades Tecnológicas, subsidios para organismos descentralizados estatales (U006).</p>
        </div>

        <table className="seplade-table">
          <thead>
            <tr>
              <th rowSpan="3" style={{ minWidth: '200px' }}>Indicador</th>
              <th rowSpan="3">Nivel</th>
              <th rowSpan="3">Unidad de<br />Medida</th>
              <th rowSpan="3">Meta<br />Anual</th>
              <th rowSpan="3">Programado /<br />Realizado</th>
              <th className="month-group" colSpan="1">Enero</th>
              <th className="month-group" colSpan="1">Febrero</th>
              <th className="month-group" colSpan="1">Marzo</th>
              <th className="month-group" colSpan="1">Abril</th>
              <th className="month-group" colSpan="1">Mayo</th>
              <th className="month-group" colSpan="1">Junio</th>
              <th className="month-group" colSpan="1">Julio</th>
              <th className="month-group" colSpan="1">Agosto</th>
              <th className="month-group" colSpan="1">Septiembre</th>
              <th className="month-group" colSpan="1">Octubre</th>
              <th className="month-group" colSpan="1">Noviembre</th>
              <th className="month-group" colSpan="1">Diciembre</th>
              <th rowSpan="3">Encargado</th>
              <th rowSpan="3" style={{ minWidth: '160px' }}>Evidencia Física</th>
              <th rowSpan="3" style={{ minWidth: '160px' }}>Evidencia en línea</th>
            </tr>
          </thead>
          <tbody>
            <tr className="row-prog">
              <td className="col-indicador" rowSpan="2">Porcentaje de recursos financieros ejercidos en la operatividad de la UTMA.</td>
              <td rowSpan="2">Indicadores de las Actividades</td>
              <td rowSpan="2">Porcentaje</td>
              <td rowSpan="2">100%</td>
              <td className="meta-label-prog">Programado</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.4</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
              <td rowSpan="2">Misael Chavez</td>
              <td rowSpan="2" className="col-evidencia">No hay expediente digital</td>
              <td rowSpan="2" className="col-online">No hay expediente digital</td>
            </tr>
            <tr className="row-real">
              <td className="meta-label-real">Realizado</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.4</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
            </tr>

            <tr className="row-prog">
              <td className="col-indicador" rowSpan="2">Número de informes de seguimiento realizados sobre el avance del ejercicio del recurso financiero.</td>
              <td rowSpan="2"></td>
              <td rowSpan="2">Porcentaje</td>
              <td rowSpan="2">3</td>
              <td className="meta-label-prog">Programado</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>1</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>1</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>1</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>1</td>
              <td rowSpan="2">Oficina de Recursos Humanos<br />Dirección de Administración</td>
              <td rowSpan="2" className="col-evidencia">No hay expediente digital</td>
              <td rowSpan="2" className="col-online">No hay expediente digital</td>
            </tr>
            <tr className="row-real">
              <td className="meta-label-real">Realizado</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>1</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>1</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>1</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>1</td>
            </tr>

            <tr className="row-prog">
              <td className="col-indicador" rowSpan="2">Porcentaje de recurso financiero destinado al sueldo y salario de los docentes y administrativos adscritos a la UTMA.</td>
              <td rowSpan="2"></td>
              <td rowSpan="2">Porcentaje</td>
              <td rowSpan="2">100%</td>
              <td className="meta-label-prog">Programado</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.4</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
              <td rowSpan="2"></td>
              <td rowSpan="2" className="col-evidencia">
                [Mes] 2026 Tomo 1<br />
                [Mes] 2026 Tomo 2<br />
                [Mes] 2026 Tomo 3 SP<br />
                Oficina de Dirección de Adminis.
              </td>
              <td rowSpan="2" className="col-online">
                [Mes] 2026 Tomo 1<br />
                [Mes] 2026 Tomo 2<br />
                [Mes] 2026 Tomo 3 SP<br />
                Oficina de Dirección de Adminis.
              </td>
            </tr>
            <tr className="row-real">
              <td className="meta-label-real">Realizado</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.4</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
            </tr>

            <tr className="row-prog">
              <td className="col-indicador" rowSpan="2">Porcentaje de avance en la compra o pago de servicios requeridos por la UTMA.</td>
              <td rowSpan="2"></td>
              <td rowSpan="2">Porcentaje</td>
              <td rowSpan="2">100%</td>
              <td className="meta-label-prog">Programado</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.4</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
              <td rowSpan="2"></td>
              <td rowSpan="2" className="col-evidencia">No hay expediente digital</td>
              <td rowSpan="2" className="col-online">No hay expediente digital</td>
            </tr>
            <tr className="row-real">
              <td className="meta-label-real">Realizado</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.4</td>
              <td className="fill-green"></td>
              <td className="fill-green"></td>
              <td>33.3</td>
            </tr>
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
            <span>Se hicieron antes o después del plazo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SepladePage;
