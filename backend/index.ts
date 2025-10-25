// Imports
import { Hono } from "hono";
import * as source from "./source";

// console.log(await source.fetchMapVehiclePoints());
// console.log(await source.fetchVehicleCapacities());
// console.log(await source.fetchArrivalTimes());
console.log(await source.fetchRouteMaps());
// Defines app
const app = new Hono()
    .get("/hello", (context) => {
        return context.text("world");
    });

// Exports
export default app;
