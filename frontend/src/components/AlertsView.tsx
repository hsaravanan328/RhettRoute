import { AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ServiceAlert, BusRoute } from '../types';
import { Badge } from './ui/badge';

interface AlertsViewProps {
  alerts: ServiceAlert[];
  routes: BusRoute[];
}

export function AlertsView({ alerts, routes }: AlertsViewProps) {
  const getAlertIcon = (severity: ServiceAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getAlertVariant = (severity: ServiceAlert['severity']) => {
    return severity === 'critical' ? 'destructive' : 'default';
  };

  const getRouteNames = (routeIds: string[]) => {
    return routeIds
      .map(id => routes.find(r => r.id === id)?.name.split(' - ')[0])
      .filter(Boolean)
      .join(', ');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2>Service Alerts</h2>
        <Badge variant="outline" className="border-[#CC0000] text-[#CC0000]">{alerts.length} Active</Badge>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Info className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="mb-2">All Clear!</h3>
          <p className="text-muted-foreground">
            No service alerts at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <Alert key={alert.id} variant={getAlertVariant(alert.severity)}>
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.severity)}
                <div className="flex-1">
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription className="mt-1">
                    {alert.description}
                  </AlertDescription>
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <span>Affects: {getRouteNames(alert.routeIds)}</span>
                    <span>•</span>
                    <span>{formatTime(alert.timestamp)}</span>
                  </div>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}
