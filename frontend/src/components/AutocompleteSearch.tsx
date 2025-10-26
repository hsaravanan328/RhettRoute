import { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Bus } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Stop, BusRoute } from '../types';
import React from 'react';

interface SearchResult {
  type: 'stop' | 'route';
  item: Stop | BusRoute;
  matchText: string;
}

interface AutocompleteSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  stops: Stop[];
  routes: BusRoute[];
  onSelectStop: (stop: Stop) => void;
  onSelectRoute: (route: BusRoute) => void;
}

export function AutocompleteSearch({ 
  value, 
  onChange, 
  placeholder = "Search stops or routes...",
  stops,
  routes,
  onSelectStop,
  onSelectRoute
}: AutocompleteSearchProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const results: SearchResult[] = [];

  if (value.length >= 2) {
    const query = value.toLowerCase();

    // Search routes
    routes.forEach(route => {
      if (route.active && (
        route.name.toLowerCase().includes(query) ||
        route.description.toLowerCase().includes(query)
      )) {
        results.push({
          type: 'route',
          item: route,
          matchText: route.name
        });
      }
    });

    // Search stops
    stops.forEach(stop => {
      if (stop.name.toLowerCase().includes(query)) {
        results.push({
          type: 'stop',
          item: stop,
          matchText: stop.name
        });
      }
    });
  }

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

  const highlightMatch = (text: string, query: string) => {
    if (!query) return <span>{text}</span>;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <strong key={i} className="font-semibold text-[#CC0000]">{part}</strong>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'stop') {
      onSelectStop(result.item as Stop);
    } else {
      onSelectRoute(result.item as BusRoute);
    }
    onChange('');
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
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
          className="pl-10 pr-10 border-2 focus:border-[#CC0000]"
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 z-10"
            onClick={() => {
              onChange('');
              setShowSuggestions(false);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {showSuggestions && results.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#CC0000]/20 rounded-lg shadow-xl max-h-80 overflow-y-auto z-50"
        >
          {results.map((result, index) => (
            <button
              key={`${result.type}-${(result.item as any).id}`}
              onClick={() => handleSelectResult(result)}
              className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-[#FFE6E6] transition-colors text-left ${
                index === selectedIndex ? 'bg-[#FFE6E6]' : ''
              } ${index !== 0 ? 'border-t border-gray-100' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                result.type === 'stop' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {result.type === 'stop' ? (
                  <MapPin className="w-4 h-4 text-[#CC0000]" />
                ) : (
                  <Bus className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  {highlightMatch(result.matchText, value)}
                </p>
                {result.type === 'stop' && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(result.item as Stop).routeIds.length} route(s)
                  </p>
                )}
                {result.type === 'route' && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(result.item as BusRoute).description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && value.length >= 2 && results.length === 0 && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#CC0000]/20 rounded-lg shadow-xl p-4 z-50"
        >
          <p className="text-sm text-muted-foreground text-center">No results found</p>
        </div>
      )}
    </div>
  );
}