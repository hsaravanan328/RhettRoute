import type { Stop, Route } from "../types";

declare global {
  interface Window {
    google: any;
  }
}

interface WalkingInfo {
  distance: number; // km
  duration: number; // min
  textDistance: string;
  textDuration: string;
}

export async function getWalkingInfo(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<WalkingInfo> {
  try {
    const directionsService = new google.maps.DirectionsService();

    const result = await directionsService.route({
      origin,
      destination,
      travelMode: google.maps.TravelMode.WALKING,
    });

    const leg = result?.routes?.[0]?.legs?.[0];
    if (!leg) throw new Error("No walking leg found");

    const distanceVal = leg.distance?.value ?? 0; // meters
    const durationVal = leg.duration?.value ?? 0; // seconds

    return {
      distance: distanceVal / 1000,
      duration: durationVal / 60,
      textDistance: leg.distance?.text || `${(distanceVal / 1000).toFixed(2)} km`,
      textDuration: leg.duration?.text || `${Math.round(durationVal / 60)} min`,
    };
  } catch (err) {
    console.warn("⚠️ Walking info failed", err);
    return { distance: 0, duration: 0, textDistance: "0 km", textDuration: "0 min" };
  }
}

function findNearestStop(
  stops: Stop[],
  point: { lat: number; lng: number }
): Stop | null {
  if (!Array.isArray(stops) || stops.length === 0) return null;
  let nearest = stops[0];
  let minDist = Number.MAX_VALUE;

  for (const stop of stops) {
    const d = Math.hypot(stop.lat - point.lat, stop.lng - point.lng);
    if (d < minDist) {
      minDist = d;
      nearest = stop;
    }
  }
  return nearest;
}

export async function planJourney(
  userLocation: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  routes: Route[],
  stops: Stop[]
) {
  console.log("🗺 Planning journey...");
  const nearestStart = findNearestStop(stops, userLocation);
  const nearestEnd = findNearestStop(stops, destination);

  if (!nearestStart || !nearestEnd) {
    console.error("No valid stops found");
    return null;
  }

  const walkToStart = await getWalkingInfo(userLocation, nearestStart);
  const walkFromEnd = await getWalkingInfo(nearestEnd, destination);

  // Assume 2–3 min average bus time between adjacent stops for demo
  const busDuration = 3; // min placeholder
  const busDistance = 1; // km placeholder

  const totalDuration =
    (walkToStart.duration || 0) + busDuration + (walkFromEnd.duration || 0);
  const totalDistance =
    (walkToStart.distance || 0) + busDistance + (walkFromEnd.distance || 0);

  return {
    totalDuration: Math.round(totalDuration),
    totalDistance: totalDistance.toFixed(2),
    segments: [
      {
        type: "walk",
        title: "Walk to Stop",
        distance: walkToStart.textDistance,
        duration: walkToStart.textDuration,
      },
      {
        type: "bus",
        title: "Take Night Line",
        boardAt: nearestStart.name,
        getOffAt: nearestEnd.name,
        distance: `${busDistance.toFixed(1)} km`,
        duration: `${busDuration} min`,
      },
      {
        type: "walk",
        title: "Walk to Destination",
        distance: walkFromEnd.textDistance,
        duration: walkFromEnd.textDuration,
      },
    ],
  };
}
