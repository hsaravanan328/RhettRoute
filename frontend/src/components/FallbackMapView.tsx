import { Bus, MapPin, Navigation } from 'lucide-react';
import { BusLocation, BusRoute, Stop } from '../types';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';

interface FallbackMapViewProps {
  selectedRoute: string | null;
  routes: BusRoute[];
  stops: Stop[];
  busLocations: BusLocation[];
  onStopClick: (stop: Stop) => void;
  onRouteSelect: (routeId: string | null) => void;
}

export function FallbackMapView({ 
  selectedRoute, 
  routes, 
  stops, 
  busLocations, 
  onStopClick,
  onRouteSelect 
}: FallbackMapViewProps) {
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
    <div className="relative w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Info Banner */}
      <div className="absolute top-16 left-4 right-4 z-20">
        <Alert className="bg-white border-2 border-[#CC0000]/30 shadow-lg">
          <Navigation className="h-4 w-4 text-[#CC0000]" />
          <AlertDescription className="text-sm">
            <strong>Demo Mode:</strong> Add your Google Maps API key to enable live street-level maps.
          </AlertDescription>
        </Alert>
      </div>

      {/* Map Background with Street Grid */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, #94a3b8 1px, transparent 1px),
            linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Campus Areas */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        {/* Charles River Campus */}
        <div 
          className="absolute bg-green-200/40 border-2 border-green-400/50 rounded-lg"
          style={{
            left: '15%',
            top: '35%',
            width: '30%',
            height: '25%',
          }}
        >
          <div className="p-2">
            <p className="text-xs opacity-60">Charles River Campus</p>
          </div>
        </div>

        {/* Medical Campus */}
        <div 
          className="absolute bg-blue-200/40 border-2 border-blue-400/50 rounded-lg"
          style={{
            right: '15%',
            bottom: '25%',
            width: '25%',
            height: '20%',
          }}
        >
          <div className="p-2">
            <p className="text-xs opacity-60">Medical Campus</p>
          </div>
        </div>

        {/* Fenway Area */}
        <div 
          className="absolute bg-purple-200/40 border-2 border-purple-400/50 rounded-lg"
          style={{
            right: '25%',
            top: '45%',
            width: '20%',
            height: '18%',
          }}
        >
          <div className="p-2">
            <p className="text-xs opacity-60">Fenway</p>
          </div>
        </div>
      </div>

      {/* Route Lines */}
      {routes.map(route => {
        if (!route.active) return null;
        if (selectedRoute && selectedRoute !== route.id) return null;
        
        return (
          <svg
            key={route.id}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 2 }}
          >
            <path
              d={getRoutePath(route.id)}
              stroke={route.color}
              strokeWidth={selectedRoute === route.id ? "6" : "4"}
              fill="none"
              strokeLinecap="round"
              strokeDasharray="8,4"
              opacity={selectedRoute === route.id ? "1" : "0.6"}
            />
          </svg>
        );
      })}

      {/* Bus Locations */}
      <div className="absolute inset-0" style={{ zIndex: 4 }}>
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
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white"
                  style={{ backgroundColor: route.color }}
                >
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
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
      <div className="absolute inset-0" style={{ zIndex: 3 }}>
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
              <div className="w-8 h-8 rounded-full bg-white border-3 border-[#CC0000] flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform">
                <MapPin className="w-4 h-4 text-[#CC0000]" />
              </div>
              <div className="absolute left-10 top-0 bg-white px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 border-2 border-[#CC0000]/20">
                <p className="text-sm">{stop.name}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Route Filter Pills */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Badge
            variant={selectedRoute === null ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap bg-white hover:bg-gray-50 shadow-lg border-2"
            style={{
              backgroundColor: selectedRoute === null ? '#CC0000' : 'white',
              color: selectedRoute === null ? 'white' : '#CC0000',
              borderColor: '#CC0000',
            }}
            onClick={() => onRouteSelect(null)}
          >
            All Routes
          </Badge>
          {routes.filter(r => r.active).map(route => (
            <Badge
              key={route.id}
              variant="outline"
              className="cursor-pointer whitespace-nowrap shadow-lg border-2"
              style={{
                backgroundColor: selectedRoute === route.id ? route.color : 'white',
                color: selectedRoute === route.id ? 'white' : route.color,
                borderColor: route.color,
              }}
              onClick={() => onRouteSelect(route.id)}
            >
              {route.name.split(' - ')[0]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-xl p-3 z-10 border-2 border-[#CC0000]/20">
        <p className="text-xs mb-2 opacity-60">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4 text-[#CC0000]" />
            <span className="text-xs">Live Bus</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#CC0000]" />
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
    </div>
  );
}

// Helper function to generate route paths
function getRoutePath(routeId: string): string {
  const paths: Record<string, string> = {
    red: 'M 20% 45% Q 35% 40%, 50% 38% T 75% 65%',
    yellow: 'M 25% 50% Q 40% 53%, 55% 55% T 70% 58%',
    green: 'M 18% 48% Q 45% 46%, 72% 44% T 85% 42%',
  };
  return paths[routeId] || '';
}
