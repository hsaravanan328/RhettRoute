import React, { useEffect, useRef } from 'react';
import { Input } from './ui/input';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSelectAddress: (place: google.maps.places.PlaceResult) => void;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder,
  onSelectAddress,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!window.google || !window.google.maps) return;
    if (!inputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'formatted_address', 'name'], // ✅ ensure geometry is returned
      types: ['geocode'], // restricts to addresses
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) {
        console.warn('⚠️ No geometry found for selected place.');
        return;
      }
      onSelectAddress(place);
    });

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [onSelectAddress]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || 'Enter a destination...'}
      className="
        bg-white border border-gray-300
        text-black placeholder:text-gray-600
        focus:ring-2 focus:ring-[#CC0000] focus:outline-none
        !text-black placeholder:!text-gray-600
      "
      style={{
        color: '#000',
        backgroundColor: '#fff',
        WebkitTextFillColor: '#000', // prevents Chrome autofill white text
        caretColor: '#000',
      }}
    />
  );
};