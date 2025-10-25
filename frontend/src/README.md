# BU Bus - Boston University Shuttle Tracker

A modern, mobile-first web application for tracking Boston University shuttle buses in real-time.

## Features

- **Real-time Bus Tracking** - See live bus locations and arrival predictions
- **Multiple Routes** - Track Red (BU Charles River - Medical Campus), Yellow (Fenway), Green (Comm Ave), and future routes
- **Interactive Map** - Visual map interface with route lines, bus locations, and stops
- **Smart Search** - Autocomplete search with intelligent suggestions for stops and routes
- **Favorites** - Save frequently used stops for quick access
- **Service Alerts** - Stay informed about delays and service updates
- **Accessibility** - Full accessibility information for all stops and routes

## Setup Instructions

### Google Maps Integration

To enable live street-level maps:

1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Maps JavaScript API for your project
3. Update the API key in `/components/GoogleMapView.tsx`:
   ```typescript
   script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY`;
   ```
4. Change the import in `/App.tsx` from `FallbackMapView` to `GoogleMapView`

The app currently runs in demo mode with a stylized fallback map view.

## BU Branding

The app uses Boston University's official color scheme:
- **Primary Red**: #CC0000
- **White**: #FFFFFF
- **Accent Colors**: Distinct colors for each route (Red, Orange, Green, Blue)

## Technology Stack

- React + TypeScript
- Tailwind CSS
- Google Maps API (when configured)
- Shadcn/ui Components
- Lucide React Icons

## Development

The app is designed for mobile-first experience with a maximum width of 430px, optimized for smartphone screens.

### Key Components

- `AutocompleteSearch` - Intelligent search with keyboard navigation
- `FallbackMapView` / `GoogleMapView` - Map interfaces with route visualization
- `RouteCard` - Route information cards with live arrival times
- `StopSheet` - Detailed stop information bottom sheet
- `FavoritesView` - Saved stops quick access
- `AlertsView` - Service alerts and notifications

## Future Enhancements

- Integration with real BU shuttle API for live data
- User geolocation for nearby stops
- Push notifications for favorite routes
- Trip planning with multi-route journeys
- Historical arrival time analytics
