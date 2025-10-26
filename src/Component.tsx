'use client';

import type { GroupFieldClientComponent } from 'payload';

import type { MapConfig, PlacesAutocompleteOptions } from './index';

import { Collapsible, useField } from '@payloadcms/ui';
import { APIProvider } from '@vis.gl/react-google-maps';
import React, { useCallback, useState } from 'react';

import { AddressForm } from './AddressForm';
import { AddressInput } from './AddressInput';
import { AddressPickerMap } from './AddressPickerMap';

import './styles.css';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

// Log API key status (masked for security)
if (API_KEY) {
  console.log(
    '[AddressPicker] API Key loaded:',
    API_KEY.substring(0, 8) + '...' + API_KEY.substring(API_KEY.length - 4),
  );
} else {
  console.error('[AddressPicker] No API key found in environment variables');
}

export const AddressPickerField: GroupFieldClientComponent = ({
  field,
  path,
  showCoordinates = true,
  placesAutocomplete = {},
  mapConfig = {},
}: {
  field?: any;
  path: string;
  showCoordinates?: boolean;
  placesAutocomplete?: PlacesAutocompleteOptions;
  mapConfig?: MapConfig;
}) => {
  console.log('[AddressPicker] Field initialized with path:', path);
  console.log('[AddressPicker] Show coordinates:', showCoordinates);
  console.log(
    '[AddressPicker] Places autocomplete config:',
    placesAutocomplete,
  );
  console.log('[AddressPicker] Map config:', mapConfig);

  // Extract label from field config
  const fieldLabel = field?.label || 'Address';

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
  } | null>(lat && lng ? { lat, lng } : null);
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
      console.log('[AddressPicker] Place data received:', data);

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

      console.log('[AddressPicker] All fields updated from place selection');
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
    async (lat: number, lng: number) => {
      console.log('[AddressPicker] Map moved to:', lat, lng);

      // Use Geocoding API to get address from coordinates
      const geocoder = new google.maps.Geocoder();

      try {
        console.log('[AddressPicker] Starting reverse geocoding...');
        const result = await geocoder.geocode({ location: { lat, lng } });
        console.log(
          '[AddressPicker] Geocoding successful:',
          result.results.length,
          'results',
        );

        if (result.results[0]) {
          const place = result.results[0];
          console.log(
            '[AddressPicker] Full geocoding result:',
            JSON.stringify(
              {
                formatted_address: place.formatted_address,
                address_components: place.address_components,
                types: place.types,
                place_id: place.place_id,
              },
              null,
              2,
            ),
          );

          // Update coordinates
          setLat(lat);
          setLng(lng);
          setFormattedAddress(place.formatted_address);

          // Parse address components
          let city = '';
          let state = '';
          let postalCode = '';
          let country = '';

          place.address_components.forEach((component) => {
            const types = component.types;

            if (types.includes('locality')) {
              city = component.long_name;
              setCity(city);
            } else if (types.includes('administrative_area_level_1')) {
              state = component.long_name;
              setState(state);
            } else if (types.includes('postal_code')) {
              postalCode = component.long_name;
              setPostalCode(postalCode);
            } else if (types.includes('country')) {
              country = component.long_name;
              setCountry(country);
            }
          });

          // Build street address by removing city/state/country from formatted_address
          let street = place.formatted_address || '';

          // Remove each component from the end
          const partsToRemove = [country, state, city, postalCode].filter(
            Boolean,
          );
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

          if (street) {
            setStreetAddress(street);
          }

          console.log('[AddressPicker] Address updated from map movement');
        }
      } catch (error) {
        console.error('[AddressPicker] Error geocoding location:', error);
        console.error('[AddressPicker] Geocoding error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
        // Still update the coordinates even if geocoding fails
        setLat(lat);
        setLng(lng);
      }
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
            value={streetAddress || ''}
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
              lat={lat}
              lng={lng}
              onMapMove={handleMapMove}
              onGeocodingChange={setIsGeocoding}
              mapConfig={mapConfig}
            />
          </div>

          {/* Other address fields */}
          <AddressForm
            path={path}
            lat={lat}
            lng={lng}
            apartment={apartment}
            city={city}
            state={state}
            postalCode={postalCode}
            country={country}
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
