export interface BusRoute {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
  active: boolean;
}

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  routeIds: string[];
  accessible: boolean;
  transfers?: string[];
}

export interface BusLocation {
  id: string;
  routeId: string;
  lat: number;
  lng: number;
  nextStopId: string;
  occupancy: 'low' | 'medium' | 'high';
}

export interface Arrival {
  stopId: string;
  routeId: string;
  minutes: number;
  isLive: boolean;
  busId: string;
}

export interface ServiceAlert {
  id: string;
  routeIds: string[];
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

export interface FavoriteStop {
  stopId: string;
  routeId: string;
}

export interface Journey {
  destination: {
    address: string;
    lat: number;
    lng: number;
  };
  segments: JourneySegment[];
  totalDuration: number;
}

export interface JourneySegment {
  type: 'bus' | 'walk';
  route?: BusRoute;
  fromStop?: Stop;
  toStop?: Stop;
  duration: number;
  distance?: number;
  instructions?: string;
}
