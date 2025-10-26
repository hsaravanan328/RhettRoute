import React, { useState, useEffect } from 'react';
import { Map as LMap, List, Star, Bell, AlertTriangle } from 'lucide-react';
import { GoogleMapView } from './components/GoogleMapView';
import { RouteCard } from './components/RouteCard';
import { StopSheet } from './components/StopSheet';
import { FavoritesView } from './components/FavoritesView';
import { AlertsView } from './components/AlertsView';
import { AddressAutocomplete } from './components/AddressAutocomplete';
import { JourneyView } from './components/JourneyView';
import {
  Stop,
  FavoriteStop,
  BusRoute,
  Journey,
  Arrival,
  BusLocation,
  ServiceAlert,
} from './types';
import { Badge } from './components/ui/badge';
import { planJourney } from './lib/journeyPlanner';
import { text } from 'stream/consumers';

type TabType = 'map' | 'routes' | 'favorites' | 'alerts';

export default function App() {
  // --- Core app state ---
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [journey, setJourney] = useState<Journey | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [favorites, setFavorites] = useState<FavoriteStop[]>([]);

  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [busLocations, setBusLocations] = useState<BusLocation[]>([]);
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [serviceAlerts, setServiceAlerts] = useState<ServiceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Fetch backend data ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Fetching routes and vehicles...');
        const [vehiclesRes, routesRes] = await Promise.all([
          fetch('http://localhost:3000/vehicles'),
          fetch('http://localhost:3000/routes'),
        ]);

        if (!vehiclesRes.ok || !routesRes.ok) {
          throw new Error('Failed to fetch data from backend');
        }

        const vehiclesJson = await vehiclesRes.json();
        const routesJson = await routesRes.json();

        // ✅ Build unique route list
        const uniqueRoutes = new Map<string, BusRoute>();
        routesJson.forEach((item: any) => {
          const id = String(item.id);
          if (!uniqueRoutes.has(id)) {
            uniqueRoutes.set(id, {
              id,
              name: item.description ?? `Route ${id}`,
              color: item.color ?? '#CC0000',
              bgColor: '#EEE',
              textColor: '#111',
              description: item.description ?? '',
              active: true,
              polygon: item.polygon ?? null,
            });
          }
        });
        setRoutes(Array.from(uniqueRoutes.values()));

        // ✅ Build stops
        const uniqueStops = new Map<string, Stop>();
        routesJson.forEach((item: any) => {
          const stopId = String(item.stop?.id ?? '');
          if (!stopId) return;
          const pos = item.stop?.position;

          if (!uniqueStops.has(stopId)) {
            uniqueStops.set(stopId, {
              id: stopId,
              name: item.stop.description,
              lat: pos?.[0] ?? 42.35,
              lng: pos?.[1] ?? -71.10,
              routeIds: [],
              accessible: false,
            });
          }

          const stop = uniqueStops.get(stopId)!;
          if (!stop.routeIds.includes(String(item.id))) {
            stop.routeIds.push(String(item.id));
          }
        });
        setStops(Array.from(uniqueStops.values()));

        // ✅ Build bus locations
        const locations: BusLocation[] = vehiclesJson.map((v: any) => {
          const cap = v.seats?.capacity ?? 0;
          const occ = v.seats?.occupied ?? 0;
          const pct = cap > 0 ? occ / cap : 0;
          const occupancy: BusLocation['occupancy'] =
            pct < 0.33 ? 'low' : pct < 0.66 ? 'medium' : 'high';

          return {
            id: String(v.id),
            routeId: String(v.route),
            lat: v.position?.[0] ?? 42.35,
            lng: v.position?.[1] ?? -71.10,
            speed: v.speed ?? 0,
            heading: v.direction ?? 0,
            occupancy,
            delayed: !!v.delayed,
            onRoute: !!v.onRoute,
            timestamp: v.timestamp ? new Date(v.timestamp) : new Date(),
          };
        });
        setBusLocations(locations);

        // ✅ Add a default alert
        setServiceAlerts([
          {
            id: 'alert-1',
            routeIds: ['demo'],
            title: 'Backend Connected',
            description: 'Data is now loading live from backend API.',
            severity: 'info',
            timestamp: new Date().toISOString(),
          },
        ]);

        console.log('✅ Data loaded:', {
          routes: uniqueRoutes.size,
          stops: uniqueStops.size,
          buses: locations.length,
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Get user location ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          console.log('📍 User location detected:', coords);
        },
        err => console.warn('Geolocation denied:', err.message)
      );
    }
  }, []);

  // --- Handle stop selection ---
  const handleStopClick = (stop: Stop) => {
    setSelectedStop(stop);
    if (journey) setJourney(null);
  };

  const handleToggleFavorite = () => {
    if (!selectedStop) return;
    const routeId = selectedStop.routeIds[0];
    if (!routeId) return;
    const idx = favorites.findIndex(f => f.stopId === selectedStop.id && f.routeId === routeId);
    if (idx >= 0) setFavorites(favorites.filter((_, i) => i !== idx));
    else setFavorites([...favorites, { stopId: selectedStop.id, routeId }]);
  };

  const isFavorite = (stop: Stop | null) =>
    stop ? favorites.some(f => f.stopId === stop.id) : false;

  const handleRemoveFavorite = (stopId: string, routeId: string) =>
    setFavorites(favorites.filter(f => !(f.stopId === stopId && f.routeId === routeId)));

  // --- Handle selecting an address ---
  const handleSelectAddress = async (place: google.maps.places.PlaceResult) => {
    try {
      const dest = place.geometry?.location;
      if (!dest) {
        console.warn('⚠️ No geometry found for selected place.');
        return;
      }
  
      if (!routes?.length || !stops?.length) {
        alert('Data is still loading. Please try again in a few seconds.');
        return;
      }
  
      if (!userLocation) {
        alert('User location not available yet. Please enable location.');
        return;
      }
  
      const destination = { lat: dest.lat(), lng: dest.lng() };
      console.log('🗺 Planning journey to:', destination);
  
      const journeyPlan = await planJourney(userLocation, destination, routes, stops);
  
      // ✅ Extract only main location name (e.g. "40 Malvern Street")
      let destinationName = place.name || '';
      if (!destinationName && place.formatted_address) {
        destinationName = place.formatted_address.split(',')[0]; // only first part before comma
      }
  
      setJourney({
        ...journeyPlan,
        destinationName: destinationName || 'Destination',
      });
  
    } catch (err) {
      console.error('Error planning journey:', err);
      alert('Could not plan your journey. Please try again.');
    }
  };
  
  

  // --- Derived lists ---
  const filteredRoutes = routes.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredStops = searchQuery
    ? stops.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];
  const activeAlerts = serviceAlerts.filter(a => a.severity !== 'info');

  // --- Loading UI ---
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background max-w-[430px] mx-auto">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#CC0000] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shuttle data...</p>
        </div>
      </div>
    );
  }

  // --- Error UI ---
  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background max-w-[430px] mx-auto p-4">
        <div className="text-center p-6 border border-destructive rounded-lg bg-red-50">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2 text-destructive">Error Loading Data</h2>
          <p className="text-muted-foreground mb-4">Could not connect to backend server.</p>
          <p className="text-sm text-gray-600 bg-gray-100 p-2 rounded">{error}</p>
        </div>
      </div>
    );
  }

  // --- Main UI ---
  return (
    <div className="h-screen w-full flex flex-col bg-background max-w-[430px] mx-auto">
      {/* Header */}
      <div className="bg-[#CC0000] text-white px-4 py-3 flex-shrink-0 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold text-[#CC0000]">BU</span>
            </div>
            <div>
              <h1 className="text-white font-semibold">BU Bus</h1>
              <p className="text-sm text-white/90">Real-time tracking</p>
            </div>
          </div>
          {activeAlerts.length > 0 && (
            <Badge variant="secondary" className="gap-1 bg-white text-[#CC0000]">
              <Bell className="w-3 h-3" />
              {activeAlerts.length}
            </Badge>
          )}
        </div>

        {(activeTab === 'routes' || activeTab === 'map') && (
          <AddressAutocomplete style={{textColor: 'black'}}
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search destination..."
            onSelectAddress={handleSelectAddress}
          />
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'map' && (
          <GoogleMapView
            selectedRoute={selectedRoute}
            routes={routes}
            stops={stops}
            busLocations={busLocations}
            onStopClick={handleStopClick}
            onRouteSelect={setSelectedRoute}
            journey={journey}
            userLocation={userLocation}
          />
        )}

{activeTab === 'routes' && (
  <div className="h-full overflow-y-auto p-4 space-y-3">
    {filteredRoutes.map(route => (
      <RouteCard
        key={route.id}
        route={route}
        arrivals={arrivals}
        onClick={() => {
          setSelectedRoute(route.id);
          setActiveTab('map');
        }}
      />
    ))}

    {searchQuery && filteredStops.length > 0 && (
      <>
        <h3 className="mt-6 mb-3 font-semibold">Matching Stops</h3>
        {filteredStops.map(stop => (
          <div
            key={stop.id}
            className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
            onClick={() => handleStopClick(stop)}
          >
            <p>{stop.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stop.routeIds.length} route{stop.routeIds.length !== 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </>
    )}
  </div>
)}


        {activeTab === 'favorites' && (
          <FavoritesView
            favorites={favorites}
            stops={stops}
            arrivals={arrivals}
            routes={routes}
            onStopClick={handleStopClick}
            onRemoveFavorite={(stopId) => {
              const fav = favorites.find(f => f.stopId === stopId);
              if (fav) handleRemoveFavorite(fav.stopId, fav.routeId);
            }}
          />
        )}

        {activeTab === 'alerts' && <AlertsView alerts={serviceAlerts} routes={routes} />}
      </div>

      {/* Bottom nav */}
      <div className="bg-white border-t-2 border-[#CC0000]/20 px-2 py-2 flex-shrink-0 shadow-lg">
        <div className="flex justify-around">
          {[
            { id: 'map' as TabType, icon: LMap, label: 'Map' },
            { id: 'routes' as TabType, icon: List, label: 'Routes' },
            { id: 'favorites' as TabType, icon: Star, label: 'Favorites' },
            { id: 'alerts' as TabType, icon: Bell, label: 'Alerts' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#CC0000] text-white'
                  : 'text-muted-foreground hover:bg-[#FFE6E6]'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs">{tab.label}</span>
              {tab.id === 'alerts' && activeAlerts.length > 0 && activeTab !== tab.id && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#CC0000] rounded-full border border-white" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Overlays */}
      {journey && <JourneyView journey={journey} onClose={() => setJourney(null)} />}
      {selectedStop && !journey && (
        <StopSheet
          stop={selectedStop}
          arrivals={arrivals}
          routes={routes}
          isFavorite={isFavorite(selectedStop)}
          onClose={() => setSelectedStop(null)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
}
