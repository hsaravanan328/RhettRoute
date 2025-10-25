import { ChevronRight, Clock, Users, Accessibility } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { BusRoute, Arrival } from '../types';

interface RouteCardProps {
  route: BusRoute;
  arrivals: Arrival[];
  onClick: () => void;
}

export function RouteCard({ route, arrivals, onClick }: RouteCardProps) {
  const routeArrivals = arrivals
    .filter(a => a.routeId === route.id)
    .sort((a, b) => a.minutes - b.minutes)
    .slice(0, 3);

  if (!route.active) {
    return (
      <Card className="p-4 opacity-60">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: route.bgColor }}
          >
            <div
              className="w-8 h-2 rounded-full"
              style={{ backgroundColor: route.color }}
            />
          </div>
          <div className="flex-1">
            <h3>{route.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{route.description}</p>
            <Badge variant="outline" className="mt-2">Coming Soon</Badge>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-[#CC0000]/30"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ backgroundColor: route.bgColor }}
        >
          <div
            className="w-8 h-2 rounded-full shadow-sm"
            style={{ backgroundColor: route.color }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 style={{ color: route.textColor }}>{route.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{route.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </div>

          {routeArrivals.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {routeArrivals.map((arrival, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md"
                  style={{ backgroundColor: route.bgColor }}
                >
                  <Clock className="w-3.5 h-3.5" style={{ color: route.textColor }} />
                  <span className="text-sm" style={{ color: route.textColor }}>
                    {arrival.minutes} min
                  </span>
                  {arrival.isLive && (
                    <span 
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: route.color }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
