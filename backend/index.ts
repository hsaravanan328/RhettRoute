// Imports
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as cache from "./cache";

// Defines app
const app = new Hono()
    .use("/*", cors())
    .get("/vehicles", (context) => {
        const results = cache.vehicles;
        return context.json(results);
    })
    .get("/vehicle/:vehicleID", (context) => {
        const vehicleID = context.req.param("vehicleID");
        const result = cache.vehicles.find((vehicle) => vehicle.id === +vehicleID);
        if(typeof result === "undefined") return context.text("Not found.", 404);
        return context.json(result);
    })
    .get("/routes", (context) => {
        const results = cache.routes;
        return context.json(results);
    })
    .get("/route/:routeID", (context) => {
        const routeID = context.req.param("routeID");
        const result = cache.routes.find((route) => route.id === +routeID);
        if(typeof result === "undefined") return context.text("Not found.", 404);
        return context.json(result);
    })

// Exports
export default app;
