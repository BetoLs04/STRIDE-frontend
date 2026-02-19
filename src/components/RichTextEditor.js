import React, { useState, useEffect, useRef } from 'react';
import '../styles/App.css';

const RichTextEditor = ({ value, onChange, placeholder, rows = 10 }) => {
  const editorRef = useRef(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [fontSize, setFontSize] = useState('16px');
  const [textAlign, setTextAlign] = useState('left');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
      updateToolbarState();
    }
  }, [value]);

  const updateToolbarState = () => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const node = range.startContainer;
      const parent = node.parentElement;
      
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsUnderline(document.queryCommandState('underline'));
      
      // Obtener alineación
      const computedStyle = window.getComputedStyle(parent);
      setTextAlign(computedStyle.textAlign || 'left');
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      updateToolbarState();
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    handleInput();
    editorRef.current.focus();
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

  const handleFontSize = (size) => {
    const pxSize = size + 'px';
    execCommand('fontSize', '7'); // Forzar tamaño
    document.execCommand('fontName', false, 'Arial'); // Resetear fuente
    
    // Aplicar tamaño manualmente
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = pxSize;
      range.surroundContents(span);
      handleInput();
    }
    setFontSize(pxSize);
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
    setFontSize('16px');
    setTextColor('#000000');
    setBgColor('#ffffff');
  };

  const insertLink = () => {
    const url = prompt('Ingrese la URL del enlace:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  return (
    <div className="rich-text-editor-container">
      {/* Barra de herramientas */}
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

        {/* Alineación */}
        <div className="toolbar-group">
          <button 
            type="button"
            className={`toolbar-btn ${textAlign === 'left' ? 'active' : ''}`}
            onClick={() => handleTextAlign('left')}
            title="Alinear izquierda"
          >
            📏←
          </button>
          <button 
            type="button"
            className={`toolbar-btn ${textAlign === 'center' ? 'active' : ''}`}
            onClick={() => handleTextAlign('center')}
            title="Centrar"
          >
            📏↔
          </button>
          <button 
            type="button"
            className={`toolbar-btn ${textAlign === 'right' ? 'active' : ''}`}
            onClick={() => handleTextAlign('right')}
            title="Alinear derecha"
          >
            📏→
          </button>
          <button 
            type="button"
            className={`toolbar-btn ${textAlign === 'justify' ? 'active' : ''}`}
            onClick={() => handleTextAlign('justify')}
            title="Justificar"
          >
            📏⇔
          </button>
        </div>

        {/* Tamaño de fuente */}
        <div className="toolbar-group">
          <select 
            className="toolbar-select"
            value={parseInt(fontSize)}
            onChange={(e) => handleFontSize(e.target.value)}
            title="Tamaño de fuente"
          >
            <option value="10">10px</option>
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
            <option value="24">24px</option>
            <option value="28">28px</option>
            <option value="32">32px</option>
            <option value="36">36px</option>
          </select>
        </div>

        {/* Color de texto */}
        <div className="toolbar-group">
          <div className="color-picker-container">
            <button 
              type="button"
              className="toolbar-btn"
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Color de texto"
              style={{ position: 'relative' }}
            >
              <span style={{ color: textColor }}>A</span>
              <div 
                style={{
                  backgroundColor: textColor,
                  width: '12px',
                  height: '3px',
                  position: 'absolute',
                  bottom: '5px',
                  left: '50%',
                  transform: 'translateX(-50%)'
                }}
              />
            </button>
            
            {showColorPicker && (
              <div className="color-picker-popup">
                <div className="color-grid">
                  {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', 
                    '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#808080', '#FFFFFF'].map(color => (
                    <button
                      key={color}
                      type="button"
                      className="color-option"
                      style={{ backgroundColor: color }}
                      onClick={() => handleTextColor(color)}
                      title={color}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => handleTextColor(e.target.value)}
                  style={{ width: '100%', marginTop: '5px' }}
                />
              </div>
            )}
          </div>

          {/* Color de fondo */}
          <button 
            type="button"
            className="toolbar-btn"
            onClick={() => {
              const color = prompt('Color de fondo (ej: #FF0000 o red):', bgColor);
              if (color) handleBgColor(color);
            }}
            title="Color de fondo"
          >
            🎨
          </button>
        </div>

        {/* Listas */}
        <div className="toolbar-group">
          <button 
            type="button"
            className="toolbar-btn"
            onClick={() => insertList('unordered')}
            title="Lista con viñetas"
          >
            •📝
          </button>
          <button 
            type="button"
            className="toolbar-btn"
            onClick={() => insertList('ordered')}
            title="Lista numerada"
          >
            1.📝
          </button>
        </div>

        {/* Enlaces y más */}
        <div className="toolbar-group">
          <button 
            type="button"
            className="toolbar-btn"
            onClick={insertLink}
            title="Insertar enlace"
          >
            🔗
          </button>
          <button 
            type="button"
            className="toolbar-btn"
            onClick={() => execCommand('formatBlock', '<H1>')}
            title="Encabezado 1"
          >
            H1
          </button>
          <button 
            type="button"
            className="toolbar-btn"
            onClick={() => execCommand('formatBlock', '<H2>')}
            title="Encabezado 2"
          >
            H2
          </button>
          <button 
            type="button"
            className="toolbar-btn"
            onClick={() => execCommand('formatBlock', '<P>')}
            title="Párrafo"
          >
            P
          </button>
        </div>

        {/* Acciones */}
        <div className="toolbar-group">
          <button 
            type="button"
            className="toolbar-btn btn-danger"
            onClick={clearFormatting}
            title="Limpiar formato"
          >
            🧹
          </button>
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
        </div>
      </div>

      {/* Área de edición */}
      <div
        ref={editorRef}
        className="rich-text-editor"
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        onKeyUp={updateToolbarState}
        onMouseUp={updateToolbarState}
        data-placeholder={placeholder}
        style={{
          minHeight: `${rows * 20}px`,
          fontFamily: 'Arial, sans-serif',
          lineHeight: '1.6',
          color: textColor,
          backgroundColor: bgColor
        }}
      />

      {/* Contador de caracteres y palabras */}
      <div className="editor-stats">
        <span>
          Caracteres: {value?.replace(/<[^>]*>/g, '').length || 0}
        </span>
        <span>
          Palabras: {value?.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length || 0}
        </span>
        <span>
          HTML activado
        </span>
      </div>

      {/* Vista previa simple */}
      <div className="editor-preview">
        <h4>Vista previa (sin formato HTML):</h4>
        <div className="preview-content">
          {value?.replace(/<[^>]*>/g, '') || 'El contenido aparecerá aquí...'}
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;