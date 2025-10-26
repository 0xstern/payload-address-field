'use client';

import type { GroupFieldClientComponent } from 'payload';

import type { MapConfig, PlacesAutocompleteOptions } from './index';

import { Collapsible, useField } from '@payloadcms/ui';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useCallback, useState } from 'react';

import { AddressForm } from './AddressForm';
import { AddressInput } from './AddressInput';
import { AddressPickerMap } from './AddressPickerMap';

import './styles.css';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

/**
 * Custom props for the AddressPickerField component
 */
export interface AddressPickerCustomProps {
  /** Whether to show coordinate input fields */
  showCoordinates?: boolean;
  /** Configuration for Google Places Autocomplete */
  placesAutocomplete?: PlacesAutocompleteOptions;
  /** Configuration for the Google Maps component */
  mapConfig?: MapConfig;
}

/**
 * Setter functions for address field updates
 */
interface AddressSetters {
  /** Set the formatted address value */
  setFormattedAddress: (value: string) => void;
  /** Set the city value */
  setCity: (value: string) => void;
  /** Set the state/province value */
  setState: (value: string) => void;
  /** Set the postal code value */
  setPostalCode: (value: string) => void;
  /** Set the country value */
  setCountry: (value: string) => void;
  /** Set the street address value */
  setStreetAddress: (value: string) => void;
}

/**
 * Extract field label from Payload field config
 * @param field - The Payload field configuration
 * @returns The field label or default 'Address'
 */
function getFieldLabel(field: unknown): string {
  // Safely extract label from field config
  if (
    typeof field === 'object' &&
    field !== null &&
    'label' in field &&
    typeof field.label === 'string' &&
    field.label.length > 0
  ) {
    return field.label;
  }
  return 'Address';
}

/**
 * Process geocoding result and update address fields
 * @param place - The Google Maps geocoding result
 * @param setters - Object containing setter functions for each address field
 */
function processGeocodingResult(
  place: google.maps.GeocoderResult,
  setters: AddressSetters,
): void {
  // Set formatted address
  setters.setFormattedAddress(place.formatted_address);

  // Parse address components
  let city = '';
  let state = '';
  let postalCode = '';
  let country = '';

  place.address_components.forEach((component) => {
    const types = component.types;

    if (types.includes('locality')) {
      city = component.long_name;
      setters.setCity(city);
    } else if (types.includes('administrative_area_level_1')) {
      state = component.long_name;
      setters.setState(state);
    } else if (types.includes('postal_code')) {
      postalCode = component.long_name;
      setters.setPostalCode(postalCode);
    } else if (types.includes('country')) {
      country = component.long_name;
      setters.setCountry(country);
    }
  });

  // Build street address by removing city/state/country from formatted_address
  let street = place.formatted_address;

  // Remove each component from the end
  const partsToRemove = [country, state, city, postalCode].filter(Boolean);
  partsToRemove.forEach((part) => {
    // Remove the part and any trailing separators (comma, dash, etc.)
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

  if (street.length > 0) {
    setters.setStreetAddress(street);
  }
}

/**
 * Address Picker Field Component for Payload CMS
 *
 * A comprehensive address input field with Google Maps integration,
 * autocomplete, and geocoding capabilities.
 *
 * @param props - Payload CMS field props including custom configuration
 * @param props.field - Payload field configuration
 * @param props.path - Field path for data binding
 * @param props.showCoordinates - Whether to display latitude/longitude inputs
 * @param props.placesAutocomplete - Google Places Autocomplete configuration
 * @param props.mapConfig - Google Maps display configuration
 * @returns The rendered address picker field component
 */
export const AddressPickerField: GroupFieldClientComponent = (props) => {
  // Safely extract props with defaults
  const showCoordinates =
    'showCoordinates' in props && typeof props.showCoordinates === 'boolean'
      ? props.showCoordinates
      : true;

  const placesAutocomplete: PlacesAutocompleteOptions =
    'placesAutocomplete' in props &&
    typeof props.placesAutocomplete === 'object' &&
    props.placesAutocomplete !== null
      ? (props.placesAutocomplete as PlacesAutocompleteOptions)
      : {};

  const mapConfig: MapConfig =
    'mapConfig' in props &&
    typeof props.mapConfig === 'object' &&
    props.mapConfig !== null
      ? (props.mapConfig as MapConfig)
      : {};

  const path = props.path;

  // Extract label from field config safely
  const fieldLabel = getFieldLabel(props.field);

  // Use Payload's useField hook for each field
  const { value: lat, setValue: setLat } = useField<number>({
    path: `${path}.lat`,
  });
  const { value: lng, setValue: setLng } = useField<number>({
    path: `${path}.lng`,
  });
  const { value: streetAddress, setValue: setStreetAddress } = useField<string>(
    {
      path: `${path}.streetAddress`,
    },
  );
  const { value: apartment, setValue: setApartment } = useField<string>({
    path: `${path}.apartment`,
  });
  const { value: city, setValue: setCity } = useField<string>({
    path: `${path}.city`,
  });
  const { value: state, setValue: setState } = useField<string>({
    path: `${path}.state`,
  });
  const { value: postalCode, setValue: setPostalCode } = useField<string>({
    path: `${path}.postalCode`,
  });
  const { value: country, setValue: setCountry } = useField<string>({
    path: `${path}.country`,
  });
  const { setValue: setPlaceId } = useField<string>({
    path: `${path}.placeId`,
  });
  const { setValue: setFormattedAddress } = useField<string>({
    path: `${path}.formattedAddress`,
  });

  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(() => {
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng };
    }
    return null;
  });
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handlePlaceSelect = useCallback(
    (data: {
      lat: number;
      lng: number;
      streetAddress: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      placeId: string;
      formattedAddress: string;
    }) => {
      // Update all fields
      setLat(data.lat);
      setLng(data.lng);
      setStreetAddress(data.streetAddress);
      setCity(data.city);
      setState(data.state);
      setPostalCode(data.postalCode);
      setCountry(data.country);
      setPlaceId(data.placeId);
      setFormattedAddress(data.formattedAddress);

      // Update map center
      setMapCenter({ lat: data.lat, lng: data.lng });
    },
    [
      setLat,
      setLng,
      setStreetAddress,
      setCity,
      setState,
      setPostalCode,
      setCountry,
      setPlaceId,
      setFormattedAddress,
    ],
  );

  const handleMapMove = useCallback(
    (lat: number, lng: number) => {
      // Use Geocoding API to get address from coordinates
      const geocoder = new google.maps.Geocoder();

      void (async () => {
        try {
          const result = await geocoder.geocode({ location: { lat, lng } });

          const firstResult = result.results[0];
          if (firstResult !== undefined) {
            // Update coordinates
            setLat(lat);
            setLng(lng);

            // Process geocoding result using helper function
            processGeocodingResult(firstResult, {
              setFormattedAddress,
              setCity,
              setState,
              setPostalCode,
              setCountry,
              setStreetAddress,
            });
          }
        } catch {
          // Still update the coordinates even if geocoding fails
          setLat(lat);
          setLng(lng);
        }
      })();
    },
    [
      setLat,
      setLng,
      setStreetAddress,
      setCity,
      setState,
      setPostalCode,
      setCountry,
      setFormattedAddress,
    ],
  );

  if (!API_KEY) {
    return (
      <Collapsible
        className="address-picker-collapsible"
        header={fieldLabel}
        initCollapsed={false}
      >
        <div className="address-picker-error">
          <p>Google Maps API key is not configured.</p>
          <p>
            Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment
            variables.
          </p>
        </div>
      </Collapsible>
    );
  }

  return (
    <Collapsible
      className="address-picker-collapsible"
      header={fieldLabel}
      initCollapsed={false}
    >
      <APIProvider apiKey={API_KEY}>
        <div className="address-picker-container">
          {/* Street address field with autocomplete */}
          <AddressInput
            path={`${path}.streetAddress`}
            value={
              typeof streetAddress === 'string' && streetAddress.length > 0
                ? streetAddress
                : ''
            }
            onChange={setStreetAddress}
            onPlaceSelect={handlePlaceSelect}
            placeholder=""
            isGeocoding={isGeocoding}
            placesAutocomplete={placesAutocomplete}
          />

          {/* Map */}
          <div className="address-picker-map-section">
            <AddressPickerMap
              center={mapCenter}
              lat={typeof lat === 'number' ? lat : undefined}
              lng={typeof lng === 'number' ? lng : undefined}
              onMapMove={handleMapMove}
              onGeocodingChange={setIsGeocoding}
              mapConfig={mapConfig}
            />
          </div>

          {/* Other address fields */}
          <AddressForm
            path={path}
            lat={typeof lat === 'number' ? lat : undefined}
            lng={typeof lng === 'number' ? lng : undefined}
            apartment={typeof apartment === 'string' ? apartment : undefined}
            city={typeof city === 'string' ? city : undefined}
            state={typeof state === 'string' ? state : undefined}
            postalCode={typeof postalCode === 'string' ? postalCode : undefined}
            country={typeof country === 'string' ? country : undefined}
            setLat={setLat}
            setLng={setLng}
            setApartment={setApartment}
            setCity={setCity}
            setState={setState}
            setPostalCode={setPostalCode}
            setCountry={setCountry}
            showCoordinates={showCoordinates}
          />
        </div>
      </APIProvider>
    </Collapsible>
  );
};
