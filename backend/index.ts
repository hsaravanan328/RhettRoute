// Imports
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as upstream from "./upstream";

// Defines app
const app = new Hono()
    .use("/*", cors())
    .get("/ping", async (context) => {
        return context.json(await upstream.consolidate());
    })

// Exports
export default app;
