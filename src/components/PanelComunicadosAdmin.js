import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/App.css';

// Componente de Editor de Texto Enriquecido MEJORADO
const RichTextEditor = ({ value, onChange, placeholder, rows = 10 }) => {
  const editorRef = useRef(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [fontSize, setFontSize] = useState('16');
  const [textAlign, setTextAlign] = useState('left');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');

  // Inicializar el contenido del editor
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  // Actualizar estado de la barra de herramientas
  const updateToolbarState = () => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.toString().length > 0) {
      try {
        setIsBold(document.queryCommandState('bold'));
        setIsItalic(document.queryCommandState('italic'));
        setIsUnderline(document.queryCommandState('underline'));
      } catch (error) {
        console.log('Error actualizando toolbar:', error);
      }
    }
  };

  // Manejar cambios en el editor
  const handleEditorInput = () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML;
      onChange(htmlContent);
      updateToolbarState();
    }
  };

  // Ejecutar comandos de formato
  const execCommand = (command, value = null) => {
    try {
      // Guardar selección actual
      const selection = window.getSelection();
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      
      // Restaurar foco al editor si se perdió
      if (!editorRef.current.contains(document.activeElement)) {
        editorRef.current.focus();
      }
      
      // Ejecutar comando
      document.execCommand('styleWithCSS', false, true);
      if (value) {
        document.execCommand(command, false, value);
      } else {
        document.execCommand(command, false, null);
      }
      
      // Restaurar selección si existía
      if (range) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      // Actualizar contenido
      handleEditorInput();
      
      // Mantener foco en el editor
      editorRef.current.focus();
      
    } catch (error) {
      console.error('Error ejecutando comando:', error);
    }
  };

  const formatText = (command) => {
    execCommand(command);
    
    // Actualizar estado de botones
    if (command === 'bold') setIsBold(!isBold);
    if (command === 'italic') setIsItalic(!isItalic);
    if (command === 'underline') setIsUnderline(!isUnderline);
  };

  const handleTextAlign = (align) => {
    execCommand('justify' + align);
    setTextAlign(align);
  };

  // Función mejorada para cambiar tamaño de fuente
  const handleFontSize = (e) => {
    const size = e.target.value;
    if (size >= 8 && size <= 72) {
      // Aplicar tamaño directamente al contenido seleccionado
      const selection = window.getSelection();
      if (selection.rangeCount > 0 && selection.toString().length > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = size + 'px';
        
        try {
          range.surroundContents(span);
        } catch (error) {
          // Si hay error, usar insertHTML
          const selectedText = selection.toString();
          document.execCommand('insertHTML', false, `<span style="font-size: ${size}px">${selectedText}</span>`);
        }
      } else {
        // Si no hay texto seleccionado, aplicar al siguiente texto que se escriba
        execCommand('fontSize', '7'); // Esto es necesario para algunos navegadores
      }
      
      setFontSize(size);
      handleEditorInput();
    }
  };

  const handleTextColor = (color) => {
    execCommand('foreColor', color);
    setTextColor(color);
    setShowColorPicker(false);
  };

  const handleBgColor = (color) => {
    execCommand('backColor', color);
    setBgColor(color);
  };

  const insertList = (type) => {
    execCommand(type === 'ordered' ? 'insertOrderedList' : 'insertUnorderedList');
  };

  const clearFormatting = () => {
    execCommand('removeFormat');
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setTextAlign('left');
    setFontSize('16');
    setTextColor('#000000');
    setBgColor('#ffffff');
    
    // También limpiar estilos inline
    if (editorRef.current) {
      const elements = editorRef.current.querySelectorAll('[style]');
      elements.forEach(el => {
        el.removeAttribute('style');
      });
    }
  };

  const insertLink = () => {
    const url = prompt('Ingrese la URL del enlace:', 'https://');
    if (url) {
      // Verificar si hay texto seleccionado
      const selection = window.getSelection();
      if (selection.toString().length === 0) {
        alert('Por favor, seleccione el texto que desea convertir en enlace.');
        return;
      }
      execCommand('createLink', url);
    }
  };

  // Manejar teclas especiales para mantener el orden del texto
  const handleKeyDown = (e) => {
    // Permitir atajos de teclado comunes
    if (e.ctrlKey || e.metaKey) {
      switch(e.key) {
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'u':
          e.preventDefault();
          formatText('underline');
          break;
        case 'z':
          if (!e.shiftKey) {
            e.preventDefault();
            execCommand('undo');
          }
          break;
        case 'y':
          if (!e.shiftKey) {
            e.preventDefault();
            execCommand('redo');
          }
          break;
      }
    }
  };

  // Manejar pegado de texto para limpiar formato
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleEditorInput();
  };

  // Función para insertar texto con formato específico
  const insertFormattedText = (text, format = {}) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      
      // Aplicar formato
      if (format.bold) span.style.fontWeight = 'bold';
      if (format.italic) span.style.fontStyle = 'italic';
      if (format.underline) span.style.textDecoration = 'underline';
      if (format.fontSize) span.style.fontSize = format.fontSize + 'px';
      if (format.color) span.style.color = format.color;
      
      const textNode = document.createTextNode(text);
      span.appendChild(textNode);
      range.deleteContents();
      range.insertNode(span);
      
      handleEditorInput();
    }
  };

  const textContent = value ? value.replace(/<[^>]*>/g, '') : '';
  const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = textContent.length;

  return (
    <div className="rich-text-editor-container">
      {/* Barra de herramientas MEJORADA */}
      <div className="editor-toolbar">
        {/* Formato de texto */}
        <div className="toolbar-group">
          <button 
            type="button"
            className={`toolbar-btn ${isBold ? 'active' : ''}`}
            onClick={() => formatText('bold')}
            title="Negrita (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button 
            type="button"
            className={`toolbar-btn ${isItalic ? 'active' : ''}`}
            onClick={() => formatText('italic')}
            title="Cursiva (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button 
            type="button"
            className={`toolbar-btn ${isUnderline ? 'active' : ''}`}
            onClick={() => formatText('underline')}
            title="Subrayado (Ctrl+U)"
          >
            <u>U</u>
          </button>
        </div>

        {/* Alineación - CON BOTÓN DE JUSTIFICAR */}
        <div className="toolbar-group">
          <button 
            type="button"
            className={`toolbar-btn ${textAlign === 'left' ? 'active' : ''}`}
            onClick={() => handleTextAlign('left')}
            title="Alinear izquierda"
          >
            ←
          </button>
          <button 
            type="button"
            className={`toolbar-btn ${textAlign === 'center' ? 'active' : ''}`}
            onClick={() => handleTextAlign('center')}
            title="Centrar"
          >
            ↔
          </button>
          <button 
            type="button"
            className={`toolbar-btn ${textAlign === 'right' ? 'active' : ''}`}
            onClick={() => handleTextAlign('right')}
            title="Alinear derecha"
          >
            →
          </button>
          <button 
            type="button"
            className={`toolbar-btn ${textAlign === 'justify' ? 'active' : ''}`}
            onClick={() => handleTextAlign('full')}
            title="Justificar texto"
          >
            ☰
          </button>
        </div>

        {/* Tamaño de fuente - EN PIXELES */}
        <div className="toolbar-group">
          <div className="font-size-container" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <button 
              type="button"
              className="toolbar-btn"
              onClick={() => {
                const current = parseInt(fontSize);
                if (current > 8) {
                  handleFontSize({ target: { value: (current - 1).toString() } });
                }
              }}
              title="Reducir tamaño"
              style={{ padding: '6px 8px' }}
            >
              A−
            </button>
            
            <select 
              className="toolbar-select"
              value={fontSize}
              onChange={handleFontSize}
              title="Tamaño de fuente"
              style={{ minWidth: '80px' }}
            >
              <option value="8">8px</option>
              <option value="9">9px</option>
              <option value="10">10px</option>
              <option value="11">11px</option>
              <option value="12">12px</option>
              <option value="13">13px</option>
              <option value="14">14px</option>
              <option value="15">15px</option>
              <option value="16">16px</option>
              <option value="17">17px</option>
              <option value="18">18px</option>
              <option value="20">20px</option>
              <option value="22">22px</option>
              <option value="24">24px</option>
              <option value="26">26px</option>
              <option value="28">28px</option>
              <option value="32">32px</option>
              <option value="36">36px</option>
              <option value="40">40px</option>
              <option value="48">48px</option>
            </select>
            
            <button 
              type="button"
              className="toolbar-btn"
              onClick={() => {
                const current = parseInt(fontSize);
                if (current < 72) {
                  handleFontSize({ target: { value: (current + 1).toString() } });
                }
              }}
              title="Aumentar tamaño"
              style={{ padding: '6px 8px' }}
            >
              A+
            </button>
          </div>
        </div>

        {/* Color de texto */}
        <div className="toolbar-group">
          <div className="color-picker-container">
            <button 
              type="button"
              className="toolbar-btn"
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Color de texto"
              style={{ 
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span style={{ color: textColor }}>A</span>
              <div style={{
                width: '15px',
                height: '3px',
                backgroundColor: textColor,
                borderRadius: '2px'
              }}></div>
            </button>
            
            {showColorPicker && (
              <div className="color-picker-popup">
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => handleTextColor(e.target.value)}
                    style={{ width: '100%', height: '40px', cursor: 'pointer', border: 'none' }}
                  />
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(6, 1fr)', 
                  gap: '4px',
                  marginBottom: '10px'
                }}>
                  {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', 
                    '#800000', '#008000', '#000080', '#808000', '#800080', '#008080',
                    '#FFA500', '#FFC0CB', '#00FFFF', '#FFD700', '#C0C0C0', '#FFFFFF'].map(color => (
                    <button
                      key={color}
                      type="button"
                      className="color-option"
                      style={{ 
                        backgroundColor: color, 
                        width: '20px', 
                        height: '20px',
                        border: color === '#FFFFFF' ? '1px solid #ccc' : 'none'
                      }}
                      onClick={() => handleTextColor(color)}
                      title={color}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => handleTextColor(e.target.value)}
                    placeholder="#000000"
                    style={{ 
                      flex: 1, 
                      padding: '6px', 
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => setShowColorPicker(false)}
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Color de fondo */}
          <button 
            type="button"
            className="toolbar-btn"
            onClick={() => {
              const color = prompt('Color de fondo (ej: #FF0000):', bgColor);
              if (color) handleBgColor(color);
            }}
            title="Color de fondo"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <span>🎨</span>
            <div style={{
              width: '15px',
              height: '3px',
              backgroundColor: bgColor,
              borderRadius: '2px'
            }}></div>
          </button>
        </div>

        {/* Listas y enlaces */}
        <div className="toolbar-group">
          <button 
            type="button"
            className="toolbar-btn"
            onClick={() => insertList('unordered')}
            title="Lista con viñetas"
          >
            •
          </button>
          <button 
            type="button"
            className="toolbar-btn"
            onClick={() => insertList('ordered')}
            title="Lista numerada"
          >
            1.
          </button>
          <button 
            type="button"
            className="toolbar-btn"
            onClick={insertLink}
            title="Insertar enlace"
          >
            🔗
          </button>
        </div>

        {/* Encabezados */}
        <div className="toolbar-group">
          <button 
            type="button"
            className="toolbar-btn"
            onClick={() => insertFormattedText('', { fontSize: 24, bold: true })}
            title="Título grande"
          >
            H1
          </button>
          <button 
            type="button"
            className="toolbar-btn"
            onClick={() => insertFormattedText('', { fontSize: 20, bold: true })}
            title="Subtítulo"
          >
            H2
          </button>
          <button 
            type="button"
            className="toolbar-btn"
            onClick={() => insertFormattedText('', { fontSize: 16, bold: true })}
            title="Encabezado"
          >
            H3
          </button>
        </div>

        {/* Acciones */}
        <div className="toolbar-group">
          <button 
            type="button"
            className="toolbar-btn"
            onClick={() => execCommand('undo')}
            title="Deshacer (Ctrl+Z)"
          >
            ↩️
          </button>
          <button 
            type="button"
            className="toolbar-btn"
            onClick={() => execCommand('redo')}
            title="Rehacer (Ctrl+Y)"
          >
            ↪️
          </button>
          <button 
            type="button"
            className="toolbar-btn btn-danger"
            onClick={clearFormatting}
            title="Limpiar formato"
          >
            🧹
          </button>
        </div>
      </div>

      {/* Área de edición */}
      <div
        ref={editorRef}
        className="rich-text-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={handleEditorInput}
        onKeyDown={handleKeyDown}
        onKeyUp={updateToolbarState}
        onMouseUp={updateToolbarState}
        onPaste={handlePaste}
        onBlur={handleEditorInput}
        data-placeholder={placeholder}
        style={{
          minHeight: `${rows * 24}px`,
          fontFamily: 'Arial, sans-serif',
          lineHeight: '1.6',
          fontSize: fontSize + 'px',
          color: textColor,
          backgroundColor: bgColor,
          textAlign: textAlign
        }}
      />

      {/* Contador de caracteres y palabras (SIN VISTA PREVIA) */}
      <div className="editor-stats">
        <span>
          📝 <strong>{wordCount}</strong> palabras
        </span>
        <span>
          🔤 <strong>{charCount}</strong> caracteres
        </span>
        <span>
          ✏️ Editor activo
        </span>
      </div>
    </div>
  );
};

// Componente principal PanelComunicadosAdmin
const PanelComunicadosAdmin = ({ admin, onClose }) => {
  const [comunicados, setComunicados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    contenidoHtml: '',
    link_externo: '',
    estado: 'publicado'
  });
  const [editId, setEditId] = useState(null);
  const [expandedComunicado, setExpandedComunicado] = useState(null);

  useEffect(() => {
    fetchComunicadosAdmin();
  }, []);

  const fetchComunicadosAdmin = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://api.strideutmat.com/api/university/comunicados-admin');
      
      if (response.data.success) {
        setComunicados(response.data.data || []);
      } else {
        toast.error('Error al cargar comunicados');
      }
    } catch (error) {
      console.error('Error cargando comunicados:', error);
      toast.error('Error al cargar los comunicados');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleContentChange = (htmlContent) => {
    setFormData({
      ...formData,
      contenido: htmlContent.replace(/<[^>]*>/g, ''), // Texto plano para búsquedas
      contenidoHtml: htmlContent // HTML formateado
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.contenidoHtml.trim()) {
      toast.error('Título y contenido son requeridos');
      return;
    }

    try {
      const comunicadoData = {
        titulo: formData.titulo,
        contenido: formData.contenidoHtml, // Usar HTML formateado
        link_externo: formData.link_externo,
        estado: formData.estado,
        publicado_por_id: admin.id
      };

      if (editId) {
        // Actualizar comunicado existente
        await axios.put(`https://api.strideutmat.com/api/university/comunicados/${editId}`, comunicadoData);
        toast.success('Comunicado actualizado exitosamente');
      } else {
        // Crear nuevo comunicado
        await axios.post('https://api.strideutmat.com/api/university/comunicados', comunicadoData);
        toast.success('Comunicado publicado exitosamente');
      }

      // Limpiar formulario y recargar lista
      resetForm();
      fetchComunicadosAdmin();
      setShowForm(false);
      
    } catch (error) {
      console.error('Error guardando comunicado:', error);
      toast.error(error.response?.data?.error || 'Error al guardar el comunicado');
    }
  };

  const handleEdit = (comunicado) => {
    setFormData({
      titulo: comunicado.titulo,
      contenido: comunicado.contenido.replace(/<[^>]*>/g, ''), // Texto plano
      contenidoHtml: comunicado.contenido, // HTML original
      link_externo: comunicado.link_externo || '',
      estado: comunicado.estado
    });
    setEditId(comunicado.id);
    setShowForm(true);
  };

  const handleDelete = async (id, titulo) => {
    if (!window.confirm(`¿Estás seguro de eliminar el comunicado "${titulo}"?`)) {
      return;
    }

    try {
      await axios.delete(`https://api.strideutmat.com/api/university/comunicados/${id}`);
      toast.success('Comunicado eliminado exitosamente');
      fetchComunicadosAdmin();
    } catch (error) {
      console.error('Error eliminando comunicado:', error);
      toast.error('Error al eliminar el comunicado');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      contenido: '',
      contenidoHtml: '',
      link_externo: '',
      estado: 'publicado'
    });
    setEditId(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const toggleExpand = (id) => {
    if (expandedComunicado === id) {
      setExpandedComunicado(null);
    } else {
      setExpandedComunicado(id);
    }
  };

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'publicado':
        return <span className="badge estado-publicado">✅ Publicado</span>;
      case 'borrador':
        return <span className="badge estado-borrador">📝 Borrador</span>;
      case 'archivado':
        return <span className="badge estado-archivado">📁 Archivado</span>;
      default:
        return <span className="badge">❓ {estado}</span>;
    }
  };

  return (
    <div className="panel-comunicados-admin">
      <div className="panel-header">
        <div className="header-content">
          <h2>📢 Administración de Comunicados</h2>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? '← Volver a lista' : '+ Nuevo Comunicado'}
          </button>
        </div>
      </div>

      {showForm ? (
        <div className="comunicados-form-container">
          <form onSubmit={handleSubmit} className="comunicados-form">
            <div className="form-header">
              <h3>{editId ? '✏️ Editar Comunicado' : '📝 Nuevo Comunicado'}</h3>
            </div>

            <div className="form-group">
              <label htmlFor="titulo">Título *</label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                placeholder="Título del comunicado"
                required
                maxLength="200"
              />
              <div className="form-hint">Máximo 200 caracteres</div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="contenido">Contenido *</label>
              
              {/* Editor de texto enriquecido MEJORADO */}
              <RichTextEditor
                value={formData.contenidoHtml}
                onChange={handleContentChange}
                placeholder="Escribe el contenido del comunicado aquí..."
                rows={12}
              />
              
              <div className="word-counter">
                <span style={{ color: 'var(--secondary-blue)' }}>
                  📊 {formData.contenido.length} caracteres • {formData.contenido.split(/\s+/).filter(w => w).length} palabras
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="link_externo">Enlace relacionado (opcional)</label>
              <input
                type="url"
                id="link_externo"
                name="link_externo"
                value={formData.link_externo}
                onChange={handleInputChange}
                placeholder="https://ejemplo.com"
              />
              <div className="form-hint">Enlace externo relacionado con el comunicado</div>
            </div>

            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
              >
                <option value="publicado">✅ Publicado (visible para todos)</option>
                <option value="borrador">📝 Borrador (solo visible en admin)</option>
                <option value="archivado">📁 Archivado (no visible)</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => { resetForm(); setShowForm(false); }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {editId ? '💾 Actualizar Comunicado' : '📢 Publicar Comunicado'}
              </button>
            </div>

            <div className="form-info">
              <p><strong>💡 Consejos para redactar comunicados:</strong></p>
              <ul>
                <li>Utilice títulos claros y descriptivos</li>
                <li>Use el editor para resaltar información importante</li>
                <li>Incluya fechas y plazos cuando sea necesario</li>
                <li>Verifique los enlaces antes de publicar</li>
                <li>Guarde como borrador antes de publicar</li>
              </ul>
            </div>
          </form>
        </div>
      ) : (
        <div className="comunicados-list-admin">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Cargando comunicados...</p>
            </div>
          ) : comunicados.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">📭</div>
              <h3>No hay comunicados</h3>
              <p>Crea el primer comunicado para empezar.</p>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                + Crear Primer Comunicado
              </button>
            </div>
          ) : (
            <div className="comunicados-container">
              <div className="table-summary">
                <span>
                  <strong>{comunicados.length}</strong> comunicado(s) en total
                </span>
                <span>
                  <strong>{comunicados.filter(c => c.estado === 'publicado').length}</strong> publicados
                </span>
                <span>
                  <strong>{comunicados.filter(c => c.estado === 'borrador').length}</strong> borradores
                </span>
                <span>
                  <strong>{comunicados.filter(c => c.estado === 'archivado').length}</strong> archivados
                </span>
              </div>

              <div className="comunicados-grid-admin">
                {comunicados.map(comunicado => (
                  <div 
                    key={comunicado.id} 
                    className={`comunicado-card-admin ${expandedComunicado === comunicado.id ? 'expanded' : ''}`}
                  >
                    <div 
                      className="comunicado-header-admin" 
                      onClick={() => toggleExpand(comunicado.id)}
                    >
                      <div className="comunicado-title-admin">
                        <h3>
                          {comunicado.titulo}
                          {comunicado.link_externo && (
                            <span className="link-indicator" title="Tiene enlace">🔗</span>
                          )}
                        </h3>
                        <div className="comunicado-meta-admin">
                          <span className="comunicado-fecha-admin">
                            📅 {formatDate(comunicado.fecha_publicacion)}
                          </span>
                          <span className="comunicado-creador-admin">
                            👤 {comunicado.publicado_por_nombre || 'Administración'}
                          </span>
                          {getEstadoBadge(comunicado.estado)}
                        </div>
                      </div>
                      <div className="comunicado-toggle-admin">
                        {expandedComunicado === comunicado.id ? '▲' : '▼'}
                      </div>
                    </div>

                    {expandedComunicado === comunicado.id && (
                      <div className="comunicado-content-admin">
                        <div 
                          className="comunicado-contenido-admin"
                          dangerouslySetInnerHTML={{ __html: comunicado.contenido }}
                        />
                        
                        {comunicado.link_externo && (
                          <div className="comunicado-link-admin">
                            <strong>Enlace relacionado: </strong>
                            <a 
                              href={comunicado.link_externo} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="link-externo-admin"
                            >
                              {comunicado.link_externo}
                            </a>
                          </div>
                        )}

                        <div className="comunicado-footer-admin">
                          <div className="comunicado-actions-admin">
                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => handleEdit(comunicado)}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              className="btn btn-danger btn-small"
                              onClick={() => handleDelete(comunicado.id, comunicado.titulo)}
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                          <span className="comunicado-id-admin">
                            ID: {comunicado.id}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PanelComunicadosAdmin;