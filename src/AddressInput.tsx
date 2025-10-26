'use client';

import type { ReactSelectOption } from '@payloadcms/ui';

import type { PlacesAutocompleteOptions } from './index';

import { ReactSelect } from '@payloadcms/ui';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import React, { useCallback, useEffect, useState } from 'react';

type Option = ReactSelectOption;

/**
 * Parse address components from Google Places result
 * @param place - The Google Places result
 * @returns Parsed address data
 */
function parseAddressComponents(place: google.maps.places.PlaceResult): {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  route: string;
} {
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
    const partsToRemove = [country, state, city, postalCode].filter(Boolean);
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

  return { street, city, state, postalCode, country, route };
}

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
  placesAutocomplete?: PlacesAutocompleteOptions;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Start address',
  isGeocoding = false,
  placesAutocomplete = {},
}) => {
  const [options, setOptions] = useState<Array<Option>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | undefined>(
    value ? { label: value, value } : undefined,
  );
  const [autocompleteService, setAutocompleteService] =
    useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] =
    useState<google.maps.places.PlacesService | null>(null);

  // Load the places library
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    if (placesLib != null) {
      // Initialize services
      setAutocompleteService(new placesLib.AutocompleteService());

      // Create a div element for PlacesService (it requires an element)
      const div = document.createElement('div');
      setPlacesService(new placesLib.PlacesService(div));
    }
  }, [placesLib]);

  // Update selected option when value prop changes (but not if we just cleared it)
  useEffect(() => {
    // Only sync if value exists and is different from current selection
    if (value && value !== selectedOption?.label) {
      setSelectedOption({ label: value, value });
    } else if (!value && selectedOption) {
      // If value is cleared externally, clear selection
      setSelectedOption(undefined);
    }
  }, [value, selectedOption]);

  // Handle input change - fetch predictions from Google
  const handleInputChange = useCallback(
    (inputValue: string) => {
      // Don't clear the actual field value, just fetch predictions
      if (!inputValue || !autocompleteService) {
        setOptions([]);
        return;
      }

      setIsLoading(true);

      // Prepare request with proper typing
      const request: google.maps.places.AutocompletionRequest = {
        input: inputValue,
      };

      // Add component restrictions if provided
      const countryRestriction =
        placesAutocomplete.componentRestrictions?.country;
      if (countryRestriction !== undefined && countryRestriction.length > 0) {
        request.componentRestrictions = {
          country: countryRestriction,
        };
      }

      // Add other autocomplete options
      if (placesAutocomplete.types !== undefined) {
        request.types = placesAutocomplete.types;
      }
      if (placesAutocomplete.locationBias !== undefined) {
        request.locationBias = placesAutocomplete.locationBias;
      }
      if (placesAutocomplete.locationRestriction !== undefined) {
        request.locationRestriction = placesAutocomplete.locationRestriction;
      }

      void autocompleteService.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsLoading(false);

          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !predictions
          ) {
            setOptions([]);
            return;
          }

          const newOptions: Array<Option> = predictions.map((prediction) => ({
            label: prediction.description,
            value: prediction.place_id,
          }));

          setOptions(newOptions);
        },
      );
    },
    [autocompleteService, placesAutocomplete],
  );

  // Handle selection - fetch place details
  const handleSelect = useCallback(
    (option: Option) => {
      if (placesService == null) {
        return;
      }

      const placeId = option.value as string;
      setIsLoading(true);

      void placesService.getDetails(
        {
          placeId,
          fields: [
            'place_id',
            'geometry',
            'formatted_address',
            'address_components',
            'name',
          ],
        },
        (place, status) => {
          setIsLoading(false);

          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            place == null
          ) {
            return;
          }

          if (place.geometry?.location == null) {
            return;
          }

          const location = place.geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          // Parse address components using helper function
          const { street, city, state, postalCode, country } =
            parseAddressComponents(place);

          // Update the displayed value
          const newOption = { label: street, value: street };
          setSelectedOption(newOption);
          onChange(street);

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

          // Clear options after selection
          setOptions([]);
        },
      );
    },
    [placesService, onChange, onPlaceSelect],
  );

  return (
    <div className="address-search-field space-y-2">
      <label className="field-label" htmlFor="">
        Street address
      </label>
      <ReactSelect
        value={selectedOption}
        options={options}
        onChange={(selected) => {
          if (selected != null && !Array.isArray(selected)) {
            handleSelect(selected);
          } else if (selected == null) {
            // Handle clear
            setSelectedOption(undefined);
            onChange('');
          }
        }}
        onInputChange={handleInputChange}
        isSearchable
        isClearable
        isLoading={isLoading || isGeocoding}
        placeholder={placeholder}
        noOptionsMessage={({ inputValue }) =>
          inputValue ? 'No addresses found' : 'Start typing to search...'
        }
      />
    </div>
  );
};
