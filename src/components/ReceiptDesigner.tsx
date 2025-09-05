'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface ReceiptDesignerProps {
  onJsonUpdate: (json: string) => void;
}

interface ReceiptElement {
  id: string;
  type: string;
  content?: string;
  data?: string;
  field?: string;
  lines?: number;
  imageData?: string;
  barcodeType?: string;
  style?: {
    bold?: boolean;
    size?: string;
    underline?: boolean;
  };
}

interface ElementTemplate {
  type: string;
  name: string;
  icon: string;
  defaultData: Partial<ReceiptElement>;
}

const ELEMENT_TEMPLATES: ElementTemplate[] = [
  {
    type: 'text',
    name: 'Text',
    icon: '📝',
    defaultData: { content: 'Sample text', style: { bold: false, size: 'NORMAL' } }
  },
  {
    type: 'dynamic',
    name: 'Dynamic Field',
    icon: '🔗',
    defaultData: { field: '{store_name}' }
  },
  {
    type: 'divider',
    name: 'Divider',
    icon: '➖',
    defaultData: {}
  },
  {
    type: 'feed',
    name: 'Blank Lines',
    icon: '📄',
    defaultData: { lines: 1 }
  },
  {
    type: 'barcode',
    name: 'Barcode',
    icon: '📊',
    defaultData: { data: '123456789', barcodeType: 'CODE39' }
  },
  {
    type: 'qrcode',
    name: 'QR Code',
    icon: '⚡',
    defaultData: { data: 'https://example.com' }
  }
];

const DYNAMIC_FIELDS = [
  '{store_name}', '{store_address}', '{cashier_name}', '{timestamp}',
  '{order_number}', '{subtotal}', '{tax}', '{total}', '{item_list}',
  '{order_discount}', '{tax_details}', '{item_discount_total}'
];

const TEXT_SIZES = ['SMALL', 'NORMAL', 'LARGE', 'XLARGE'];
const BARCODE_TYPES = ['CODE39', 'CODE128', 'EAN13', 'UPC_A'];

export const ReceiptDesigner: React.FC<ReceiptDesignerProps> = ({ onJsonUpdate }) => {
  const [elements, setElements] = useState<ReceiptElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Initialize with sample receipt
  useEffect(() => {
    const initialElements: ReceiptElement[] = [
      {
        id: '1',
        type: 'text',
        content: 'BYTE BURGERS',
        style: { bold: true, size: 'XLARGE' }
      },
      {
        id: '2',
        type: 'text',
        content: '123 Main Street'
      },
      {
        id: '3',
        type: 'divider'
      },
      {
        id: '4',
        type: 'dynamic',
        field: '{timestamp}'
      },
      {
        id: '5',
        type: 'feed',
        lines: 1
      },
      {
        id: '6',
        type: 'text',
        content: 'Order #: '
      },
      {
        id: '7',
        type: 'dynamic',
        field: '{order_number}'
      },
      {
        id: '8',
        type: 'feed',
        lines: 2
      },
      {
        id: '9',
        type: 'dynamic',
        field: '{item_list}'
      },
      {
        id: '10',
        type: 'divider'
      },
      {
        id: '11',
        type: 'text',
        content: 'Total: ',
        style: { bold: true }
      },
      {
        id: '12',
        type: 'dynamic',
        field: '{total}'
      },
      {
        id: '13',
        type: 'feed',
        lines: 2
      },
      {
        id: '14',
        type: 'qrcode',
        data: 'https://byteburgers.com'
      },
      {
        id: '15',
        type: 'feed',
        lines: 2
      },
      {
        id: '16',
        type: 'text',
        content: 'Thank you for your visit!',
        style: { size: 'SMALL' }
      }
    ];
    
    setElements(initialElements);
  }, []);

  // Update JSON whenever elements change
  useEffect(() => {
    const jsonData = {
      elements: elements.map(({ id, ...element }) => element)
    };
    onJsonUpdate(JSON.stringify(jsonData, null, 2));
  }, [elements, onJsonUpdate]);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const addElement = (template: ElementTemplate) => {
    const newElement: ReceiptElement = {
      id: generateId(),
      type: template.type,
      ...template.defaultData
    };
    setElements([...elements, newElement]);
  };

  const updateElement = (id: string, updates: Partial<ReceiptElement>) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newElements = Array.from(elements);
    const [reorderedItem] = newElements.splice(result.source.index, 1);
    newElements.splice(result.destination.index, 0, reorderedItem);

    setElements(newElements);
  };

  const loadTemplate = (templateName: string) => {
    let templateElements: ReceiptElement[] = [];
    
    if (templateName === 'basic') {
      templateElements = [
        { id: generateId(), type: 'text', content: 'STORE NAME', style: { bold: true, size: 'LARGE' } },
        { id: generateId(), type: 'divider' },
        { id: generateId(), type: 'dynamic', field: '{timestamp}' },
        { id: generateId(), type: 'feed', lines: 1 },
        { id: generateId(), type: 'dynamic', field: '{item_list}' },
        { id: generateId(), type: 'divider' },
        { id: generateId(), type: 'text', content: 'Total: ', style: { bold: true } },
        { id: generateId(), type: 'dynamic', field: '{total}' },
        { id: generateId(), type: 'feed', lines: 2 },
        { id: generateId(), type: 'text', content: 'Thank you!' }
      ];
    } else if (templateName === 'detailed') {
      templateElements = [
        { id: generateId(), type: 'text', content: 'RESTAURANT NAME', style: { bold: true, size: 'XLARGE' } },
        { id: generateId(), type: 'text', content: 'Address Line 1' },
        { id: generateId(), type: 'text', content: 'City, State ZIP' },
        { id: generateId(), type: 'qrcode', data: 'https://restaurant.com' },
        { id: generateId(), type: 'feed', lines: 1 },
        { id: generateId(), type: 'divider' },
        { id: generateId(), type: 'dynamic', field: '{timestamp}' },
        { id: generateId(), type: 'text', content: 'Order: ' },
        { id: generateId(), type: 'dynamic', field: '{order_number}' },
        { id: generateId(), type: 'feed', lines: 2 },
        { id: generateId(), type: 'dynamic', field: '{item_list}' },
        { id: generateId(), type: 'feed', lines: 1 },
        { id: generateId(), type: 'divider' },
        { id: generateId(), type: 'text', content: 'Subtotal: ' },
        { id: generateId(), type: 'dynamic', field: '{subtotal}' },
        { id: generateId(), type: 'text', content: 'Tax: ' },
        { id: generateId(), type: 'dynamic', field: '{tax}' },
        { id: generateId(), type: 'text', content: 'Total: ', style: { bold: true, size: 'LARGE' } },
        { id: generateId(), type: 'dynamic', field: '{total}' },
        { id: generateId(), type: 'feed', lines: 2 },
        { id: generateId(), type: 'barcode', data: '{order_number}', barcodeType: 'CODE128' },
        { id: generateId(), type: 'feed', lines: 2 },
        { id: generateId(), type: 'text', content: 'Thank you for your visit!', style: { size: 'SMALL' } }
      ];
    }
    
    setElements(templateElements);
    setShowTemplates(false);
  };

  const renderElementPreview = (element: ReceiptElement) => {
    switch (element.type) {
      case 'text':
        return (
          <div className={`
            ${element.style?.bold ? 'font-bold' : ''}
            ${element.style?.size === 'SMALL' ? 'text-xs' : 
              element.style?.size === 'LARGE' ? 'text-lg' : 
              element.style?.size === 'XLARGE' ? 'text-xl' : 'text-sm'}
            ${element.style?.underline ? 'underline' : ''}
          `}>
            {element.content || 'Empty text'}
          </div>
        );
      case 'dynamic':
        return (
          <div className="text-blue-400 italic">
            {element.field || '{field}'}
          </div>
        );
      case 'divider':
        return <div className="border-t border-gray-400 my-1"></div>;
      case 'feed':
        return (
          <div className="text-gray-500 text-xs">
            [{element.lines || 1} blank line{(element.lines || 1) > 1 ? 's' : ''}]
          </div>
        );
      case 'barcode':
        return (
          <div className="bg-black text-white p-2 text-center font-mono text-xs">
            {element.barcodeType || 'CODE39'}: {element.data || 'data'}
          </div>
        );
      case 'qrcode':
        return (
          <div className="w-12 h-12 bg-black text-white flex items-center justify-center text-xs">
            QR
          </div>
        );
      default:
        return <div className="text-gray-500">Unknown element</div>;
    }
  };

  const renderPropertyPanel = () => {
    if (!selectedElement) {
      return (
        <div className="text-gray-400 text-center p-4">
          Select an element to edit its properties
        </div>
      );
    }

    const element = elements.find(el => el.id === selectedElement);
    if (!element) return null;

    return (
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-white">
          Edit {element.type.charAt(0).toUpperCase() + element.type.slice(1)}
        </h3>

        {element.type === 'text' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Content
              </label>
              <textarea
                value={element.content || ''}
                onChange={(e) => updateElement(element.id, { content: e.target.value })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Size
              </label>
              <select
                value={element.style?.size || 'NORMAL'}
                onChange={(e) => updateElement(element.id, { 
                  style: { ...element.style, size: e.target.value }
                })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                {TEXT_SIZES.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={element.style?.bold || false}
                  onChange={(e) => updateElement(element.id, {
                    style: { ...element.style, bold: e.target.checked }
                  })}
                  className="mr-2"
                />
                <span className="text-white">Bold</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={element.style?.underline || false}
                  onChange={(e) => updateElement(element.id, {
                    style: { ...element.style, underline: e.target.checked }
                  })}
                  className="mr-2"
                />
                <span className="text-white">Underline</span>
              </label>
            </div>
          </>
        )}

        {element.type === 'dynamic' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Dynamic Field
            </label>
            <select
              value={element.field || ''}
              onChange={(e) => updateElement(element.id, { field: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              {DYNAMIC_FIELDS.map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>
        )}

        {element.type === 'feed' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Number of Lines
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={element.lines || 1}
              onChange={(e) => updateElement(element.id, { lines: parseInt(e.target.value) })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        )}

        {element.type === 'barcode' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Barcode Data
              </label>
              <input
                type="text"
                value={element.data || ''}
                onChange={(e) => updateElement(element.id, { data: e.target.value })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Barcode Type
              </label>
              <select
                value={element.barcodeType || 'CODE39'}
                onChange={(e) => updateElement(element.id, { barcodeType: e.target.value })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                {BARCODE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {element.type === 'qrcode' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              QR Code Data
            </label>
            <input
              type="text"
              value={element.data || ''}
              onChange={(e) => updateElement(element.id, { data: e.target.value })}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="URL or text"
            />
          </div>
        )}

        <button
          onClick={() => deleteElement(element.id)}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Delete Element
        </button>
      </div>
    );
  };

  return (
    <div className="h-full flex bg-gray-900">
      {/* Element Palette */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
        <div className="p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Elements</h2>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
            >
              Templates
            </button>
          </div>
          
          {showTemplates && (
            <div className="mb-4 p-3 bg-gray-700 rounded-lg">
              <h3 className="text-sm font-bold text-white mb-2">Quick Templates</h3>
              <div className="space-y-2">
                <button
                  onClick={() => loadTemplate('basic')}
                  className="w-full text-left text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded"
                >
                  Basic Receipt
                </button>
                <button
                  onClick={() => loadTemplate('detailed')}
                  className="w-full text-left text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded"
                >
                  Detailed Receipt
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto px-4">
          <div className="space-y-2">
            {ELEMENT_TEMPLATES.map((template) => (
              <button
                key={template.type}
                onClick={() => addElement(template)}
                className="w-full flex items-center space-x-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
              >
                <span className="text-xl">{template.icon}</span>
                <span className="text-white">{template.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 flex-shrink-0 border-t border-gray-600">
          <button
            onClick={() => setElements([])}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Receipt Canvas */}
      <div className="flex-1 flex">
        <div className="flex-1 p-4 overflow-hidden">
          <h2 className="text-xl font-bold text-white mb-4">Receipt Preview</h2>
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm mx-auto h-full max-h-[calc(100vh-8rem)] overflow-y-auto">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="receipt">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="min-h-full">
                    {elements.map((element, index) => (
                      <Draggable
                        key={element.id}
                        draggableId={element.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`
                              p-2 mb-1 rounded cursor-pointer border-2 transition-colors
                              ${selectedElement === element.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-transparent hover:border-gray-300'
                              }
                              ${snapshot.isDragging ? 'shadow-lg' : ''}
                            `}
                            onClick={() => setSelectedElement(element.id)}
                          >
                            {renderElementPreview(element)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col h-full">
          <div className="p-4 flex-shrink-0">
            <h2 className="text-lg font-bold text-white mb-4">Properties</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {renderPropertyPanel()}
          </div>
        </div>
      </div>
    </div>
  );
};