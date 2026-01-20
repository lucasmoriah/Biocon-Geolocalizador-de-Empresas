import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { LocationEntry } from '../types';

// Fix for default Leaflet marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  locations: LocationEntry[];
}

const RecenterAutomatically = ({ locations }: { locations: LocationEntry[] }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const validLocs = locations.filter(l => !isNaN(Number(l.latitude)) && !isNaN(Number(l.longitude)));
      if (validLocs.length > 0) {
        const bounds = L.latLngBounds(validLocs.map(l => [Number(l.latitude), Number(l.longitude)]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }
  }, [locations, map]);

  return null;
};

// Color mapping helper
const getRadiusColor = (radius: number): string => {
  if (radius === 50) return '#22c55e'; // Green
  if (radius === 100) return '#3b82f6'; // Blue
  if (radius === 150) return '#eab308'; // Yellow
  if (radius === 300) return '#ef4444'; // Red
  return '#a855f7'; // Purple (Custom)
};

export const MapView: React.FC<MapViewProps> = ({ locations }) => {
  
  // Sort locations: Largest radius first, Smallest radius last.
  // This ensures that when Leaflet renders them, the smaller circles (top layer)
  // are rendered AFTER the larger circles (bottom layer), so they are visible and overlapping.
  const validLocations = useMemo(() => {
    return locations
      .filter(
        loc => 
          loc.latitude !== '' && 
          loc.longitude !== '' && 
          !isNaN(Number(loc.latitude)) && 
          !isNaN(Number(loc.longitude))
      )
      .sort((a, b) => b.radius - a.radius);
  }, [locations]);

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={[-15.793889, -47.882778]} // Brasília center
        zoom={4} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RecenterAutomatically locations={validLocations} />

        {validLocations.map((loc) => {
            const lat = Number(loc.latitude);
            const lng = Number(loc.longitude);
            const color = getRadiusColor(loc.radius);

            return (
                <React.Fragment key={loc.id}>
                    {/* Render Area Circle if radius > 0 */}
                    {loc.radius > 0 && (
                        <Circle 
                            center={[lat, lng]}
                            pathOptions={{ 
                                fillColor: color, 
                                color: color, 
                                weight: 1, 
                                fillOpacity: 0.25 
                            }}
                            radius={loc.radius * 1000} // Convert km to meters
                        />
                    )}

                    <Marker position={[lat, lng]}>
                        <Popup>
                        <div className="p-1 min-w-[200px]">
                            <h3 className="font-bold text-gray-900">{loc.name || 'Sem nome'}</h3>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 mb-2 inline-block">
                                {loc.companyType || 'Sem tipo'}
                            </span>
                            <div className="text-sm text-gray-600 mb-2">
                                {loc.description && <p>{loc.description}</p>}
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 font-mono">
                                CEP: {loc.cep}<br/>
                                {lat.toFixed(4)}, {lng.toFixed(4)}
                            </div>
                            {loc.radius > 0 && (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                                    <span className="text-xs font-bold" style={{ color: color }}>
                                        Raio de {loc.radius} km
                                    </span>
                                </div>
                            )}
                        </div>
                        </Popup>
                    </Marker>
                </React.Fragment>
            );
        })}
      </MapContainer>
    </div>
  );
};