import React from 'react';

const Footer = () => {
  return (
    <footer className="university-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>STRIDE</h3>
          <p>
            Strategic Tracking for Resource Integration, Development and Evaluation.
            Sistema Tecnológico para la Gestión y Desarrollo Educativo.
            Comprometidos con la excelencia académica y la innovación tecnológica.
          </p>
        </div>
        
        <div className="footer-section">
          <h3>Contacto</h3>
          <p>Platform Development</p>
          <p>📧 lazarox200@gmail.com</p>
          <p>📞 +52 449-550-5392</p>
          <p>Planeación Y Evaluación</p>
          <p>📧 ctorres@utma.edu.mx</p>
          <p>📞 +52 449-786-0951</p>
        </div>
        
        <div className="footer-section">
          <h3>Direcciones Institucionales:</h3>
          <p>• Dirección Academica</p>
          <p>• Dirección de Vinculacion</p>
          <p>• Dirección de Servicios Estudiantiles</p>
          <p>• Dirección de Desarrollo Institucional y Presupuesto</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} STRIDE Todos los derechos reservados.</p>
        <p>Sistema de Gestión Académica v2.0. Creado por Lázaro Roberto Luevano Serna</p>
      </div>
    </footer>
  );
};

export default Footer;