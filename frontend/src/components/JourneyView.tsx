import { X, Bus, Footprints, MapPin, Clock, Navigation } from 'lucide-react';
import { Journey } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface JourneyViewProps {
  journey: Journey;
  onClose: () => void;
}

export function JourneyView({ journey, onClose }: JourneyViewProps) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
      <div className="bg-white rounded-t-2xl shadow-2xl max-h-[75vh] overflow-hidden flex flex-col border-t-4 border-[#CC0000]">
        {/* Header */}
        <div className="p-4 bg-[#CC0000] text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="w-5 h-5" />
                <h2 className="text-white">Your Journey</h2>
              </div>
              <p className="text-sm text-white/90">{journey.destination.address}</p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{formatDuration(journey.totalDuration)} total</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0 text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Journey Segments */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {journey.segments.map((segment, index) => (
              <div key={index}>
                {segment.type === 'bus' && segment.route && (
                  <div 
                    className="p-4 rounded-lg border-2 shadow-md"
                    style={{ 
                      borderColor: segment.route.color,
                      backgroundColor: segment.route.bgColor 
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md"
                        style={{ backgroundColor: segment.route.color }}
                      >
                        <Bus className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 style={{ color: segment.route.textColor }}>
                            Take {segment.route.name.split(' - ')[0]} Line
                          </h3>
                          <Badge 
                            className="border-2"
                            style={{ 
                              backgroundColor: segment.route.color,
                              color: 'white',
                              borderColor: segment.route.color
                            }}
                          >
                            {formatDuration(segment.duration)}
                          </Badge>
                        </div>
                        
                        {segment.fromStop && segment.toStop && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full border-2"
                                style={{ borderColor: segment.route.color }}
                              />
                              <p className="text-sm">Board at: <strong>{segment.fromStop.name}</strong></p>
                            </div>
                            <div 
                              className="w-0.5 h-6 ml-1.5"
                              style={{ backgroundColor: segment.route.color }}
                            />
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: segment.route.color }}
                              />
                              <p className="text-sm">Get off at: <strong>{segment.toStop.name}</strong></p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {segment.type === 'walk' && (
                  <div className="p-4 rounded-lg border-2 border-gray-300 bg-gray-50 shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Footprints className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3>Walk to Destination</h3>
                          <Badge variant="outline" className="border-2 border-gray-600">
                            {formatDuration(segment.duration)}
                          </Badge>
                        </div>
                        {segment.distance && (
                          <p className="text-sm text-muted-foreground">
                            {formatDistance(segment.distance)} walking
                          </p>
                        )}
                        {segment.instructions && (
                          <p className="text-sm mt-2">{segment.instructions}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {index < journey.segments.length - 1 && (
                  <div className="flex items-center justify-center py-2">
                    <div className="w-0.5 h-6 bg-gray-300" />
                  </div>
                )}
              </div>
            ))}

            {/* Destination */}
            <div className="flex items-center gap-3 p-3 bg-green-50 border-2 border-green-500 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm opacity-60">Destination</p>
                <p>{journey.destination.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
