// Defines type
export type MapVehiclePoint = {
    groundSpeed: number;
    heading: number;
    flags: {
        isDelayed: boolean;
        isOnRoute: boolean;
    };
    position: [ number, number ];
    name: string;
    routeID: number;
    seconds: number;
    time: number;
    vehicleID: number;
};
export type VehicleCapacity = {
    capacity: number;
    occupied: number;
    percentage: number;
    vehicleID: number;
};
export type ArrivalTime = {
    color: string;
    flags: {
        showDefaultedOnMap: boolean;
        showEstimatesOnMap: boolean;
    };
    route: {
        description: string;
        routeID: number;
        stopID: number;
    };
    stop: {
        description: string;
        stopID: number;
    };
    times: {
        arrival: {
            isArriving: boolean;
            scheduledTime: number;
        };
        departure: {
            isDeparted: boolean;
            scheduledTime: number;
        };
        estimateTime: number;
        onTimeStatus: number;
        scheduledTime: number;
        seconds: number;
        text: string | null;
        time: number;
        vehicleID: number;
    }[];
};
export type RouteMap = {
    description: string;
    etaTypeID: number;
    gtfsID: string;
    infoText: string;
    flags: {
        hideRouteLine: boolean;
        isCheckedOnMap: boolean;
        isCheckLineOnlyOnMap: boolean;
        isRunning: boolean;
        isVisibleOnMap: boolean;
        showPolygon: boolean;
        showRouteArrows: boolean;
    };
    landmarks: never[];
    map: {
        color: string;
        position: [ number, number ];
        zoom: number;
    };
    order: number;
    polyline: string;
    route: {
        routeID: number;
        vehicleIcon: string;
    };
    stops: {
        addressID: number;
        city: string;
        description: string;
        flags: {
            showDefaultedOnMap: boolean;
            showEstimatesOnMap: boolean;
        };
        gtfsID: string;
        heading: number;
        lines: [ string, string ];
        maxPoints: never[];
        maxZoom: number;
        order: number;
        position: [ number, number ];
        route: {
            description: string;
            routeID: number;
            stopID: number;
        };
        secondsAtStop: number;
        secondsToNextStop: number;
        signVerbiage: string;
        state: string;
        textingKey: string;
        zip: string;
    }[];
};

// Defines parser
function parseTime(raw: string): number {
    const match = raw.match(/\/Date\((\d+)(?:-\d+)?\)\//);
    if(match === null) throw new Error("No date found.");
    return +match[1]!;
}

// Defines fetchers
export async function fetchMapVehiclePoints(): Promise<MapVehiclePoint[]> {
    const response = await fetch("https://bu.transloc.com/Services/JSONPRelay.svc/GetMapVehiclePoints?apiKey=8882812681&isPublicMap=true");
    const points = await response.json() as {
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
    return points.map((point) => ({
        groundSpeed: point.GroundSpeed,
        heading: point.Heading,
        flags: {
            isDelayed: point.IsDelayed,
            isOnRoute: point.IsOnRoute
        },
        position: [ point.Latitude, point.Longitude ],
        name: point.Name,
        routeID: point.RouteID,
        seconds: point.Seconds,
        time: parseTime(point.TimeStamp),
        vehicleID: point.VehicleID  
    }));
}
export async function fetchVehicleCapacities(): Promise<VehicleCapacity[]> {
    const response = await fetch("https://bu.transloc.com/Services/JSONPRelay.svc/GetVehicleCapacities");
    const capacities = await response.json() as {
        Capacity: number;
        CurrentOccupation: number;
        Percentage: number;
        VehicleID: number;
    }[];
    return capacities.map((capacity) => ({
        capacity: capacity.Capacity,
        occupied: capacity.CurrentOccupation,
        percentage: capacity.Percentage,
        vehicleID: capacity.VehicleID
    }));
}
export async function fetchArrivalTimes(): Promise<ArrivalTime[]> {
    const response = await fetch("https://bu.transloc.com/Services/JSONPRelay.svc/GetStopArrivalTimes?apiKey=8882812681&routeIds=4&version=2");
    const arrivals = await response.json() as {
        Color: string;
        RouteDescription: string;
        RouteId: number;
        RouteStopId: number;
        ShowDefaultedOnMap: boolean;
        ShowEstimatesOnMap: boolean;
        StopDescription: string;
        StopId: number;
        Times: {
            EstimateTime: string;
            IsArriving: boolean;
            IsDeparted: boolean;
            OnTimeStatus: number;
            ScheduledArrivalTime: string;
            ScheduledDepartureTime: string;
            ScheduledTime: string;
            Seconds: number;
            Text: string | null;
            Time: string;
            VehicleID: number;
        }[];
    }[];
    return arrivals.map((arrival) => ({
        color: arrival.Color,
        flags: {
            showDefaultedOnMap: arrival.ShowDefaultedOnMap,
            showEstimatesOnMap: arrival.ShowEstimatesOnMap,
        },
        route: {
            description: arrival.RouteDescription,
            routeID: arrival.RouteId,
            stopID: arrival.RouteStopId,
        },
        stop: {
            description: arrival.StopDescription,
            stopID: arrival.StopId,
        },
        times: arrival.Times.map((time) => ({
            arrival: {
                isArriving: time.IsArriving,
                scheduledTime: parseTime(time.ScheduledArrivalTime),
            },
            estimateTime: time.EstimateTime === null ? -1 : parseTime(time.EstimateTime),
            departure: {
                isDeparted: time.IsDeparted,
                scheduledTime: parseTime(time.ScheduledDepartureTime),
            },
            onTimeStatus: time.OnTimeStatus,
            scheduledTime: parseTime(time.ScheduledTime),
            seconds: time.Seconds,
            text: time.Text,
            time: parseTime(time.Time),
            vehicleID: time.VehicleID
        }))
    }));
}
export async function fetchRouteMaps(): Promise<RouteMap[]> {
    const response = await fetch("https://bu.transloc.com/Services/JSONPRelay.svc/GetRoutesForMapWithScheduleWithEncodedLine?apiKey=8882812681&isDispatch=false");
    const routeMaps = await response.json() as {
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
            MaxZoomlevel: number;
            Order: number;
            RouteDescription: string;
            RouteID: number;
            RouteStopID: number;
            SecondsAtStop: number;
            SecondsToNextStop: number;
            ShowDefaultedOnMap: boolean;
            ShowEstimatesOnMap: boolean;
            SignVerbiage: string;
            State: string;
            Textingkey: string;
            Zip: string;
        }[];
    }[];
    return routeMaps.map((routeMap) => ({
        description: routeMap.Description,
        etaTypeID: routeMap.ETATypeID,
        flags: {
            hideRouteLine: routeMap.HideRouteLine,
            isCheckedOnMap: routeMap.IsCheckedOnMap,
            isCheckLineOnlyOnMap: routeMap.IsCheckLineOnlyOnMap,
            isRunning: routeMap.IsRunning,
            isVisibleOnMap: routeMap.IsVisibleOnMap,
            showPolygon: routeMap.ShowPolygon,
            showRouteArrows: routeMap.ShowRouteArrows
        },
        gtfsID: routeMap.GtfsId,
        infoText: routeMap.InfoText,
        landmarks: [],
        map: {
            color: routeMap.MapLineColor,
            position: [ routeMap.MapLatitude, routeMap.MapLongitude ],
            zoom: routeMap.MapZoom
        },
        order: routeMap.Order,
        polyline: routeMap.EncodedPolyline,
        route: {
            routeID: routeMap.RouteID,
            vehicleIcon: routeMap.RouteVehicleIcon
        },
        stops: routeMap.Stops.map((stop) => ({
            addressID: stop.AddressID,
            city: stop.City,
            description: stop.Description,
            flags: {
                showDefaultedOnMap: stop.ShowDefaultedOnMap,
                showEstimatesOnMap: stop.ShowEstimatesOnMap
            },
            gtfsID: stop.GtfsId,
            heading: stop.Heading,
            lines: [ stop.Line1, stop.Line2 ],
            maxPoints: [],
            maxZoom: stop.MaxZoomlevel,
            order: stop.Order,
            position: [ stop.Latitude, stop.Longitude ],
            route: {
                description: stop.RouteDescription,
                routeID: stop.RouteID,
                stopID: stop.RouteStopID
            },
            secondsAtStop: stop.SecondsAtStop,
            secondsToNextStop: stop.SecondsToNextStop,
            signVerbiage: stop.SignVerbiage,
            state: stop.State,
            textingKey: stop.Textingkey,
            zip: stop.Zip
        }))
    }));
}
