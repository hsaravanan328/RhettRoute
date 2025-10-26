import React, { useState, useEffect, useRef } from 'react';
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

  const lastNotifiedRef = useRef<string | null>(null);

  // --- Fetch backend data + generate calculated alerts ---
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching routes and vehicles...');
      const [vehiclesRes, routesRes] = await Promise.all([
        fetch('http://localhost:3000/vehicles'),
        fetch('http://localhost:3000/routes'),
      ]);

      if (!vehiclesRes.ok || !routesRes.ok) throw new Error('Failed to fetch data');

      const vehiclesJson = await vehiclesRes.json();
      const routesJson = await routesRes.json();

      // --- Build unique route list ---
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

      // --- Build stops ---
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
        if (!stop.routeIds.includes(String(item.id))) stop.routeIds.push(String(item.id));
      });
      setStops(Array.from(uniqueStops.values()));

      // --- Build bus locations ---
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

      // --- Calculated alerts ---
      const generatedAlerts: ServiceAlert[] = [];

      const delayedBuses = locations.filter(b => b.delayed);
      if (delayedBuses.length > 0)
        generatedAlerts.push({
          id: 'auto-delay',
          routeIds: [...new Set(delayedBuses.map(b => b.routeId))],
          title: 'Bus Delay Detected 🚨',
          description: `${delayedBuses.length} bus${delayedBuses.length > 1 ? 'es are' : ' is'} running behind schedule.`,
          severity: 'warning',
          timestamp: new Date().toISOString(),
        });

      const crowdedBuses = locations.filter(b => b.occupancy === 'high');
      if (crowdedBuses.length > 0)
        generatedAlerts.push({
          id: 'auto-crowd',
          routeIds: [...new Set(crowdedBuses.map(b => b.routeId))],
          title: 'Crowded Buses 🧍‍♀️🧍‍♂️',
          description: `${crowdedBuses.length} bus${crowdedBuses.length > 1 ? 'es are' : ' is'} nearly full.`,
          severity: 'warning',
          timestamp: new Date().toISOString(),
        });

      const activeRoutes = new Set(locations.map(b => b.routeId));
      if (activeRoutes.size < routesJson.length / 2)
        generatedAlerts.push({
          id: 'auto-lowcoverage',
          routeIds: [],
          title: 'Reduced Service ⚠️',
          description: `Only ${activeRoutes.size} of ${routesJson.length} routes currently active.`,
          severity: 'error',
          timestamp: new Date().toISOString(),
        });

      if (generatedAlerts.length === 0)
        generatedAlerts.push({
          id: 'auto-ok',
          routeIds: [],
          title: 'All Routes Running Smoothly ✅',
          description: 'No major delays or crowding detected.',
          severity: 'success',
          timestamp: new Date().toISOString(),
        });

      setServiceAlerts(generatedAlerts);

      // --- System notifications for major alerts ---
      if ('Notification' in window && Notification.permission === 'granted') {
        generatedAlerts.forEach(alert => {
          if (alert.severity === 'warning' || alert.severity === 'error') {
            const uniqueKey = alert.id + alert.timestamp;
            if (uniqueKey !== lastNotifiedRef.current) {
              console.log('🔔 Sending notification:', alert.title);
              new Notification(alert.title, {
                body: alert.description,
                icon: '/bus-icon.png',
                badge: '/bus-icon.png',
              });
              lastNotifiedRef.current = uniqueKey;
            }
          }
        });
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Notification setup + polling ---
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(perm => {
        console.log('Notification permission:', perm);
        if (perm === 'granted') fetchData();
      });
    } else fetchData();

    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // --- Get user location ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
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

  const isFavorite = (stop: Stop | null) => stop ? favorites.some(f => f.stopId === stop.id) : false;
  const handleRemoveFavorite = (stopId: string, routeId: string) =>
    setFavorites(favorites.filter(f => !(f.stopId === stopId && f.routeId === routeId)));

  // --- Handle address select ---
  const handleSelectAddress = async (place: google.maps.places.PlaceResult) => {
    try {
      const dest = place.geometry?.location;
      if (!dest) return;
      if (!routes?.length || !stops?.length) {
        alert('Data still loading. Try again.');
        return;
      }
      if (!userLocation) {
        alert('Enable location first.');
        return;
      }
      const destination = { lat: dest.lat(), lng: dest.lng() };
      console.log('🗺 Planning journey to:', destination);
      const journeyPlan = await planJourney(userLocation, destination, routes, stops);
      setJourney(journeyPlan);
      setActiveTab('map');
    } catch (err) {
      console.error('Error planning journey:', err);
    }
  };

  // --- Filters ---
  const filteredRoutes = routes.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredStops = searchQuery
    ? stops.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];
  const activeAlerts = serviceAlerts.filter(a => a.severity !== 'info');

  // --- UI ---
  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading shuttle data...</p>
      </div>
    );

  if (error)
    return (
      <div className="h-screen flex items-center justify-center text-center p-4">
        <div>
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-2" />
          <p className="text-red-600 font-semibold mb-2">Error Loading Data</p>
          <p>{error}</p>
        </div>
      </div>
    );

  return (
    <div className="h-screen w-full flex flex-col bg-background max-w-[430px] mx-auto">
      {/* Header */}
      <div className="bg-[#CC0000] text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
              <span className="text-xl font-bold text-[#CC0000]">BU</span>
            </div>
            <div>
              <h1 className="text-white font-semibold">BU Bus</h1>
              <p className="text-xs text-white/90">Real-time tracking</p>
            </div>
          </div>
          {activeAlerts.length > 0 && (
            <Badge className="bg-white text-[#CC0000] flex items-center gap-1">
              <Bell className="w-3 h-3" /> {activeAlerts.length}
            </Badge>
          )}
        </div>

        {(activeTab === 'routes' || activeTab === 'map') && (
          <AddressAutocomplete
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search destination..."
            onSelectAddress={handleSelectAddress}
          />
        )}
      </div>

      {/* Main Content */}
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
          <div className="p-4 space-y-3 overflow-y-auto">
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

      {/* Bottom Nav */}
      <div className="bg-white border-t-2 border-[#CC0000]/20 px-2 py-2 flex justify-around shadow-lg">
        {[
          { id: 'map' as TabType, icon: LMap, label: 'Map' },
          { id: 'routes' as TabType, icon: List, label: 'Routes' },
          { id: 'favorites' as TabType, icon: Star, label: 'Favorites' },
          { id: 'alerts' as TabType, icon: Bell, label: 'Alerts' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id ? 'bg-[#CC0000] text-white' : 'text-gray-500 hover:bg-[#FFE6E6]'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
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
