/// <reference types="@types/google.maps" />

import { Journey, JourneySegment, Stop, BusRoute } from "../types";
import { waitForGoogleMaps } from "./waitForGoogleMaps";

export async function planJourney(
  destination: { lat: number; lng: number; address: string },
  stops: Stop[],
  routes: BusRoute[],
  userLocation: { lat: number; lng: number } | null
): Promise<Journey | null> {
  if (!userLocation) return null;

  // Find the nearest stop to user
  const nearestStart = findNearestStop(userLocation, stops);
  const nearestEnd = findNearestStop(destination, stops);

  // Use the first active route connecting them
  const commonRoute = routes.find(r =>
    nearestStart.routeIds.includes(r.id) && nearestEnd.routeIds.includes(r.id)
  );
  if (!commonRoute) return null;

  // Get walking distances using Google Directions API
  const walkToStop = await getWalkingInfo(userLocation, {
    lat: nearestStart.lat,
    lng: nearestStart.lng,
  });

  const walkToDest = await getWalkingInfo(
    { lat: nearestEnd.lat, lng: nearestEnd.lng },
    destination
  );

  // Build segments
  const segments: JourneySegment[] = [
    {
      type: "walk",
      from: userLocation,
      to: { lat: nearestStart.lat, lng: nearestStart.lng },
      distance: walkToStop.distanceText,
      duration: walkToStop.durationText,
    },
    {
      type: "bus",
      route: commonRoute,
      fromStop: nearestStart,
      toStop: nearestEnd,
      distance: "—",
      duration: "—",
    },
    {
      type: "walk",
      from: { lat: nearestEnd.lat, lng: nearestEnd.lng },
      to: destination,
      distance: walkToDest.distanceText,
      duration: walkToDest.durationText,
    },
  ];

  return {
    destination,
    segments,
    totalDistance: walkToStop.distanceText + " + " + walkToDest.distanceText,
    totalDuration: walkToStop.durationText + " + " + walkToDest.durationText,
  };
}

// --- Helper: nearest stop ---
function findNearestStop(
  point: { lat: number; lng: number },
  stops: Stop[]
): Stop {
  let minDist = Infinity;
  let nearest = stops[0];
  stops.forEach(stop => {
    const d = haversineDistance(point, { lat: stop.lat, lng: stop.lng });
    if (d < minDist) {
      minDist = d;
      nearest = stop;
    }
  });
  return nearest;
}

// --- Haversine fallback ---
function haversineDistance(a: any, b: any): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const val =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(val), Math.sqrt(1 - val));
}

// --- Google Directions API call ---
async function getWalkingInfo(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ distanceText: string; durationText: string; durationMins: number }> {
  await waitForGoogleMaps();
  const service = new google.maps.DirectionsService();

  return new Promise((resolve) => {
    service.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === "OK" && result?.routes?.[0]?.legs?.[0]) {
          const leg = result.routes[0].legs[0];
          resolve({
            distanceText: leg.distance?.text || "—",
            durationText: leg.duration?.text || "—",
            durationMins: leg.duration?.value ? leg.duration.value / 60 : 0, // convert seconds→mins
          });
        } else {
          console.warn("Directions API failed:", status);
          resolve({ distanceText: "—", durationText: "—", durationMins: 0 });
        }
      }
    );
  });
}

