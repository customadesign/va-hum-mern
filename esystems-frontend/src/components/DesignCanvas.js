import React, { useState, useRef, useEffect } from 'react';
import {
  PaintBrushIcon,
  RectangleGroupIcon,
  CircleStackIcon,
  CursorArrowRaysIcon,
  PhotoIcon,
  DocumentDuplicateIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  Square3Stack3DIcon,
  AdjustmentsHorizontalIcon,
  SwatchIcon,
  PencilIcon,
  SparklesIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';

const DesignCanvas = ({ initialDesign, onDesignChange, readOnly = false }) => {
  const canvasRef = useRef(null);
  const [selectedTool, setSelectedTool] = useState('select');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [brushSize, setBrushSize] = useState(5);
  const [layers, setLayers] = useState([
    { id: 1, name: 'Background', visible: true, locked: false, opacity: 100 },
    { id: 2, name: 'Layer 1', visible: true, locked: false, opacity: 100 }
  ]);
  const [selectedLayer, setSelectedLayer] = useState(2);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Tool configurations
  const tools = [
    { id: 'select', name: 'Select', icon: CursorArrowRaysIcon },
    { id: 'brush', name: 'Brush', icon: PaintBrushIcon },
    { id: 'rectangle', name: 'Rectangle', icon: RectangleGroupIcon },
    { id: 'circle', name: 'Circle', icon: CircleStackIcon },
    { id: 'text', name: 'Text', icon: PencilIcon },
    { id: 'image', name: 'Image', icon: PhotoIcon }
  ];

  // Color palette
  const colorPalette = [
    '#000000', '#FFFFFF', '#EF4444', '#F59E0B', '#10B981',
    '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#F3F4F6'
  ];

  // Element templates
  const elementTemplates = {
    rectangle: {
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      fill: selectedColor,
      stroke: '#000000',
      strokeWidth: 2,
      opacity: 100,
      rotation: 0
    },
    circle: {
      type: 'circle',
      x: 200,
      y: 200,
      radius: 50,
      fill: selectedColor,
      stroke: '#000000',
      strokeWidth: 2,
      opacity: 100
    },
    text: {
      type: 'text',
      x: 100,
      y: 100,
      text: 'Your Text Here',
      fontSize: 24,
      fontFamily: 'Arial',
      fill: selectedColor,
      opacity: 100,
      rotation: 0
    }
  };

  useEffect(() => {
    if (initialDesign) {
      setElements(initialDesign.elements || []);
      setLayers(initialDesign.layers || layers);
    }
  }, [initialDesign]);

  const handleToolSelect = (toolId) => {
    if (!readOnly) {
      setSelectedTool(toolId);
      setSelectedElement(null);
    }
  };

  const handleAddElement = (type) => {
    if (readOnly) return;
    
    const newElement = {
      ...elementTemplates[type],
      id: Date.now(),
      layerId: selectedLayer
    };
    
    const newElements = [...elements, newElement];
    setElements(newElements);
    addToHistory(newElements);
    
    if (onDesignChange) {
      onDesignChange({ elements: newElements, layers });
    }
  };

  const handleDeleteElement = () => {
    if (readOnly || !selectedElement) return;
    
    const newElements = elements.filter(el => el.id !== selectedElement.id);
    setElements(newElements);
    setSelectedElement(null);
    addToHistory(newElements);
    
    if (onDesignChange) {
      onDesignChange({ elements: newElements, layers });
    }
  };

  const handleLayerToggle = (layerId, property) => {
    if (readOnly) return;
    
    const newLayers = layers.map(layer => {
      if (layer.id === layerId) {
        return { ...layer, [property]: !layer[property] };
      }
      return layer;
    });
    setLayers(newLayers);
    
    if (onDesignChange) {
      onDesignChange({ elements, layers: newLayers });
    }
  };

  const handleAddLayer = () => {
    if (readOnly) return;
    
    const newLayer = {
      id: Date.now(),
      name: `Layer ${layers.length}`,
      visible: true,
      locked: false,
      opacity: 100
    };
    setLayers([...layers, newLayer]);
  };

  const addToHistory = (newElements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  const handleExport = () => {
    // In production, implement actual export functionality
    console.log('Exporting design:', { elements, layers });
    alert('Design exported! (This would download the design in production)');
  };

  const handleZoom = (direction) => {
    const newZoom = direction === 'in' 
      ? Math.min(zoom + 25, 200) 
      : Math.max(zoom - 25, 25);
    setZoom(newZoom);
  };

  return (
    <div className="bg-gray-100 rounded-lg overflow-hidden shadow-xl">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          {/* Tools */}
          <div className="flex items-center space-x-2">
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => handleToolSelect(tool.id)}
                disabled={readOnly}
                className={`p-2 rounded-lg transition-colors ${
                  selectedTool === tool.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={tool.name}
              >
                <tool.icon className="h-5 w-5" />
              </button>
            ))}
            
            <div className="w-px h-8 bg-gray-300 mx-2" />
            
            {/* Color Picker */}
            <div className="flex items-center space-x-2">
              <SwatchIcon className="h-5 w-5 text-gray-700" />
              <div className="flex space-x-1">
                {colorPalette.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    disabled={readOnly}
                    className={`w-6 h-6 rounded border-2 ${
                      selectedColor === color ? 'border-gray-900' : 'border-gray-300'
                    } ${readOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="w-px h-8 bg-gray-300 mx-2" />
            
            {/* Actions */}
            <button
              onClick={handleUndo}
              disabled={readOnly || historyIndex <= 0}
              className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo"
            >
              <ArrowUturnLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={readOnly || historyIndex >= history.length - 1}
              className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo"
            >
              <ArrowUturnRightIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleDeleteElement}
              disabled={readOnly || !selectedElement}
              className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            {/* Grid Toggle */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg transition-colors ${
                showGrid ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700'
              }`}
              title="Toggle Grid"
            >
              <Square3Stack3DIcon className="h-5 w-5" />
            </button>
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg px-2 py-1">
              <button
                onClick={() => handleZoom('out')}
                className="text-gray-700 hover:text-gray-900"
              >
                -
              </button>
              <span className="text-sm font-medium text-gray-700 w-12 text-center">
                {zoom}%
              </span>
              <button
                onClick={() => handleZoom('in')}
                className="text-gray-700 hover:text-gray-900"
              >
                +
              </button>
            </div>
            
            {/* Export */}
            <button
              onClick={handleExport}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
        
        {/* Properties Bar */}
        {selectedElement && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Properties:
              </span>
              {selectedElement.type === 'text' ? (
                <>
                  <input
                    type="text"
                    value={selectedElement.text}
                    onChange={(e) => {
                      const newElements = elements.map(el =>
                        el.id === selectedElement.id
                          ? { ...el, text: e.target.value }
                          : el
                      );
                      setElements(newElements);
                      setSelectedElement({ ...selectedElement, text: e.target.value });
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    disabled={readOnly}
                  />
                  <select
                    value={selectedElement.fontSize}
                    onChange={(e) => {
                      const newElements = elements.map(el =>
                        el.id === selectedElement.id
                          ? { ...el, fontSize: parseInt(e.target.value) }
                          : el
                      );
                      setElements(newElements);
                      setSelectedElement({ ...selectedElement, fontSize: parseInt(e.target.value) });
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    disabled={readOnly}
                  >
                    <option value="12">12px</option>
                    <option value="16">16px</option>
                    <option value="20">20px</option>
                    <option value="24">24px</option>
                    <option value="32">32px</option>
                    <option value="48">48px</option>
                  </select>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-700">Width:</label>
                    <input
                      type="number"
                      value={selectedElement.width || selectedElement.radius * 2}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        const newElements = elements.map(el =>
                          el.id === selectedElement.id
                            ? el.type === 'circle'
                              ? { ...el, radius: value / 2 }
                              : { ...el, width: value }
                            : el
                        );
                        setElements(newElements);
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      disabled={readOnly}
                    />
                  </div>
                  {selectedElement.type === 'rectangle' && (
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-700">Height:</label>
                      <input
                        type="number"
                        value={selectedElement.height}
                        onChange={(e) => {
                          const newElements = elements.map(el =>
                            el.id === selectedElement.id
                              ? { ...el, height: parseInt(e.target.value) }
                              : el
                          );
                          setElements(newElements);
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        disabled={readOnly}
                      />
                    </div>
                  )}
                </>
              )}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Opacity:</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedElement.opacity}
                  onChange={(e) => {
                    const newElements = elements.map(el =>
                      el.id === selectedElement.id
                        ? { ...el, opacity: parseInt(e.target.value) }
                        : el
                    );
                    setElements(newElements);
                    setSelectedElement({ ...selectedElement, opacity: parseInt(e.target.value) });
                  }}
                  className="w-24"
                  disabled={readOnly}
                />
                <span className="text-sm text-gray-700">{selectedElement.opacity}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="flex" style={{ height: '500px' }}>
        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-gray-50">
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            {/* Grid Background */}
            {showGrid && (
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, #e5e7eb 0px, transparent 1px, transparent 20px, #e5e7eb 21px), repeating-linear-gradient(90deg, #e5e7eb 0px, transparent 1px, transparent 20px, #e5e7eb 21px)',
                  backgroundSize: '20px 20px'
                }}
              />
            )}
            
            {/* Canvas */}
            <div
              ref={canvasRef}
              className="relative bg-white shadow-lg"
              style={{ width: '600px', height: '400px' }}
            >
              {/* Render Elements */}
              {elements
                .filter(el => {
                  const layer = layers.find(l => l.id === el.layerId);
                  return layer && layer.visible;
                })
                .map(element => {
                  const isSelected = selectedElement?.id === element.id;
                  
                  if (element.type === 'rectangle') {
                    return (
                      <div
                        key={element.id}
                        onClick={() => !readOnly && setSelectedElement(element)}
                        className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                        style={{
                          left: element.x,
                          top: element.y,
                          width: element.width,
                          height: element.height,
                          backgroundColor: element.fill,
                          border: `${element.strokeWidth}px solid ${element.stroke}`,
                          opacity: element.opacity / 100,
                          transform: `rotate(${element.rotation}deg)`
                        }}
                      />
                    );
                  }
                  
                  if (element.type === 'circle') {
                    return (
                      <div
                        key={element.id}
                        onClick={() => !readOnly && setSelectedElement(element)}
                        className={`absolute rounded-full cursor-move ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                        style={{
                          left: element.x - element.radius,
                          top: element.y - element.radius,
                          width: element.radius * 2,
                          height: element.radius * 2,
                          backgroundColor: element.fill,
                          border: `${element.strokeWidth}px solid ${element.stroke}`,
                          opacity: element.opacity / 100
                        }}
                      />
                    );
                  }
                  
                  if (element.type === 'text') {
                    return (
                      <div
                        key={element.id}
                        onClick={() => !readOnly && setSelectedElement(element)}
                        className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                        style={{
                          left: element.x,
                          top: element.y,
                          color: element.fill,
                          fontSize: element.fontSize,
                          fontFamily: element.fontFamily,
                          opacity: element.opacity / 100,
                          transform: `rotate(${element.rotation}deg)`
                        }}
                      >
                        {element.text}
                      </div>
                    );
                  }
                  
                  return null;
                })}
              
              {/* Add Element Buttons */}
              {!readOnly && selectedTool !== 'select' && selectedTool !== 'brush' && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <button
                    onClick={() => handleAddElement(selectedTool)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg"
                  >
                    <SparklesIcon className="h-5 w-5" />
                    <span>Add {selectedTool}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Layers Panel */}
        <div className="w-64 bg-white border-l border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Layers</h3>
            <button
              onClick={handleAddLayer}
              disabled={readOnly}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentDuplicateIcon className="h-5 w-5 text-gray-700" />
            </button>
          </div>
          
          <div className="space-y-2">
            {layers.slice().reverse().map(layer => (
              <div
                key={layer.id}
                onClick={() => !readOnly && setSelectedLayer(layer.id)}
                className={`p-2 rounded-lg border cursor-pointer ${
                  selectedLayer === layer.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                } ${layer.locked ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{layer.name}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLayerToggle(layer.id, 'visible');
                      }}
                      className="p-1 rounded hover:bg-gray-200"
                      disabled={readOnly}
                    >
                      {layer.visible ? (
                        <EyeIcon className="h-4 w-4 text-gray-700" />
                      ) : (
                        <EyeSlashIcon className="h-4 w-4 text-gray-700" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLayerToggle(layer.id, 'locked');
                      }}
                      className="p-1 rounded hover:bg-gray-200"
                      disabled={readOnly}
                    >
                      {layer.locked ? (
                        <LockClosedIcon className="h-4 w-4 text-gray-700" />
                      ) : (
                        <LockOpenIcon className="h-4 w-4 text-gray-700" />
                      )}
                    </button>
                  </div>
                </div>
                {selectedLayer === layer.id && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700">Opacity</span>
                      <span className="text-xs font-medium text-gray-700">{layer.opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={layer.opacity}
                      onChange={(e) => {
                        const newLayers = layers.map(l =>
                          l.id === layer.id
                            ? { ...l, opacity: parseInt(e.target.value) }
                            : l
                        );
                        setLayers(newLayers);
                      }}
                      className="w-full mt-1"
                      disabled={readOnly || layer.locked}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignCanvas;