// Imports
import { Hono } from "hono";

// Defines app
const app = new Hono()
    .get("/hello", (context) => {
        return context.text("world");
    });

// Exports
export default app;
