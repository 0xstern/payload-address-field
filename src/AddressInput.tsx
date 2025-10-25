'use client';

import { TextInput } from '@payloadcms/ui';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import React, { useCallback, useEffect, useRef } from 'react';

interface AddressData {
  lat: number;
  lng: number;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  placeId: string;
  formattedAddress: string;
}

interface AddressInputProps {
  path: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (data: AddressData) => void;
  placeholder?: string;
  isGeocoding?: boolean;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  path,
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Street address',
  isGeocoding = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null!);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Load the places library
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    if (placesLib) {
      console.log('[AddressInput] Places library loaded successfully');
    }
  }, [placesLib]);

  // Initialize autocomplete when places library is loaded
  useEffect(() => {
    if (!placesLib || !inputRef.current || autocompleteRef.current) return;

    console.log('[AddressInput] Initializing autocomplete');

    try {
      // Create autocomplete instance
      const autocomplete = new placesLib.Autocomplete(inputRef.current, {
        fields: [
          'place_id',
          'geometry',
          'formatted_address',
          'address_components',
          'name',
        ],
      });

      autocompleteRef.current = autocomplete;

      // Listen for place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place.geometry?.location) {
          console.warn('[AddressInput] No geometry found for place');
          return;
        }

        console.log('[AddressInput] Place selected:', place.place_id);
        console.log(
          '[AddressInput] Full place object:',
          JSON.stringify(
            {
              place_id: place.place_id,
              formatted_address: place.formatted_address,
              name: place.name,
              address_components: place.address_components,
              types: place.types,
            },
            null,
            2,
          ),
        );

        const location = place.geometry.location;
        const lat = location.lat();
        const lng = location.lng();

        // Parse address components
        const components = place.address_components ?? [];
        let city = '';
        let state = '';
        let postalCode = '';
        let country = '';
        let route = '';

        components.forEach((component) => {
          const types = component.types;

          if (types.includes('route')) {
            route = component.long_name;
          } else if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
          } else if (types.includes('postal_code')) {
            postalCode = component.long_name;
          } else if (types.includes('country')) {
            country = component.long_name;
          }
        });

        // Build street address from name + route
        let street = '';

        // If we have a place name (like "MAG 218 Tower"), use it
        if (place.name != null && place.name !== route && place.name !== city) {
          street = place.name;
          // Append route if it exists and is different from name
          if (route && !street.toLowerCase().includes(route.toLowerCase())) {
            street = `${street}, ${route}`;
          }
        } else {
          // Fall back to building from formatted_address
          street = place.formatted_address ?? '';

          // Remove each component from the end
          const partsToRemove = [country, state, city, postalCode].filter(
            Boolean,
          );
          partsToRemove.forEach((part) => {
            street = street
              .replace(
                new RegExp(
                  `,?\\s*-?\\s*${part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`,
                  'i',
                ),
                '',
              )
              .trim();
          });

          // Clean up any trailing separators
          street = street.replace(/[,\s-]+$/, '').trim();
        }

        console.log('[AddressInput] Parsed address data:', {
          lat,
          lng,
          street,
          city,
          state,
          postalCode,
          country,
        });

        // Pass parsed data to parent
        onPlaceSelect({
          lat,
          lng,
          streetAddress: street,
          city,
          state,
          postalCode,
          country,
          placeId: place.place_id ?? '',
          formattedAddress: place.formatted_address ?? '',
        });
      });

      console.log('[AddressInput] Autocomplete initialized');
    } catch (error) {
      console.error('[AddressInput] Error initializing autocomplete:', error);
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [placesLib, onPlaceSelect]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  return (
    <div className="address-search-field">
      <div className="address-search-input-wrapper">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          height={16}
          width={16}
          stroke="currentColor"
          className="address-search-icon address-search-icon-left"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <TextInput
          path={path}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          inputRef={inputRef}
        />
        {isGeocoding && (
          <div className="address-search-spinner-right address-picker-loading-spinner" />
        )}
      </div>
    </div>
  );
};
