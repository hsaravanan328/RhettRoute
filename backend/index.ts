// backend/index.ts

// Imports
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as cache from "./cache";
import * as resource from "./resource";

// Defines app
const app = new Hono()
  .use("/*", cors())

  // Vehicles
  .get("/vehicles", (c) => c.json(cache.vehicles))
  .get("/vehicle/:vehicleID", (c) => {
    const id = +c.req.param("vehicleID");
    const result = cache.vehicles.find((v) => v.id === id);
    if (!result) return c.text("Not found.", 404);
    return c.json(result);
  })

  // Routes (flattened, per-stop “arrival group” objects)
  .get("/routes", (c) => c.json(cache.routes))
  .get("/route/:routeID", (c) => {
    const routeID = +c.req.param("routeID");
    const result = cache.routes.find((r) => r.id === routeID);
    if (!result) return c.text("Not found.", 404);
    return c.json(result);
  })

  // ✅ All stops with coordinates across all visible route maps
  .get("/stops", async (c) => {
    // We reconstruct stops from the same source cache.routes uses
    // for consistent coordinates and route coverage.
    const map = new Map<string, any>();
    // Use the resource-level route maps to avoid duplicates and keep full fields
    const routeMaps = await resource.fetchRouteMaps();

    for (const rm of routeMaps) {
      for (const s of rm.stops) {
        const key = `${rm.route.routeID}:${s.route.stopID}`;
        if (!map.has(key)) {
          map.set(key, {
            routeId: rm.route.routeID,
            stopId: s.route.stopID,
            name: s.description,
            position: s.position, // [lat, lng]
            secondsToNextStop: s.secondsToNextStop,
          });
        }
      }
    }

    return c.json(Array.from(map.values()));
  });

// Exports
export default app;
