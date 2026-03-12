import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Map as MapIcon, Table2, Settings2, X, Loader2 } from 'lucide-react';
import { MapView } from './components/MapView';
import { DataTable } from './components/DataTable';
import { UnifiedEntry, LocationEntry, ESTADOS_BRASIL } from './types'; 
import { fetchCepData } from './services/cepService';
import { locationService } from './services/locationService';

const App: React.FC = () => {
  const [unifiedEntries, setUnifiedEntries] = useState<UnifiedEntry[]>([]);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
        const data = await locationService.getAll();
        setUnifiedEntries(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  // Esta função gerencia se é insert ou update
  const handleSaveOrUpdate = async (entry: UnifiedEntry, isUpdate: boolean) => {
      setLoading(true);
      try {
          if (isUpdate) {
              // Lógica de Atualização
              await locationService.update(entry.id, entry);
          } else {
              // Lógica de Inserção
              await locationService.create(entry);
          }
          // Recarrega tudo para garantir sincronia com BD
          await loadAllData();
      } catch (e) {
          alert("Erro ao salvar operação.");
          console.error(e);
          setLoading(false);
      }
  };

  const handleRemoveEntry = async (id: string) => {
      // Confirmação já foi feita no componente DataTable
      setLoading(true);
      try {
          await locationService.delete(id);
          setUnifiedEntries(prev => prev.filter(e => e.id !== id));
      } catch (e) {
          alert("Erro ao excluir do banco");
          loadAllData(); // Reverte em caso de erro
      } finally {
          setLoading(false);
      }
  };

  const handleCepLookup = async (cep: string) => {
    const data = await fetchCepData(cep);
    if (data) {
        const lat = data.location?.coordinates?.latitude || '';
        const lng = data.location?.coordinates?.longitude || '';
        const estado = data.state || '';
        
        // Verifica se estado é valido
        const validState = estado && ESTADOS_BRASIL.includes(estado) ? estado : '';
        return { lat: String(lat), lng: String(lng), uf: validState };
    }
    return null;
  };

  // Mapeamento para visualização no Mapa
  const mapLocations: LocationEntry[] = useMemo(() => {
      return unifiedEntries.map(e => ({
          id: e.id,
          name: e.nome,
          description: e.detalhe,
          cep: e.cep,
          estado: e.estado,
          latitude: e.latitude,
          longitude: e.longitude,
          radius: e.radius,
          entityType: e.type,
          companyType: e.type === 'aterros' ? 'Aterro/Polo' : e.type === 'clientes' ? 'Cliente' : 'Técnico'
      }));
  }, [unifiedEntries]);

  // Stats
  const stats = useMemo(() => {
      return {
          aterros: unifiedEntries.filter(e => e.type === 'aterros').length,
          clientes: unifiedEntries.filter(e => e.type === 'clientes').length,
          tecnicos: unifiedEntries.filter(e => e.type === 'tecnicos').length
      }
  }, [unifiedEntries]);

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
            <span>Gerenciar Operação</span>
        </button>
      </header>

      {/* Main Content: Map */}
      <main className="flex-1 relative z-0">
        <MapView locations={mapLocations} />
        
        {/* Floating Stat Card */}
        <div className="absolute bottom-6 right-4 z-[400] bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200 pointer-events-none min-w-[180px]">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2 pb-1 border-b">REGISTROS ATIVOS</div>
            <div className="flex flex-col gap-1 text-sm font-medium text-gray-800">
                <div className="flex justify-between"><span>Aterros:</span> <span>{stats.aterros}</span></div>
                <div className="flex justify-between"><span>Clientes:</span> <span>{stats.clientes}</span></div>
                <div className="flex justify-between"><span>Técnicos:</span> <span>{stats.tecnicos}</span></div>
            </div>
        </div>
      </main>

      {/* Management Modal */}
      {isManagerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50/50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-black/20" onClick={() => setIsManagerOpen(false)} />
            
            <div className="flex-1 m-4 md:m-8 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
                {/* Modal Header */}
                <div className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center shrink-0">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Table2 className="w-5 h-5 text-gray-400" />
                        Gestão Operacional Integrada
                    </h2>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsManagerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden bg-white relative flex flex-col">
                    {loading && <div className="absolute inset-0 z-50 bg-white/50 flex items-center justify-center"><Loader2 className="animate-spin text-brand-600"/></div>}
                    <DataTable 
                        entries={unifiedEntries}
                        onSave={handleSaveOrUpdate}
                        onDelete={handleRemoveEntry}
                        onCepBlur={handleCepLookup}
                    />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;