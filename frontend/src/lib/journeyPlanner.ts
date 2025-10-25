import { Stop, BusRoute, Journey, JourneySegment } from '../types';

interface Destination {
  lat: number;
  lng: number;
  address: string;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Find nearest stop to a location
function findNearestStop(lat: number, lng: number, stops: Stop[]): Stop | null {
  if (stops.length === 0) return null;

  let nearest = stops[0];
  let minDistance = calculateDistance(lat, lng, stops[0].lat, stops[0].lng);

  for (const stop of stops) {
    const distance = calculateDistance(lat, lng, stop.lat, stop.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = stop;
    }
  }

  return nearest;
}

// Calculate estimated duration based on distance and mode
function estimateDuration(distance: number, mode: 'bus' | 'walk'): number {
  if (mode === 'walk') {
    // Average walking speed: 5 km/h = 83.3 m/min
    return Math.ceil(distance / 83.3);
  } else {
    // Average bus speed: 20 km/h = 333 m/min
    return Math.ceil(distance / 333);
  }
}

export function planJourney(
  destination: Destination,
  stops: Stop[],
  routes: BusRoute[],
  userLocation?: { lat: number; lng: number }
): Journey | null {
  const activeRoutes = routes.filter(r => r.active);
  if (activeRoutes.length === 0) return null;

  // Start from user location or first stop
  const startLat = userLocation?.lat ?? stops[0]?.lat ?? 42.3505;
  const startLng = userLocation?.lng ?? stops[0]?.lng ?? -71.1054;

  // Find nearest stop to starting location
  const nearestStartStop = findNearestStop(startLat, startLng, stops);
  if (!nearestStartStop) return null;

  // Find nearest stop to destination
  const nearestDestStop = findNearestStop(destination.lat, destination.lng, stops);
  if (!nearestDestStop) return null;

  // Find a route that connects these stops
  const connectingRoute = activeRoutes.find(route => 
    nearestStartStop.routeIds.includes(route.id) && 
    nearestDestStop.routeIds.includes(route.id)
  );

  if (!connectingRoute) {
    // If no direct route, just use the first available route from nearest stop
    const routeId = nearestStartStop.routeIds[0];
    const route = activeRoutes.find(r => r.id === routeId);
    
    if (!route) return null;

    // Find another stop on this route
    const routeStops = stops.filter(s => s.routeIds.includes(route.id));
    const alternateStop = routeStops.find(s => s.id !== nearestStartStop.id) || routeStops[0];

    const segments: JourneySegment[] = [];
    
    // Bus segment
    const busDistance = calculateDistance(
      nearestStartStop.lat, nearestStartStop.lng,
      alternateStop.lat, alternateStop.lng
    );
    segments.push({
      type: 'bus',
      route,
      fromStop: nearestStartStop,
      toStop: alternateStop,
      duration: estimateDuration(busDistance, 'bus') + 5, // Add waiting time
      distance: busDistance
    });

    // Walking segment from final stop to destination
    const walkDistance = calculateDistance(
      alternateStop.lat, alternateStop.lng,
      destination.lat, destination.lng
    );
    segments.push({
      type: 'walk',
      duration: estimateDuration(walkDistance, 'walk'),
      distance: walkDistance,
      instructions: `Walk to ${destination.address}`
    });

    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);

    return {
      destination,
      segments,
      totalDuration
    };
  }

  // Create journey with the connecting route
  const segments: JourneySegment[] = [];

  // Bus segment
  const busDistance = calculateDistance(
    nearestStartStop.lat, nearestStartStop.lng,
    nearestDestStop.lat, nearestDestStop.lng
  );
  segments.push({
    type: 'bus',
    route: connectingRoute,
    fromStop: nearestStartStop,
    toStop: nearestDestStop,
    duration: estimateDuration(busDistance, 'bus') + 5, // Add 5 min waiting time
    distance: busDistance
  });

  // Walking segment from final stop to destination
  const walkDistance = calculateDistance(
    nearestDestStop.lat, nearestDestStop.lng,
    destination.lat, destination.lng
  );
  segments.push({
    type: 'walk',
    duration: estimateDuration(walkDistance, 'walk'),
    distance: walkDistance,
    instructions: `Walk to ${destination.address}`
  });

  const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);

  return {
    destination,
    segments,
    totalDuration
  };
}
