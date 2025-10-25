// Imports
import { Hono } from "hono";
import * as source from "./source";

// Defines sources
let mapVehiclePoints = await source.fetchMapVehiclePoints();
let vehicleCapacities = await source.fetchVehicleCapacities();
let arrivalTimes = await source.fetchArrivalTimes();
let routeMaps = await source.fetchRouteMaps();
setInterval(async () => {
    mapVehiclePoints = await source.fetchMapVehiclePoints();
    vehicleCapacities = await source.fetchVehicleCapacities();
    arrivalTimes = await source.fetchArrivalTimes();
    routeMaps = await source.fetchRouteMaps();
}, 5 * 60 * 1000);

// Defines app
const app = new Hono()
    .get("/hello", (context) => {
        return context.text("world");
    });

// Exports
export default app;
