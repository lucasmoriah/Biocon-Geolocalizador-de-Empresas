import React, { useState } from 'react';
import { Plus, Map as MapIcon, Table2, Settings2, X, MapPin } from 'lucide-react';
import { MapView } from './components/MapView';
import { DataTable } from './components/DataTable';
import { LocationEntry } from './types';
import { fetchCepData } from './services/cepService';

const App: React.FC = () => {
  const [entries, setEntries] = useState<LocationEntry[]>([]);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  
  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditLocation, setCurrentEditLocation] = useState<LocationEntry | null>(null);

  const handleAddEntry = () => {
    const newEntry: LocationEntry = {
      id: crypto.randomUUID(),
      name: '',
      companyType: '',
      description: '',
      cep: '',
      latitude: '',
      longitude: '',
      radius: 0,
    };
    setEntries(prev => [...prev, newEntry]);
  };

  const handleUpdateEntry = (id: string, field: keyof LocationEntry, value: string | number) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
    
    // Update local modal state if open
    if (currentEditLocation && currentEditLocation.id === id) {
        setCurrentEditLocation(prev => prev ? ({ ...prev, [field]: value }) : null);
    }
  };

  const handleRemoveEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const handleCepBlur = async (id: string, cep: string) => {
    if (!cep || cep.length < 8) return;

    const data = await fetchCepData(cep);

    if (data) {
      const lat = data.location?.coordinates?.latitude || '';
      const lng = data.location?.coordinates?.longitude || '';
      
      setEntries(prev => prev.map(entry => {
        if (entry.id === id) {
            // Only update fields if they are empty or auto-update is desired
            const autoDesc = `${data.street || ''}, ${data.neighborhood || ''} - ${data.city}/${data.state}`;
            
            return {
            ...entry,
            latitude: lat || entry.latitude,
            longitude: lng || entry.longitude,
            description: entry.description || autoDesc,
            isAutoFilled: !!lat
          };
        }
        return entry;
      }));
    }
  };

  const openEditModal = (entry: LocationEntry) => {
    setCurrentEditLocation(entry);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
      setIsEditModalOpen(false);
      setCurrentEditLocation(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-2 rounded-lg">
             <MapIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2 text-xl tracking-tight select-none">
             <span className="font-bold text-emerald-600">Bioconverter</span>
             <span className="text-gray-300 font-light text-2xl">|</span>
             <span className="font-semibold text-gray-700">GeoLocalizador</span>
          </div>
        </div>

        <button
            onClick={() => setIsManagerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all hover:shadow-md"
        >
            <Settings2 className="w-4 h-4" />
            <span>Gerenciar Empresas</span>
        </button>
      </header>

      {/* Main Content: Map Always Visible */}
      <main className="flex-1 relative z-0">
        <MapView locations={entries} />
        
        {/* Floating Stat Card (Updated Position and Text) */}
        <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 pointer-events-none">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">LOCAIS ATIVOS</div>
            <div className="text-2xl font-bold text-gray-900">{entries.length}</div>
        </div>
      </main>

      {/* Management Modal (Full Screen / Large) */}
      {isManagerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50/50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-black/20" onClick={() => setIsManagerOpen(false)} />
            
            <div className="flex-1 m-4 md:m-8 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Table2 className="w-5 h-5 text-gray-400" />
                            Gestão de Empresas
                        </h2>
                        <p className="text-sm text-gray-500">Adicione, edite e configure as áreas de atuação dos seus pontos.</p>
                    </div>
                    <div className="flex items-center gap-3">
                         <button
                            onClick={handleAddEntry}
                            className="flex items-center gap-1.5 px-3 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-sm font-medium rounded-md transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Nova Empresa
                        </button>
                        <div className="h-8 w-px bg-gray-200 mx-1"></div>
                        <button 
                            onClick={() => setIsManagerOpen(false)}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-hidden bg-gray-50">
                    <DataTable 
                        entries={entries}
                        onUpdate={handleUpdateEntry}
                        onRemove={handleRemoveEntry}
                        onCepBlur={handleCepBlur}
                        onEdit={openEditModal}
                    />
                </div>
                
                {/* Modal Footer */}
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
                    <span>As alterações são salvas automaticamente no banco de dados local.</span>
                    <span>Total: {entries.length} registros</span>
                </div>
            </div>
        </div>
      )}

      {/* Single Entry Edit Modal */}
      {isEditModalOpen && currentEditLocation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeEditModal} />
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">Editar Empresa</h3>
                      <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-500">Nome</label>
                              <input 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                value={currentEditLocation.name}
                                onChange={e => handleUpdateEntry(currentEditLocation.id, 'name', e.target.value)}
                              />
                          </div>
                           <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-500">Tipo</label>
                              <input 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                value={currentEditLocation.companyType}
                                onChange={e => handleUpdateEntry(currentEditLocation.id, 'companyType', e.target.value)}
                              />
                          </div>
                      </div>

                      <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500">Descrição / Endereço</label>
                          <textarea 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                            rows={3}
                            value={currentEditLocation.description}
                            onChange={e => handleUpdateEntry(currentEditLocation.id, 'description', e.target.value)}
                          />
                      </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-500">CEP</label>
                              <input 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                value={currentEditLocation.cep}
                                onChange={e => handleUpdateEntry(currentEditLocation.id, 'cep', e.target.value)}
                                onBlur={e => handleCepBlur(currentEditLocation.id, e.target.value)}
                              />
                          </div>
                           <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-500">Raio (km)</label>
                              <input 
                                type="number"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                value={currentEditLocation.radius}
                                onChange={e => handleUpdateEntry(currentEditLocation.id, 'radius', Number(e.target.value))}
                              />
                          </div>
                      </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50 flex justify-end gap-2">
                      <button onClick={closeEditModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancelar</button>
                      <button onClick={closeEditModal} className="px-4 py-2 text-sm bg-brand-600 text-white hover:bg-brand-700 rounded-lg">Concluir</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;