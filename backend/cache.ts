// backend/cache.ts

// Imports
import * as resource from "./resource";

// Bootstrap resources (first load)
let mapVehiclePoints = await resource.fetchMapVehiclePoints();
let vehicleCapacities = await resource.fetchVehicleCapacities();
let arrivalTimes     = await resource.fetchArrivalTimes();
let routeMaps        = await resource.fetchRouteMaps();

// Normalizers / joiners
export function grabVehicles() {
  return mapVehiclePoints.map((vehiclePoint) => {
    // ✅ FIX: match by vehicleID (previously returned the first truthy row)
    const vehicleCapacity = vehicleCapacities.find(
      (c) => c.vehicleID === vehiclePoint.vehicleID
    );

    // Safe fallbacks
    const capacity = vehicleCapacity?.capacity ?? 0;
    const occupied = vehicleCapacity?.occupied ?? 0;

    return {
      id: vehiclePoint.vehicleID,
      name: vehiclePoint.name,
      route: vehiclePoint.routeID,

      // location & motion
      position: vehiclePoint.position, // [lat, lng]
      speed: vehiclePoint.groundSpeed,
      direction: vehiclePoint.heading,

      // flags
      delayed: vehiclePoint.flags.isDelayed,
      onRoute: vehiclePoint.flags.isOnRoute, // ✅ clearer name

      // timing
      elapsed: vehiclePoint.seconds,
      timestamp: vehiclePoint.time,

      // seats
      seats: {
        occupied,
        available: Math.max(0, capacity - occupied),
        capacity,
      },
    };
  });
}

export function grabRoutes() {
  return arrivalTimes.map((arriveTime) => {
    const routeMap = routeMaps.find(
      (m) => m.route.routeID === arriveTime.route.routeID
    );
    if (!routeMap) throw new Error("No such routeID found.");

    const routeStop = routeMap.stops.find(
      (s) => s.route.stopID === arriveTime.route.stopID
    );
    if (!routeStop) throw new Error("No such stopID found.");

    return {
      id: arriveTime.route.routeID,
      description: arriveTime.route.description,
      color: arriveTime.color,

      eta: routeMap.etaTypeID,
      gtfs: routeMap.gtfsID,
      info: routeMap.infoText,
      order: routeMap.order,

      // route-level map info
      polygon: {
        color: routeMap.map.color,
        shape: routeMap.polyline, // encoded polyline (frontend can decode)
      },
      position: routeMap.map.position, // map center

      // ✅ include stop coordinates (fixes frontend placeholders)
      stop: {
        id: arriveTime.route.stopID,
        description: arriveTime.stop.description,
        position: routeStop.position, // [lat, lng]
      },

      // times for this stop
      schedule: arriveTime.times.map((time) => ({
        arriving:  time.arrival.isArriving,
        arrival:   time.arrival.scheduledTime,
        departed:  time.departure.isDeparted,
        departure: time.departure.scheduledTime,
        elapsed:   time.seconds,
        estimated: time.estimateTime,
        scheduled: time.scheduledTime,
        status:    time.onTimeStatus,
        time:      time.time,
        vehicle:   { id: time.vehicleID },
      })),
    };
  });
}

// Cached objects
export let vehicles = grabVehicles();
export let routes   = grabRoutes();

// ✅ Safer refresh with try/catch + realistic cadence (10s)
setInterval(async () => {
  try {
    const [vPts, caps, arrs, maps] = await Promise.all([
      resource.fetchMapVehiclePoints(),
      resource.fetchVehicleCapacities(),
      resource.fetchArrivalTimes(),
      resource.fetchRouteMaps(),
    ]);

    mapVehiclePoints = vPts;
    vehicleCapacities = caps;
    arrivalTimes = arrs;
    routeMaps = maps;

    vehicles = grabVehicles();
    routes   = grabRoutes();
  } catch (err) {
    console.error("[cache] refresh failed; keeping last-good cache:", err);
  }
}, 10 * 1000);
