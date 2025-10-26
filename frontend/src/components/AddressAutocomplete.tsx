import React, { useEffect, useRef } from "react";
import { Input } from "./ui/input";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSelectAddress: (result: { address: string; lat: number; lng: number }) => void;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder,
  onSelectAddress,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.google?.maps?.places) {
        clearInterval(interval);
  
        const input = inputRef.current;
        if (!input) return;
  
        const autocomplete = new google.maps.places.Autocomplete(input, {
          fields: ["formatted_address", "geometry", "name"],
          types: ["geocode"],
        });
  
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry) return;
          onSelectAddress({
            address: place.formatted_address!,
            lat: place.geometry.location!.lat(),
            lng: place.geometry.location!.lng(),
          });
        });
      }
    }, 300); // check every 300ms
  
    return () => clearInterval(interval);
  }, []);
  

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search destination..."}
        className="bg-white text-black shadow-sm focus:ring-2 focus:ring-[#CC0000]"
      />
    </div>
  );
};
