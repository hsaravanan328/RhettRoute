import { Star, MapPin, Clock, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { FavoriteStop, Stop, Arrival, BusRoute } from '../types';

interface FavoritesViewProps {
  favorites: FavoriteStop[];
  stops: Stop[];
  arrivals: Arrival[];
  routes: BusRoute[];
  onStopClick: (stop: Stop) => void;
  onRemoveFavorite: (stopId: string) => void;
}

export function FavoritesView({ 
  favorites, 
  stops, 
  arrivals, 
  routes, 
  onStopClick,
  onRemoveFavorite 
}: FavoritesViewProps) {
  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[#FFE6E6] flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-[#CC0000]" />
        </div>
        <h2 className="mb-2">No Favorite Stops</h2>
        <p className="text-muted-foreground max-w-sm">
          Add your frequently used stops to favorites for quick access to arrival times.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <h2 className="mb-4">Favorite Stops</h2>
      {favorites.map(favorite => {
        const stop = stops.find(s => s.id === favorite.stopId);
        const route = routes.find(r => r.id === favorite.routeId);
        if (!stop || !route) return null;

        const nextArrivals = arrivals
          .filter(a => a.stopId === stop.id && a.routeId === route.id)
          .sort((a, b) => a.minutes - b.minutes)
          .slice(0, 2);

        return (
          <Card 
            key={`${favorite.stopId}-${favorite.routeId}`}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onStopClick(stop)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <h3>{stop.name}</h3>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: route.bgColor }}
                  >
                    <div
                      className="w-5 h-1 rounded-full"
                      style={{ backgroundColor: route.color }}
                    />
                  </div>
                  <span className="text-sm" style={{ color: route.textColor }}>
                    {route.name}
                  </span>
                </div>

                {nextArrivals.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {nextArrivals.map((arrival, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md"
                        style={{ backgroundColor: route.bgColor }}
                      >
                        <Clock className="w-3.5 h-3.5" style={{ color: route.textColor }} />
                        <span className="text-sm" style={{ color: route.textColor }}>
                          {arrival.minutes < 1 ? 'Now' : `${arrival.minutes} min`}
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

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFavorite(favorite.stopId);
                }}
              >
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
