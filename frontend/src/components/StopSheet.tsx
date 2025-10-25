import { X, MapPin, Accessibility, ArrowRightLeft, Clock, Star } from 'lucide-react';
import { Stop, Arrival, BusRoute } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

interface StopSheetProps {
  stop: Stop | null;
  arrivals: Arrival[];
  routes: BusRoute[];
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
}

export function StopSheet({ stop, arrivals, routes, isFavorite, onClose, onToggleFavorite }: StopSheetProps) {
  if (!stop) return null;

  const stopArrivals = arrivals
    .filter(a => a.stopId === stop.id)
    .sort((a, b) => a.minutes - b.minutes);

  const getRoute = (routeId: string) => routes.find(r => r.id === routeId);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
      <div className="bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-hidden flex flex-col border-t-4 border-[#CC0000]">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-[#FFE6E6] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-[#CC0000]" />
              </div>
              <div className="flex-1">
                <h2>{stop.name}</h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {stop.accessible && (
                    <Badge variant="outline" className="gap-1">
                      <Accessibility className="w-3 h-3" />
                      Accessible
                    </Badge>
                  )}
                  {stop.transfers && stop.transfers.length > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <ArrowRightLeft className="w-3 h-3" />
                      Transfer
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFavorite}
                className="flex-shrink-0"
              >
                <Star className={`w-5 h-5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Transfers */}
        {stop.transfers && stop.transfers.length > 0 && (
          <div className="px-4 py-3 bg-blue-50 border-b">
            <p className="text-sm text-muted-foreground mb-1">Transfers available</p>
            <div className="flex flex-wrap gap-1.5">
              {stop.transfers.map((transfer, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {transfer}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Arrivals */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Upcoming Arrivals
            </h3>
            <div className="space-y-3">
              {stopArrivals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No upcoming arrivals
                </p>
              ) : (
                stopArrivals.map((arrival, idx) => {
                  const route = getRoute(arrival.routeId);
                  if (!route) return null;

                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: route.bgColor }}
                          >
                            <div
                              className="w-6 h-1.5 rounded-full"
                              style={{ backgroundColor: route.color }}
                            />
                          </div>
                          <div>
                            <p>{route.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {arrival.isLive ? 'Live tracking' : 'Scheduled'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5">
                            {arrival.isLive && (
                              <span 
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{ backgroundColor: route.color }}
                              />
                            )}
                            <p className="tabular-nums">
                              {arrival.minutes < 1 ? 'Now' : `${arrival.minutes} min`}
                            </p>
                          </div>
                        </div>
                      </div>
                      {idx < stopArrivals.length - 1 && <Separator className="mt-3" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
