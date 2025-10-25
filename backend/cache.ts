// Imports
import * as resource from "./resource";

// Creates resources
let mapVehiclePoints = await resource.fetchMapVehiclePoints();
let vehicleCapacities = await resource.fetchVehicleCapacities();
let arrivalTimes = await resource.fetchArrivalTimes();
let routeMaps = await resource.fetchRouteMaps();

// Creates grabbers
export function grabVehicles() {
    return mapVehiclePoints.map((vehiclePoint) => {
        const vehicleCapacity = vehicleCapacities.find((capacity) => capacity.vehicleID);
        if(typeof vehicleCapacity === "undefined") throw new Error("No such vehicle ID found.");
        return {
            delayed: vehiclePoint.flags.isDelayed,
            direction: vehiclePoint.heading,
            elapsed: vehiclePoint.seconds,
            expected: vehiclePoint.flags.isOnRoute,
            id: vehiclePoint.vehicleID,
            name: vehiclePoint.name,
            position: vehiclePoint.position,
            route: vehiclePoint.routeID,
            seats: {
                available: vehicleCapacity.capacity - vehicleCapacity.occupied,
                occupied: vehicleCapacity.occupied,
            },
            speed: vehiclePoint.groundSpeed
        };
    });
}
export function grabRoutes() {
    return arrivalTimes.map((arriveTime) => {
        const routeMap = routeMaps.find((map) => map.route.routeID === arriveTime.route.routeID);
        if(typeof routeMap === "undefined") throw new Error("No such routeID found.");
        const routeStop = routeMap.stops.find((stop) => stop.route.stopID === arriveTime.route.stopID);
        if(typeof routeStop === "undefined") throw new Error("No such stopID found.");
        return {
            color: arriveTime.color,
            description: arriveTime.route.description,
            eta: routeMap.etaTypeID,
            gtfs: routeMap.gtfsID,
            id: arriveTime.route.routeID,
            info: routeMap.infoText,
            order: routeMap.order,
            polygon: {
                color: routeMap.map.color,
                shape: routeMap.polyline,
            },
            position: routeMap.map.position,
            stop: {
                description: arriveTime.stop.description,
                id: arriveTime.route.stopID
            },
            schedule: arriveTime.times.map((time) => {
                return {
                    arriving: time.arrival.isArriving,
                    arrival: time.arrival.scheduledTime,
                    departed: time.departure.isDeparted,
                    departure: time.departure.scheduledTime,
                    elapsed: time.seconds,
                    estimated: time.estimateTime,
                    scheduled: time.scheduledTime,
                    status: time.onTimeStatus,
                    time: time.time,
                    vehicle: {
                        id: time.vehicleID
                    }
                }
            })
        }
    })
}

// Defines cache
export let vehicles = grabVehicles();
export let routes = grabRoutes();
setInterval(async () => {
    mapVehiclePoints = await resource.fetchMapVehiclePoints();
    vehicleCapacities = await resource.fetchVehicleCapacities();
    arrivalTimes = await resource.fetchArrivalTimes();
    routeMaps = await resource.fetchRouteMaps();
    vehicles = grabVehicles();
    routes = grabRoutes();
}, 5 * 1000);
