// Defines parser
function parseTime(raw: string): number {
    // Parses time
    const match = raw.match(/\/Date\((\d+)(?:-\d+)?\)\//);
    if(match === null) throw new Error("Invalid date.");
    return parseInt(match[1]!);
}

// Defines fetchers
export async function fetchVehiclePoints() {
    // Parses JSON
    const response = await fetch("https://bu.transloc.com/Services/JSONPRelay.svc/GetMapVehiclePoints?apiKey=8882812681&isPublicMap=true");
    const results = await response.json() as {
        GroundSpeed: number;
        Heading: number;
        IsDelayed: boolean;
        IsOnRoute: boolean;
        Latitude: number;
        Longitude: number;
        Name: string;
        RouteID: number;
        Seconds: number;
        TimeStamp: string;
        VehicleID: number;
    }[];
    
    // Transforms result
    return results.map((result) => ({
        active: result.IsOnRoute,
        delayed: result.IsDelayed,
        name: result.Name,
        position: [ result.Latitude, result.Longitude ],
        route: {
            id: result.RouteID
        },
        time: parseTime(result.TimeStamp),
        vehicle: {
            id: result.VehicleID
        },
        velocity: [ result.GroundSpeed, result.Heading ]
    }));
}
export async function fetchArrivalTimes() {
    // Parses JSON
    const response = await fetch("https://bu.transloc.com/Services/JSONPRelay.svc/GetStopArrivalTimes?apiKey=8882812681&version=2");
    const results = await response.json() as {
        Color: string;
        RouteDescrpition: string;
        RouteId: number;
        RouteStopId: number;
        ShowDefaultedOnmap: boolean;
        ShowEstimatesOnMap: boolean;
        StopDescription: string;
        StopId: number;
        Times: {
            EstimateTime: string | null;
            IsArriving: boolean;
            IsDeparted: boolean;
            OnTimeStatus: boolean;
            ScheduledArrivalTime: string | null;
            ScheduledDepartureTime: string | null;
            ScheduledTime: string | null;
            Seconds: number;
            Text: string | null;
            Time: string;
            VehicleId: number | null;
        }[];
    }[];
    
    // Transforms result
    return results.map((result) => ({
        route: {
            name: result.RouteDescrpition,
            id: result.RouteId,
            stop: {
                id: result.RouteStopId
            }
        },
        schedules: result.Times.map((time) => ({
            actual: parseTime(time.Time),
            arriving: time.IsArriving,
            departed: time.IsDeparted,
            elapsed: time.Seconds,
            estimate: time.EstimateTime === null ? -1 : parseTime(time.EstimateTime),
            scheduled: time.ScheduledTime === null ? -1 : parseTime(time.ScheduledTime),
            status: time.OnTimeStatus,
            text: time.Text ?? "",
            vehicle: {
                id: time.VehicleId ?? -1
            }
        })),
        stop: {
            name: result.StopDescription,
            id: result.StopId
        }
    }));
}
export async function fetchVehicleCapacities() {
    // Parses JSON
    const response = await fetch("https://bu.transloc.com/Services/JSONPRelay.svc/GetVehicleCapacities");
    const results = await response.json() as {
        Capacity: number;
        CurrentOccupation: number;
        Percentage: number;
        VehicleID: number;
    }[];
    
    // Transforms result
    return results.map((result) => ({
        available: result.Capacity - result.CurrentOccupation,
        occupied: result.CurrentOccupation,
        total: result.Capacity,
        vehicle: {
            id: result.VehicleID
        }
    }));
}
export async function fetchRouteMaps() {
    // Parses JSON
    const response = await fetch("https://bu.transloc.com/Services/JSONPRelay.svc/GetRoutesForMapWithScheduleWithEncodedLine?apiKey=8882812681&isDispatch=false");
    const results = await response.json() as {
        Description: string;
        EncodedPolyline: string;
        ETATypeID: number;
        GtfsId: string;
        HideRouteLine: boolean;
        InfoText: string;
        IsCheckedOnMap: boolean;
        IsCheckLineOnlyOnMap: boolean;
        IsRunning: boolean;
        IsVisibleOnMap: boolean;
        Landmarks: never[];
        MapLatitude: number;
        MapLineColor: string;
        MapLongitude: number;
        MapZoom: number;
        Order: number;
        RouteID: number;
        RouteVehicleIcon: string;
        ShowPolygon: boolean;
        ShowRouteArrows: boolean;
        Stops: {
            AddressID: number;
            City: string;
            Description: string;
            GtfsId: string;
            Heading: number;
            Latitude: number;
            Line1: string;
            Line2: string;
            Longitude: number;
            MapPoints: never[];
            MaxZoomLevel: number;
            Order: number;
            RouteDescription: number;
            RouteID: number;
            RouteStopID: number;
            SecondsAtStop: number;
            SecondsToNextStop: number;
            ShowDefaultedOnMap: boolean;
            ShowEstimatesOnMap: boolean;
            SignVerbiage: string;
            State: string;
            TextingKey: string;
            Zip: string;
        }[];
    }[];
    
    // Transforms result
    return results.map((result) => ({
        name: result.Description,
        polyline: result.EncodedPolyline,
        position: [ result.MapLatitude, result.MapLongitude ],
        route: {
            id: result.RouteID
        },
        stops: result.Stops.map((stop) => ({
            duration: stop.SecondsToNextStop,
            name: stop.Description,
            position: [ stop.Latitude, stop.Longitude ],
            route: {
                id: stop.RouteID,
                name: stop.RouteDescription,
                stop: {
                    id: stop.RouteStopID
                }
            },
            sign: {
                lines: [ stop.Line1, stop.Line2 ],
                verbiage: stop.SignVerbiage
            },
            stalled: stop.SecondsAtStop
        }))
    }));
}

// Defines consolidator
export async function consolidate() {
    // Fetches endpoints
    const vehiclePoints = await fetchVehiclePoints();
    const arrivalTimes = await fetchArrivalTimes();
    const vehicleCapacities = await fetchVehicleCapacities();
    const routeMaps = await fetchRouteMaps();

    // Consolidates vehicles
    const vehicles = vehiclePoints.map((point) => {
        const capacity = vehicleCapacities.find((capacity) => capacity.vehicle.id === point.vehicle.id);
        if(typeof capacity === "undefined") throw new Error("Vehicle ID not found in database.");
        return {
            active: point.active,
            capacity: {
                available: capacity.available,
                occupied: capacity.occupied,
                total: capacity.total
            },
            delayed: point.delayed,
            id: point.vehicle.id,
            name: point.name,
            position: point.position,
            route: point.route,
            time: point.time,
            velocity: point.velocity
        };
    });
    const routes = arrivalTimes.map((time) => {
        const map = routeMaps.find((map) => map.route.id === time.route.id);
        if(typeof map === "undefined") throw new Error("Route ID not found in database.");
        return {
            route: time.route,
            stop: time.stop,
            times: time.schedules.map((schedule) => {
                const vehicle = vehicles.find((vehicle) => vehicle.id === schedule.vehicle.id);
                if(typeof vehicle === "undefined") throw new Error("Vehicle ID not found in database.");
                return {
                    actual: schedule.actual,
                    arriving: schedule.arriving,
                    departed: schedule.departed,
                    elapesd: schedule.elapsed,
                    estimate: schedule.estimate,
                    scheduled: schedule.scheduled,
                    status: schedule.status,
                    text: schedule.text,
                    vehicle: vehicle
                }
            }),
            name: map.name,
            polyline: map.polyline,
            position: map.position,
            stops: map.stops
        }
    });
    return routes;
}
