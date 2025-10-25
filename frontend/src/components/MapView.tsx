import { Bus, MapPin } from 'lucide-react';
import { BusLocation, BusRoute, Stop } from '../types';
import { Badge } from './ui/badge';

interface MapViewProps {
  selectedRoute: string | null;
  routes: BusRoute[];
  stops: Stop[];
  busLocations: BusLocation[];
  onStopClick: (stop: Stop) => void;
}

export function MapView({ selectedRoute, routes, stops, busLocations, onStopClick }: MapViewProps) {
  const filteredStops = selectedRoute
    ? stops.filter(s => s.routeIds.includes(selectedRoute))
    : stops;
  
  const filteredBuses = selectedRoute
    ? busLocations.filter(b => b.routeId === selectedRoute)
    : busLocations;

  const getRouteColor = (routeId: string) => {
    return routes.find(r => r.id === routeId)?.color || '#666';
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
      {/* Map Background Grid */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #94a3b8 1px, transparent 1px),
            linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Route Lines */}
      {routes.map(route => {
        if (!route.active) return null;
        if (selectedRoute && selectedRoute !== route.id) return null;
        
        return (
          <svg
            key={route.id}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <path
              d={getRoutePath(route.id)}
              stroke={route.color}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="8,4"
              opacity="0.6"
            />
          </svg>
        );
      })}

      {/* Bus Locations */}
      <div className="absolute inset-0" style={{ zIndex: 3 }}>
        {filteredBuses.map(bus => {
          const route = routes.find(r => r.id === bus.routeId);
          if (!route) return null;

          return (
            <div
              key={bus.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${((bus.lng + 71.12) / 0.05) * 100}%`,
                top: `${((42.36 - bus.lat) / 0.025) * 100}%`,
              }}
            >
              <div 
                className="relative animate-pulse"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: route.color }}
                >
                  <Bus className="w-5 h-5 text-white" />
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                  style={{
                    backgroundColor: 
                      bus.occupancy === 'low' ? '#22c55e' :
                      bus.occupancy === 'medium' ? '#eab308' : '#ef4444'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stops */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        {filteredStops.map(stop => (
          <button
            key={stop.id}
            onClick={() => onStopClick(stop)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{
              left: `${((stop.lng + 71.12) / 0.05) * 100}%`,
              top: `${((42.36 - stop.lat) / 0.025) * 100}%`,
            }}
          >
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-700 flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform">
                <MapPin className="w-3 h-3 text-gray-700" />
              </div>
              <div className="absolute left-8 top-0 bg-white px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                <p className="text-xs">{stop.name}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10">
        <p className="text-xs mb-2 opacity-60">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4" />
            <span className="text-xs">Live Bus</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="text-xs">Stop</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <div className="w-2 h-2 rounded-full bg-red-500" />
            </div>
            <span className="text-xs">Occupancy</span>
          </div>
        </div>
      </div>

      {/* Route Filter Pills */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Badge
            variant={selectedRoute === null ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap bg-white hover:bg-gray-100"
            onClick={() => {}}
          >
            All Routes
          </Badge>
          {routes.filter(r => r.active).map(route => (
            <Badge
              key={route.id}
              variant="outline"
              className="cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: selectedRoute === route.id ? route.color : 'white',
                color: selectedRoute === route.id ? 'white' : route.color,
                borderColor: route.color,
              }}
              onClick={() => {}}
            >
              {route.name.split(' - ')[0]}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to generate route paths
function getRoutePath(routeId: string): string {
  const paths: Record<string, string> = {
    red: 'M 15% 45% Q 30% 40%, 45% 35% T 75% 70%',
    yellow: 'M 20% 50% Q 35% 55%, 50% 60% T 70% 65%',
    green: 'M 10% 48% Q 40% 45%, 70% 42% T 85% 40%',
  };
  return paths[routeId] || '';
}
