import { useEffect, useRef, useState } from 'react';
import { Bus, Footprints } from 'lucide-react';
import { BusLocation, BusRoute, Stop, Journey } from '../types';
import { Badge } from './ui/badge';

interface GoogleMapViewProps {
  selectedRoute: string | null;
  routes: BusRoute[];
  stops: Stop[];
  busLocations: BusLocation[];
  onStopClick: (stop: Stop) => void;
  onRouteSelect: (routeId: string | null) => void;
  journey?: Journey | null;
  userLocation?: { lat: number; lng: number } | null;
}

export function GoogleMapView({ 
  selectedRoute, 
  routes, 
  stops, 
  busLocations, 
  onStopClick,
  onRouteSelect,
  journey,
  userLocation
}: GoogleMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const journeyOverlaysRef = useRef<(google.maps.Polyline | google.maps.Marker)[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      if (!window.google) return;

      const map = new google.maps.Map(mapRef.current!, {
        center: { lat: 42.3505, lng: -71.1054 }, // BU Campus center
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels.icon',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      mapInstanceRef.current = map;
      setMapLoaded(true);
    };

    if (window.google?.maps) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDbhimP254_j3k1lcwKJuDUqy-cYcJ6u8Q&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    }
  }, []);

  // Draw route lines
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Clear existing polylines
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    polylinesRef.current = [];

    routes.forEach(route => {
      if (!route.active) return;
      if (selectedRoute && selectedRoute !== route.id) return;

      const routeStops = stops.filter(s => s.routeIds.includes(route.id));
      const path = routeStops.map(s => ({ lat: s.lat, lng: s.lng }));

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: route.color,
        strokeOpacity: selectedRoute === route.id ? 1.0 : 0.6,
        strokeWeight: selectedRoute === route.id ? 6 : 4,
        map: mapInstanceRef.current
      });

      polylinesRef.current.push(polyline);
    });
  }, [mapLoaded, routes, stops, selectedRoute]);

  // Add markers for stops and buses
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add stop markers
    const filteredStops = selectedRoute
      ? stops.filter(s => s.routeIds.includes(selectedRoute))
      : stops;

    filteredStops.forEach(stop => {
      const marker = new google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map: mapInstanceRef.current,
        title: stop.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#FFFFFF',
          fillOpacity: 1,
          strokeColor: '#CC0000',
          strokeWeight: 3,
        },
      });

      marker.addListener('click', () => onStopClick(stop));
      markersRef.current.push(marker);
    });

    // Add bus markers
    const filteredBuses = selectedRoute
      ? busLocations.filter(b => b.routeId === selectedRoute)
      : busLocations;

    filteredBuses.forEach(bus => {
      const route = routes.find(r => r.id === bus.routeId);
      if (!route) return;

      const marker = new google.maps.Marker({
        position: { lat: bus.lat, lng: bus.lng },
        map: mapInstanceRef.current,
        title: `${route.name} - ${bus.occupancy} occupancy`,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: route.color,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 1.5,
          anchor: new google.maps.Point(12, 22),
        },
        zIndex: 1000,
      });

      markersRef.current.push(marker);
    });
  }, [mapLoaded, stops, busLocations, selectedRoute, routes, onStopClick]);

  // Draw journey path
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !journey) return;

    // Clear existing journey overlays
    journeyOverlaysRef.current.forEach(overlay => overlay.setMap(null));
    journeyOverlaysRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    journey.segments.forEach((segment, index) => {
      if (segment.type === 'bus' && segment.fromStop && segment.toStop && segment.route) {
        // Draw bus route segment with thick, bright line
        const path = [
          { lat: segment.fromStop.lat, lng: segment.fromStop.lng },
          { lat: segment.toStop.lat, lng: segment.toStop.lng }
        ];

        const polyline = new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: segment.route.color,
          strokeOpacity: 1.0,
          strokeWeight: 8,
          map: mapInstanceRef.current,
          zIndex: 100
        });

        journeyOverlaysRef.current.push(polyline);
        bounds.extend(path[0]);
        bounds.extend(path[1]);

        // Add markers for bus stops
        const startMarker = new google.maps.Marker({
          position: path[0],
          map: mapInstanceRef.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: segment.route.color,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          },
          zIndex: 101
        });
        journeyOverlaysRef.current.push(startMarker);

        const endMarker = new google.maps.Marker({
          position: path[1],
          map: mapInstanceRef.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: segment.route.color,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          },
          zIndex: 101
        });
        journeyOverlaysRef.current.push(endMarker);
      }

      if (segment.type === 'walk' && journey.segments[index - 1]) {
        const previousSegment = journey.segments[index - 1];
        const startPos = previousSegment.toStop 
          ? { lat: previousSegment.toStop.lat, lng: previousSegment.toStop.lng }
          : null;
        
        const endPos = { lat: journey.destination.lat, lng: journey.destination.lng };

        if (startPos) {
          // Draw walking path with dashed line
          const path = [startPos, endPos];
          const walkPolyline = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: '#666666',
            strokeOpacity: 1.0,
            strokeWeight: 6,
            map: mapInstanceRef.current,
            zIndex: 99,
            icons: [{
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3,
                strokeColor: '#666666',
              },
              offset: '100%',
              repeat: '50px'
            }]
          });

          journeyOverlaysRef.current.push(walkPolyline);
          bounds.extend(startPos);
          bounds.extend(endPos);

          // Add walking icon marker
          const walkMarker = new google.maps.Marker({
            position: {
              lat: (startPos.lat + endPos.lat) / 2,
              lng: (startPos.lng + endPos.lng) / 2
            },
            map: mapInstanceRef.current,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20v-6"/><path d="M15 20v-6"/><path d="M12 20V10"/><path d="M9 20v-6"/><path d="M6 20v-6"/><path d="M4 16h16"/></svg>'
              ),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16),
            },
            zIndex: 102
          });
          journeyOverlaysRef.current.push(walkMarker);
        }
      }
    });

    // Add destination marker
    const destMarker = new google.maps.Marker({
      position: { lat: journey.destination.lat, lng: journey.destination.lng },
      map: mapInstanceRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#22c55e',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 4,
      },
      zIndex: 103
    });
    journeyOverlaysRef.current.push(destMarker);
    bounds.extend({ lat: journey.destination.lat, lng: journey.destination.lng });

    // Fit map to journey bounds
    if (!bounds.isEmpty()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: 80 });
    }
  }, [mapLoaded, journey]);

  // Add user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !userLocation) return;

    const marker = new google.maps.Marker({
      position: userLocation,
      map: mapInstanceRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
      },
      zIndex: 200,
    });

    return () => {
      marker.setMap(null);
    };
  }, [mapLoaded, userLocation]);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

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
            <div className="w-4 h-4 rounded-full bg-[#CC0000]" />
            <span className="text-xs">Live Bus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white border-2 border-[#CC0000]" />
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

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#CC0000] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
