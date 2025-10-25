import { useState } from 'react';
import { Map, List, Star, Bell } from 'lucide-react';
import { GoogleMapView } from './components/GoogleMapView';
import { RouteCard } from './components/RouteCard';
import { StopSheet } from './components/StopSheet';
import { FavoritesView } from './components/FavoritesView';
import { AlertsView } from './components/AlertsView';
import { AddressAutocomplete } from './components/AddressAutocomplete';
import { JourneyView } from './components/JourneyView';
import { routes, stops, busLocations, arrivals, serviceAlerts } from './lib/mockData';
import { Stop, FavoriteStop, BusRoute, Journey } from './types';
import { Badge } from './components/ui/badge';
import { planJourney } from './lib/journeyPlanner';

type TabType = 'map' | 'routes' | 'favorites' | 'alerts';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [journey, setJourney] = useState<Journey | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [favorites, setFavorites] = useState<FavoriteStop[]>([
    { stopId: 'stop-1', routeId: 'red' },
    { stopId: 'stop-2', routeId: 'green' },
  ]);

  const handleStopClick = (stop: Stop) => {
    setSelectedStop(stop);
  };

  const handleToggleFavorite = () => {
    if (!selectedStop) return;
    
    const primaryRoute = selectedStop.routeIds[0];
    const favoriteIndex = favorites.findIndex(
      f => f.stopId === selectedStop.id && f.routeId === primaryRoute
    );

    if (favoriteIndex >= 0) {
      setFavorites(favorites.filter((_, i) => i !== favoriteIndex));
    } else {
      setFavorites([...favorites, { stopId: selectedStop.id, routeId: primaryRoute }]);
    }
  };

  const handleRemoveFavorite = (stopId: string) => {
    setFavorites(favorites.filter(f => f.stopId !== stopId));
  };

  const isFavorite = (stop: Stop | null): boolean => {
    if (!stop) return false;
    return favorites.some(f => f.stopId === stop.id);
  };

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStops = stops.filter(stop =>
    stop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeAlerts = serviceAlerts.filter(alert => alert.severity !== 'info');

  const handleSelectRoute = (route: BusRoute) => {
    setSelectedRoute(route.id);
    setActiveTab('map');
  };

  const handleSelectAddress = (result: { address: string; lat: number; lng: number }) => {
    const newJourney = planJourney(
      { lat: result.lat, lng: result.lng, address: result.address },
      stops,
      routes,
      userLocation
    );
    
    if (newJourney) {
      setJourney(newJourney);
      setActiveTab('map');
    }
  };

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
              <h1 className="text-white">BU Bus</h1>
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
          <AddressAutocomplete
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search address or stop..."
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
          <div className="h-full overflow-y-auto">
            <div className="p-4 space-y-3">
              {filteredRoutes.map(route => (
                <RouteCard
                  key={route.id}
                  route={route}
                  arrivals={arrivals}
                  onClick={() => {
                    if (route.active) {
                      setSelectedRoute(route.id);
                      setActiveTab('map');
                    }
                  }}
                />
              ))}

              {searchQuery && filteredStops.length > 0 && (
                <>
                  <h3 className="mt-6 mb-3">Matching Stops</h3>
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
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="h-full overflow-y-auto">
            <FavoritesView
              favorites={favorites}
              stops={stops}
              arrivals={arrivals}
              routes={routes}
              onStopClick={handleStopClick}
              onRemoveFavorite={handleRemoveFavorite}
            />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="h-full overflow-y-auto">
            <AlertsView alerts={serviceAlerts} routes={routes} />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t-2 border-[#CC0000]/20 px-2 py-2 flex-shrink-0 shadow-lg">
        <div className="flex justify-around">
          {[
            { id: 'map' as TabType, icon: Map, label: 'Map' },
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

      {/* Journey View */}
      {journey && (
        <JourneyView
          journey={journey}
          onClose={() => setJourney(null)}
        />
      )}

      {/* Stop Details Sheet */}
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
