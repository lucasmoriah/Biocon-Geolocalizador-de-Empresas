import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { LocationEntry, EntityType, ESTADOS_BRASIL } from '../types';
import { Layers, CircleDot, Map as MapIcon, Eye, EyeOff, Navigation, ChevronRight, Loader2 } from 'lucide-react';

// Cores Oficiais Modernas
const COLORS = {
  clientes: '#10b981', // Emerald-500
  aterros: '#f59e0b',  // Amber-500
  tecnicos: '#3b82f6', // Blue-500
};

// Ícone PIN Moderno com SVG embutido
const getPinIcon = (type: EntityType) => {
  const color = COLORS[type] || '#64748b';
  const width = 40;
  const height = 50;

  // Caminhos SVG dos ícones internos (Lucide style)
  let innerIconPath = '';
  
  if (type === 'clientes') {
      // Building / Store Icon
      innerIconPath = `
        <path d="M3 21h18M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14M8 21V11a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      `;
  } else if (type === 'aterros') {
      // Factory / Industry Icon
      innerIconPath = `
        <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 18h1" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <path d="M12 18h1" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 18h1" stroke="white" stroke-width="2" stroke-linecap="round"/>
      `;
  } else if (type === 'tecnicos') {
      // User Icon
      innerIconPath = `
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="7" r="4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="${width}" height="${height}" fill="none">
      <defs>
        <filter id="shadow-${type}" x="-50%" y="-20%" width="200%" height="150%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <g filter="url(#shadow-${type})">
          <!-- Pin Shape -->
          <path d="M16 0C7.163 0 0 7.163 0 16c0 9 16 26 16 26s16-17 16-26C32 7.163 24.837 0 16 0z" fill="${color}" stroke="white" stroke-width="2"/>
      </g>
      <!-- Inner Icon Container -->
      <g transform="translate(4, 4)">
        ${innerIconPath}
      </g>
    </svg>
  `;
  
  return L.divIcon({
    className: 'custom-pin-marker',
    html: svg,
    iconSize: [width, height],
    iconAnchor: [width / 2, height], // Tip of the pin at bottom center
    popupAnchor: [0, -height + 10], 
  });
};

interface MapViewProps {
  locations: LocationEntry[];
}

// Componente para rastrear o Zoom e recentralizar
const MapController = ({ 
    locations, 
    onZoomChange 
}: { 
    locations: LocationEntry[], 
    onZoomChange: (z: number) => void 
}) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    }
  });

  // Recenter logic (only on init or drastic changes)
  useEffect(() => {
    if (locations.length > 0) {
      const validLocs = locations.filter(l => !isNaN(Number(l.latitude)) && !isNaN(Number(l.longitude)));
      if (validLocs.length > 0) {
        const bounds = L.latLngBounds(validLocs.map(l => [Number(l.latitude), Number(l.longitude)]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    }
  }, [locations, map]);

  return null;
};

// Componente Interno do Popup para acessar o contexto do Mapa e executar ações
const PopupActions = ({ 
    lat, 
    lng, 
    showRadius, 
    setShowRadius 
}: { 
    lat: number; 
    lng: number; 
    showRadius: boolean; 
    setShowRadius: (v: boolean) => void;
}) => {
    const map = useMap();
    
    return (
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-gray-100">
            <button 
                onClick={() => {
                    map.flyTo([lat, lng], 14, { duration: 1.5 });
                }}
                className="flex items-center justify-center gap-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded transition-colors font-medium"
            >
                <MapIcon size={12} /> Centralizar
            </button>
            <button
                onClick={() => setShowRadius(!showRadius)}
                className={`flex items-center justify-center gap-1 text-[10px] py-1.5 rounded transition-colors font-medium ${showRadius ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
                {showRadius ? <EyeOff size={12} /> : <Eye size={12} />}
                {showRadius ? 'Ocultar' : 'Ver Raio'}
            </button>
        </div>
    );
};

export const MapView: React.FC<MapViewProps> = ({ locations }) => {
  const mapRef = useRef<L.Map>(null); // Referência para o mapa para controle externo
  const [showRadius, setShowRadius] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(4);
  const [activeType, setActiveType] = useState<EntityType | 'all'>('all');

  // Estados para Navegação (Painel Novo)
  const [navUf, setNavUf] = useState('');
  const [navCity, setNavCity] = useState('');
  const [cityList, setCityList] = useState<{nome: string}[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Filtrar locais inválidos e ordenar por prioridade visual
  const validLocations = useMemo(() => {
    return locations
      .filter(
        loc => 
          loc.latitude !== '' && 
          loc.longitude !== '' && 
          !isNaN(Number(loc.latitude)) && 
          !isNaN(Number(loc.longitude)) &&
          (activeType === 'all' || loc.entityType === activeType)
      )
      .sort((a, b) => {
          const priority = { aterros: 1, clientes: 2, tecnicos: 3 };
          return priority[a.entityType] - priority[b.entityType];
      });
  }, [locations, activeType]);

  const shouldRenderRadius = showRadius && zoomLevel >= 8;

  // Carregar Cidades do IBGE ao selecionar UF
  useEffect(() => {
    if (navUf) {
        setIsLoadingCities(true);
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${navUf}/municipios`)
            .then(res => res.json())
            .then(data => {
                setCityList(data.sort((a: any, b: any) => a.nome.localeCompare(b.nome)));
                setNavCity('');
            })
            .catch(err => console.error("Erro ao buscar cidades", err))
            .finally(() => setIsLoadingCities(false));
    } else {
        setCityList([]);
        setNavCity('');
    }
  }, [navUf]);

  // Função para voar para a cidade (Usando Nominatim do OSM)
  const handleCityNavigation = async (cityName: string) => {
      setNavCity(cityName);
      if (!cityName || !navUf || !mapRef.current) return;

      setIsNavigating(true);
      try {
          // Busca coordenadas da cidade
          const query = `${cityName}, ${navUf}, Brazil`;
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
          const data = await response.json();

          if (data && data.length > 0) {
              const { lat, lon } = data[0];
              mapRef.current.flyTo([Number(lat), Number(lon)], 12, { duration: 2 });
          }
      } catch (error) {
          console.error("Erro ao geocodificar cidade:", error);
      } finally {
          setIsNavigating(false);
      }
  };

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        ref={mapRef}
        center={[-15.793889, -47.882778]} 
        zoom={4} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        maxZoom={18}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapController locations={locations} onZoomChange={setZoomLevel} />

        {/* CLUSTER GROUP para os PINOS */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
        >
          {validLocations.map((loc) => (
            <Marker 
                key={`marker-${loc.id}`}
                position={[Number(loc.latitude), Number(loc.longitude)]} 
                icon={getPinIcon(loc.entityType)}
            >
                <Popup>
                    <div className="p-1 min-w-[220px]">
                        <div className="flex items-center gap-2 mb-2">
                             <span className="w-2 h-8 rounded-sm" style={{ backgroundColor: COLORS[loc.entityType] }}></span>
                             <div>
                                <h3 className="font-bold text-gray-900 leading-tight">{loc.name || 'Sem nome'}</h3>
                                <span className="text-xs font-semibold text-gray-500 uppercase">{loc.companyType}</span>
                             </div>
                        </div>
                        
                        <div className="bg-gray-50 p-2 rounded border border-gray-100 mb-2">
                            <p className="text-sm text-gray-700 font-medium mb-1">{loc.description}</p>
                            <div className="text-xs text-gray-500 font-mono">
                                {loc.estado ? `${loc.estado}, ` : ''}{loc.cep}
                            </div>
                        </div>

                        {loc.radius > 0 && (
                            <div className="flex items-center justify-between text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
                                <span className="flex items-center gap-1">
                                    <CircleDot size={12} /> Raio de atuação
                                </span>
                                <span className="font-bold">{loc.radius} km</span>
                            </div>
                        )}

                        <PopupActions 
                            lat={Number(loc.latitude)} 
                            lng={Number(loc.longitude)} 
                            showRadius={showRadius}
                            setShowRadius={setShowRadius}
                        />
                    </div>
                </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {/* CAMADA DE RAIOS */}
        {shouldRenderRadius && validLocations.map(loc => {
             if (loc.radius <= 0) return null;
             
             return (
                <Circle 
                    key={`circle-${loc.id}`}
                    center={[Number(loc.latitude), Number(loc.longitude)]}
                    radius={loc.radius * 1000}
                    pathOptions={{ 
                        fillColor: COLORS[loc.entityType], 
                        color: COLORS[loc.entityType], 
                        weight: 1, 
                        opacity: 0.5,
                        fillOpacity: 0.15 
                    }}
                    eventHandlers={{
                        click: (e) => {
                            e.target._map.setView(e.latlng, Math.max(e.target._map.getZoom(), 12));
                        }
                    }}
                />
             );
        })}

      </MapContainer>

      {/* PAINEL DE CONTROLES (Direita) */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 w-64 pointer-events-none">
          
          {/* 1. Toggle de Raio */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden pointer-events-auto">
             <button 
                onClick={() => setShowRadius(!showRadius)}
                className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-sm font-semibold transition-colors ${showRadius ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
             >
                <div className="flex items-center gap-2">
                    {showRadius ? <Eye size={18} className="text-indigo-600"/> : <EyeOff size={18} />}
                    <span>Raios de Atuação</span>
                </div>
                
                <div className={`w-8 h-4 rounded-full relative transition-colors ${showRadius ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${showRadius ? 'left-4.5' : 'left-0.5'}`} style={{ left: showRadius ? '18px' : '2px' }} />
                </div>
             </button>
             
             {showRadius && zoomLevel < 8 && (
                 <div className="px-4 py-2 bg-yellow-50 text-xs text-yellow-700 border-t border-yellow-100 flex items-center gap-1">
                    <span>⚠️ Aproxime para ver raios</span>
                 </div>
             )}
          </div>

          {/* 2. Filtro de Tipo */}
          <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-200 pointer-events-auto">
             <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 px-1">Filtrar Entidade</h4>
             <div className="flex flex-col gap-1">
                <button 
                    onClick={() => setActiveType('all')}
                    className={`text-xs px-2 py-1.5 rounded flex items-center gap-2 ${activeType === 'all' ? 'bg-gray-100 font-bold text-gray-900' : 'hover:bg-gray-50 text-gray-600'}`}
                >
                    <Layers size={14} /> Todos
                </button>
                <button 
                    onClick={() => setActiveType('clientes')}
                    className={`text-xs px-2 py-1.5 rounded flex items-center gap-2 ${activeType === 'clientes' ? 'bg-emerald-50 font-bold text-emerald-700' : 'hover:bg-gray-50 text-gray-600'}`}
                >
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Clientes
                </button>
                <button 
                    onClick={() => setActiveType('aterros')}
                    className={`text-xs px-2 py-1.5 rounded flex items-center gap-2 ${activeType === 'aterros' ? 'bg-amber-50 font-bold text-amber-700' : 'hover:bg-gray-50 text-gray-600'}`}
                >
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div> Aterros
                </button>
                <button 
                    onClick={() => setActiveType('tecnicos')}
                    className={`text-xs px-2 py-1.5 rounded flex items-center gap-2 ${activeType === 'tecnicos' ? 'bg-blue-50 font-bold text-blue-700' : 'hover:bg-gray-50 text-gray-600'}`}
                >
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Técnicos
                </button>
             </div>
          </div>

          {/* 3. Navegação Rápida (NOVO) */}
          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 pointer-events-auto">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 px-1 flex items-center gap-1">
                <Navigation size={10} /> Navegação Rápida
            </h4>
            <div className="flex flex-col gap-2">
                {/* Select UF */}
                <div className="relative">
                    <select 
                        value={navUf} 
                        onChange={(e) => setNavUf(e.target.value)}
                        className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded appearance-none focus:ring-2 focus:ring-brand-500 focus:outline-none text-gray-700 font-medium"
                    >
                        <option value="">Selecione o Estado (UF)</option>
                        {ESTADOS_BRASIL.map(uf => (
                            <option key={uf} value={uf}>{uf}</option>
                        ))}
                    </select>
                    <ChevronRight size={14} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none rotate-90" />
                </div>

                {/* Select City */}
                <div className="relative">
                    <select 
                        value={navCity} 
                        onChange={(e) => handleCityNavigation(e.target.value)}
                        disabled={!navUf || isLoadingCities}
                        className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded appearance-none focus:ring-2 focus:ring-brand-500 focus:outline-none text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">
                            {isLoadingCities ? 'Carregando...' : 'Selecione a Cidade'}
                        </option>
                        {cityList.map(c => (
                            <option key={c.nome} value={c.nome}>{c.nome}</option>
                        ))}
                    </select>
                    {isNavigating ? (
                         <Loader2 size={14} className="absolute right-2 top-2.5 text-brand-500 animate-spin" />
                    ) : (
                         <ChevronRight size={14} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none rotate-90" />
                    )}
                </div>
            </div>
          </div>

      </div>

      {/* Legenda (Esquerda) */}
      <div className="absolute bottom-6 left-6 z-[400] bg-white/90 backdrop-blur px-4 py-3 rounded-lg shadow-xl border border-gray-200 pointer-events-none">
          <div className="flex items-center gap-4 text-xs font-medium text-gray-700">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-emerald-500 rounded-full border border-white shadow-sm"></div>
                 Cliente
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-amber-500 rounded-full border border-white shadow-sm"></div>
                 Aterro
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-blue-500 rounded-full border border-white shadow-sm"></div>
                 Técnico
              </div>
          </div>
      </div>
    </div>
  );
};