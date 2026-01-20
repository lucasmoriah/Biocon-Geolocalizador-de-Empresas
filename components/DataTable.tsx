import React, { useState, useRef, useEffect } from 'react';
import { LocationEntry } from '../types';
import { Trash2, MapPin, Search, Edit2, Save, X, GripVertical } from 'lucide-react';

interface DataTableProps {
  entries: LocationEntry[];
  onUpdate: (id: string, field: keyof LocationEntry, value: string | number) => void;
  onRemove: (id: string) => void;
  onCepBlur: (id: string, cep: string) => void;
  onEdit: (entry: LocationEntry) => void;
}

const RADIUS_OPTIONS = [
    { value: 0, label: 'Sem área', color: 'text-gray-500', bg: 'bg-gray-100', dot: '#6b7280' },
    { value: 50, label: '50 km', color: 'text-green-700', bg: 'bg-green-50', dot: '#22c55e' },
    { value: 100, label: '100 km', color: 'text-blue-700', bg: 'bg-blue-50', dot: '#3b82f6' },
    { value: 150, label: '150 km', color: 'text-yellow-700', bg: 'bg-yellow-50', dot: '#eab308' },
    { value: 300, label: '300 km', color: 'text-red-700', bg: 'bg-red-50', dot: '#ef4444' },
];

export const DataTable: React.FC<DataTableProps> = ({ entries, onUpdate, onRemove, onCepBlur, onEdit }) => {
  const [savedRows, setSavedRows] = useState<Set<string>>(new Set());
  
  // Column width state
  const [columnWidths, setColumnWidths] = useState({
      name: 200,
      type: 150,
      cep: 120,
      location: 180,
      radius: 180,
      actions: 120
  });

  const [resizing, setResizing] = useState<{ col: keyof typeof columnWidths, startX: number, startWidth: number } | null>(null);

  const handleSave = (id: string) => {
    setSavedRows(prev => new Set(prev).add(id));
    setTimeout(() => {
        setSavedRows(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, 2000);
  };

  const handleDelete = (id: string) => {
      if (window.confirm("Tem certeza que deseja excluir esta empresa?")) {
          onRemove(id);
      }
  };

  // Resizing logic
  const startResize = (e: React.MouseEvent, col: keyof typeof columnWidths) => {
      e.preventDefault();
      setResizing({ col, startX: e.clientX, startWidth: columnWidths[col] });
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (resizing) {
              const diff = e.clientX - resizing.startX;
              setColumnWidths(prev => ({
                  ...prev,
                  [resizing.col]: Math.max(50, resizing.startWidth + diff)
              }));
          }
      };

      const handleMouseUp = () => {
          setResizing(null);
      };

      if (resizing) {
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
      }

      return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
      };
  }, [resizing]);

  const ResizeHandle = ({ col }: { col: keyof typeof columnWidths }) => (
      <div 
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-400 group-hover:bg-brand-200 z-20 flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-50 transition-opacity"
          onMouseDown={(e) => startResize(e, col)}
      >
          <div className="w-0.5 h-full bg-transparent"></div>
      </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="text-sm text-left text-gray-500 border-collapse table-fixed" style={{ minWidth: '100%' }}>
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
                <th scope="col" className="px-4 py-3 border-b border-r border-gray-200 relative group" style={{ width: columnWidths.name }}>
                    Empresa
                    <ResizeHandle col="name" />
                </th>
                <th scope="col" className="px-4 py-3 border-b border-r border-gray-200 relative group" style={{ width: columnWidths.type }}>
                    Tipo
                    <ResizeHandle col="type" />
                </th>
                <th scope="col" className="px-4 py-3 border-b border-r border-gray-200 relative group" style={{ width: columnWidths.cep }}>
                    CEP
                    <ResizeHandle col="cep" />
                </th>
                <th scope="col" className="px-4 py-3 border-b border-r border-gray-200 relative group" style={{ width: columnWidths.location }}>
                    Localização
                    <ResizeHandle col="location" />
                </th>
                <th scope="col" className="px-4 py-3 border-b border-r border-gray-200 relative group" style={{ width: columnWidths.radius }}>
                    Raio de Atuação
                    <ResizeHandle col="radius" />
                </th>
                <th scope="col" className="px-4 py-3 border-b border-gray-200 text-center relative group" style={{ width: columnWidths.actions }}>
                    Ações
                    <ResizeHandle col="actions" />
                </th>
            </tr>
            </thead>
            <tbody>
            {entries.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <MapPin size={24} className="opacity-50" />
                            </div>
                            <p className="font-medium">Nenhuma empresa cadastrada</p>
                            <p className="text-xs max-w-[200px]">Adicione uma nova empresa para começar a gerenciar sua logística.</p>
                        </div>
                    </td>
                </tr>
            ) : (
                entries.map((entry) => {
                    const preset = RADIUS_OPTIONS.find(r => r.value === entry.radius);
                    const isCustom = !preset && entry.radius > 0;
                    const isSaved = savedRows.has(entry.id);
                    
                    return (
                    <tr key={entry.id} className="bg-white border-b hover:bg-gray-50 transition-colors group">
                        {/* Company Name */}
                        <td className="p-0 border-r border-gray-100 overflow-hidden">
                            <input
                                type="text"
                                className="w-full h-full px-4 py-3 bg-transparent border-none focus:ring-inset focus:ring-2 focus:ring-brand-500 text-gray-900 font-medium placeholder-gray-300 truncate"
                                placeholder="Nome da empresa"
                                value={entry.name}
                                onChange={(e) => onUpdate(entry.id, 'name', e.target.value)}
                            />
                        </td>
                        
                        {/* Type */}
                        <td className="p-0 border-r border-gray-100 overflow-hidden">
                             <input
                                type="text"
                                className="w-full h-full px-4 py-3 bg-transparent border-none focus:ring-inset focus:ring-2 focus:ring-brand-500 text-gray-700 placeholder-gray-300 truncate"
                                placeholder="Ex: Varejo, CD..."
                                value={entry.companyType}
                                onChange={(e) => onUpdate(entry.id, 'companyType', e.target.value)}
                            />
                        </td>

                        {/* CEP */}
                        <td className="p-0 border-r border-gray-100 relative overflow-hidden">
                            <input
                                type="text"
                                maxLength={9}
                                className={`w-full h-full px-4 py-3 bg-transparent border-none focus:ring-inset focus:ring-2 focus:ring-brand-500 font-mono text-xs ${entry.isAutoFilled ? 'text-green-700 font-semibold' : 'text-gray-600'}`}
                                placeholder="00000-000"
                                value={entry.cep}
                                onChange={(e) => onUpdate(entry.id, 'cep', e.target.value)}
                                onBlur={(e) => onCepBlur(entry.id, e.target.value)}
                            />
                        </td>

                        {/* Lat / Long */}
                        <td className="p-2 border-r border-gray-100 overflow-hidden">
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    className="w-1/2 bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-brand-500 focus:outline-none font-mono text-[10px]"
                                    placeholder="Lat"
                                    value={entry.latitude}
                                    onChange={(e) => onUpdate(entry.id, 'latitude', e.target.value)}
                                />
                                <input
                                    type="number"
                                    className="w-1/2 bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-brand-500 focus:outline-none font-mono text-[10px]"
                                    placeholder="Long"
                                    value={entry.longitude}
                                    onChange={(e) => onUpdate(entry.id, 'longitude', e.target.value)}
                                />
                            </div>
                        </td>

                        {/* Radius Selector */}
                        <td className="p-2 border-r border-gray-100 overflow-hidden">
                            {isCustom ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 relative">
                                        <input 
                                            type="number" 
                                            autoFocus
                                            className="w-full bg-purple-50 border border-purple-200 text-purple-700 rounded pl-2 pr-6 py-1.5 focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs font-semibold"
                                            value={entry.radius}
                                            onChange={(e) => onUpdate(entry.id, 'radius', Number(e.target.value))}
                                        />
                                        <span className="absolute right-2 top-1.5 text-[10px] text-purple-400">km</span>
                                    </div>
                                    <button 
                                        onClick={() => onUpdate(entry.id, 'radius', 0)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded"
                                        title="Cancelar personalizado"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <select 
                                    className={`w-full px-2 py-1.5 border rounded text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500
                                        ${preset ? preset.bg : 'bg-white'} 
                                        ${preset ? preset.color : 'text-gray-700'} 
                                        ${preset ? `border-${preset.color.split('-')[1]}-200` : 'border-gray-200'}
                                    `}
                                    value={entry.radius}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'custom') {
                                            onUpdate(entry.id, 'radius', 10);
                                        } else {
                                            onUpdate(entry.id, 'radius', Number(val));
                                        }
                                    }}
                                >
                                    {RADIUS_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value} className="bg-white text-gray-900">
                                            {opt.label}
                                        </option>
                                    ))}
                                    <option value="custom" className="text-purple-600 font-semibold">🟣 Personalizado...</option>
                                </select>
                            )}
                        </td>

                        {/* Actions */}
                        <td className="p-2 text-center overflow-hidden">
                            <div className="flex items-center justify-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onEdit(entry)}
                                    className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                                    title="Editar detalhes"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleSave(entry.id)}
                                    className={`p-1.5 rounded transition-colors ${isSaved ? 'text-green-600 bg-green-50' : 'text-gray-500 hover:text-brand-600 hover:bg-brand-50'}`}
                                    title="Salvar alterações"
                                >
                                    <Save size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                    );
                })
            )}
            </tbody>
        </table>
      </div>
    </div>
  );
};