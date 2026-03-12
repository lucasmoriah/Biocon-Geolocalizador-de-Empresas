import React, { useState, useEffect } from 'react';
import { UnifiedEntry, EntityType, ESTADOS_BRASIL } from '../types';
import { Trash2, Edit, MapPin, Save, Search, Eraser, CheckCircle } from 'lucide-react';

interface DataTableProps {
  entries: UnifiedEntry[];
  onSave: (entry: UnifiedEntry, isUpdate: boolean) => Promise<void>;
  onDelete: (id: string) => void;
  onCepBlur: (cep: string) => Promise<{ lat: string; lng: string; uf: string } | null>;
}

const INITIAL_FORM: UnifiedEntry = {
    id: '',
    type: 'aterros',
    nome: '',
    detalhe: '',
    contato: '',
    cep: '',
    estado: '',
    latitude: '',
    longitude: '',
    radius: 0
};

export const DataTable: React.FC<DataTableProps> = ({ entries, onSave, onDelete, onCepBlur }) => {
  // State for the Form
  const [formData, setFormData] = useState<UnifiedEntry>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // State for Search
  const [searchTerm, setSearchTerm] = useState('');

  // Handle Input Changes
  const handleInputChange = (field: keyof UnifiedEntry, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle CEP Blur to auto-fill
  const handleCep = async () => {
      if (formData.cep.length >= 8) {
          const data = await onCepBlur(formData.cep);
          if (data) {
              setFormData(prev => ({
                  ...prev,
                  latitude: data.lat,
                  longitude: data.lng,
                  estado: data.uf
              }));
          }
      }
  };

  // Function to Load Record into Form (Edit Mode)
  const handleEdit = (entry: UnifiedEntry) => {
      setFormData({ ...entry });
      setEditingId(entry.id);
      
      // Scroll to top to show form
      const formElement = document.getElementById('management-form');
      if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to Reset Form
  const handleReset = () => {
      setFormData(INITIAL_FORM);
      setEditingId(null);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.nome || !formData.type) {
          alert("Por favor, preencha o nome e o tipo.");
          return;
      }

      // Logic: If editingId exists -> Update, Else -> Create
      const isUpdate = !!editingId;
      
      await onSave(formData, isUpdate);
      handleReset();
  };

  // Delete Handler with Confirmation
  const handleDeleteClick = (id: string) => {
      const confirmDelete = window.confirm("Tem certeza que deseja excluir este registro permanentemente?");
      if (confirmDelete) {
          onDelete(id);
      }
  };

  // Filter Entries
  const filteredEntries = entries.filter(e => 
      e.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.detalhe.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      
      {/* 1. FORM SECTION */}
      <div id="management-form" className="bg-white border-b border-gray-200 p-6 shadow-sm z-10">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                {editingId ? <Edit size={20} className="text-brand-600"/> : <CheckCircle size={20} className="text-green-600"/>}
                {editingId ? 'Editar Registro' : 'Novo Registro'}
            </h3>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Tipo */}
                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo</label>
                    <select 
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm bg-white text-gray-900"
                        value={formData.type}
                        onChange={e => handleInputChange('type', e.target.value)}
                    >
                        <option value="aterros">Aterro / Polo</option>
                        <option value="clientes">Cliente</option>
                        <option value="tecnicos">Técnico</option>
                    </select>
                </div>

                {/* Nome */}
                <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                        {formData.type === 'clientes' ? 'Razão Social' : 'Nome'}
                    </label>
                    <input 
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 text-sm bg-white text-gray-900"
                        placeholder="Nome principal"
                        value={formData.nome}
                        onChange={e => handleInputChange('nome', e.target.value)}
                        required
                    />
                </div>

                {/* Detalhe */}
                <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                        {formData.type === 'clientes' ? 'CNPJ' : formData.type === 'tecnicos' ? 'Especialidade' : 'Localização'}
                    </label>
                    <input 
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 text-sm bg-white text-gray-900"
                        value={formData.detalhe}
                        onChange={e => handleInputChange('detalhe', e.target.value)}
                    />
                </div>

                {/* Contato */}
                <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Contato</label>
                    <input 
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 text-sm bg-white text-gray-900"
                        placeholder="Tel / Email"
                        value={formData.contato}
                        onChange={e => handleInputChange('contato', e.target.value)}
                    />
                </div>

                {/* CEP */}
                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">CEP</label>
                    <input 
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 text-sm font-mono bg-white text-gray-900"
                        placeholder="00000-000"
                        value={formData.cep}
                        onChange={e => handleInputChange('cep', e.target.value)}
                        onBlur={handleCep}
                    />
                </div>

                {/* Estado */}
                <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">UF</label>
                    <select 
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 text-sm bg-white text-gray-900"
                        value={formData.estado}
                        onChange={e => handleInputChange('estado', e.target.value)}
                    >
                        <option value="">--</option>
                        {ESTADOS_BRASIL.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                </div>

                {/* Lat/Lng */}
                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Latitude</label>
                    <input className="w-full p-2 border border-gray-300 rounded text-xs bg-white text-gray-900" value={formData.latitude} onChange={e => handleInputChange('latitude', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Longitude</label>
                    <input className="w-full p-2 border border-gray-300 rounded text-xs bg-white text-gray-900" value={formData.longitude} onChange={e => handleInputChange('longitude', e.target.value)} />
                </div>

                 {/* Raio */}
                 <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Raio de Atuação</label>
                    <select 
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 text-sm bg-white text-gray-900"
                        value={formData.radius}
                        onChange={e => handleInputChange('radius', Number(e.target.value))}
                    >
                        <option value={0}>Sem área</option>
                        <option value={50}>50 km</option>
                        <option value={100}>100 km</option>
                        <option value={150}>150 km</option>
                        <option value={300}>300 km</option>
                    </select>
                </div>

                {/* Actions Form */}
                <div className="md:col-span-3 flex items-end gap-2">
                    <button 
                        type="submit" 
                        className={`flex-1 py-2 px-4 rounded text-white font-medium shadow-sm transition-colors flex items-center justify-center gap-2 ${editingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {editingId ? <Save size={18} /> : <CheckCircle size={18} />}
                        {editingId ? 'Atualizar Dados' : 'Salvar Registro'}
                    </button>
                    
                    {editingId && (
                        <button 
                            type="button"
                            onClick={handleReset}
                            className="py-2 px-3 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 font-medium"
                            title="Cancelar Edição"
                        >
                            <Eraser size={18} />
                        </button>
                    )}
                </div>

            </form>
          </div>
      </div>

      {/* 2. LIST SECTION */}
      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
            
            {/* Search Bar */}
            <div className="mb-4 flex items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm w-full md:w-1/3">
                <Search className="text-gray-400 ml-2" size={20} />
                <input 
                    className="w-full p-1 ml-2 outline-none text-sm text-gray-900 bg-transparent"
                    placeholder="Buscar na lista..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3">Tipo</th>
                            <th className="px-6 py-3">Nome</th>
                            <th className="px-6 py-3">UF</th>
                            <th className="px-6 py-3">Detalhes</th>
                            <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredEntries.length === 0 ? (
                             <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <MapPin size={32} className="opacity-20" />
                                        <span>Nenhum registro encontrado.</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredEntries.map(entry => (
                                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                                            entry.type === 'aterros' ? 'bg-gray-100 text-gray-600' :
                                            entry.type === 'clientes' ? 'bg-green-100 text-green-700' :
                                            'bg-orange-100 text-orange-700'
                                        }`}>
                                            {entry.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{entry.nome}</td>
                                    <td className="px-6 py-4">{entry.estado}</td>
                                    <td className="px-6 py-4 text-xs">
                                        <div className="flex flex-col">
                                            <span>{entry.detalhe}</span>
                                            <span className="text-gray-400">{entry.cep}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleEdit(entry)}
                                                className="p-2 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteClick(entry.id)}
                                                className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};
