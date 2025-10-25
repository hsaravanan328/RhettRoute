import { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface AddressResult {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectAddress: (result: AddressResult) => void;
  placeholder?: string;
}

/**
 * Destination Autocomplete Search
 * 
 * A Google Maps Places API powered search component that provides
 * real-time location suggestions with autocomplete functionality.
 */
export function AddressAutocomplete({ 
  value, 
  onChange, 
  onSelectAddress,
  placeholder = "Search address or stop..."
}: AddressAutocompleteProps) {
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (window.google?.maps?.places) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      const mapDiv = document.createElement('div');
      const map = new google.maps.Map(mapDiv);
      placesService.current = new google.maps.places.PlacesService(map);
    }
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value.length < 2 || !autocompleteService.current) {
      setPredictions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const request = {
      input: value,
      componentRestrictions: { country: 'us' },
      location: new google.maps.LatLng(42.3505, -71.1054), // BU campus
      radius: 50000, // 50km radius
    };

    const timeoutId = setTimeout(() => {
      autocompleteService.current?.getPlacePredictions(request, (results, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
        } else {
          setPredictions([]);
        }
      });
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      { placeId: prediction.place_id },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const result: AddressResult = {
            address: prediction.description,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: prediction.place_id,
          };
          onSelectAddress(result);
          onChange('');
          setShowSuggestions(false);
        }
      }
    );
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="text-[#CC0000]">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % predictions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + predictions.length) % predictions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (predictions[selectedIndex]) {
          handleSelectPrediction(predictions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#CC0000] pointer-events-none z-10" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-11 pr-10 h-11 border-2 border-white/50 focus:border-white bg-white/90 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 shadow-lg focus:shadow-xl transition-all rounded-lg"
          aria-label="Destination search"
          aria-autocomplete="list"
          aria-controls="autocomplete-results"
          aria-expanded={showSuggestions && (predictions.length > 0 || isLoading)}
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 z-10 hover:bg-gray-100 rounded-md"
            onClick={() => {
              onChange('');
              setShowSuggestions(false);
              setPredictions([]);
            }}
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-600" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && value.length >= 2 && (
        <div 
          ref={dropdownRef}
          id="autocomplete-results"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[400px] overflow-hidden z-50 animate-fade-in"
        >
          {isLoading && (
            <div className="px-4 py-8 text-center">
              <div className="inline-block w-6 h-6 border-3 border-[#CC0000] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
            </div>
          )}

          {!isLoading && predictions.length > 0 && (
            <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
              {predictions.map((prediction, index) => (
                <button
                  key={prediction.place_id}
                  onClick={() => handleSelectPrediction(prediction)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={`w-full px-4 py-3.5 flex items-start gap-3 transition-all text-left group ${
                    index === selectedIndex 
                      ? 'bg-[#FFE6E6] border-l-4 border-[#CC0000]' 
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                  } ${index !== 0 ? 'border-t border-gray-100' : ''}`}
                >
                  {/* Location Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    index === selectedIndex 
                      ? 'bg-[#CC0000] shadow-md' 
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <MapPin className={`w-5 h-5 ${
                      index === selectedIndex ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  
                  {/* Place Details */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    {/* Main Text - Bold */}
                    <p className="text-[15px] leading-tight mb-1">
                      <strong className="font-semibold text-gray-900">
                        {highlightMatch(prediction.structured_formatting.main_text, value)}
                      </strong>
                    </p>
                    
                    {/* Secondary Text - Lighter */}
                    {prediction.structured_formatting.secondary_text && (
                      <p className="text-[13px] text-gray-600 leading-tight">
                        {prediction.structured_formatting.secondary_text}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && predictions.length === 0 && (
            <div className="px-4 py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-900 mb-1">No results found</p>
              <p className="text-xs text-gray-500">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
