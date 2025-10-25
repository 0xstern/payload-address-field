'use client';

import type { GroupFieldClientComponent } from 'payload';

import { useField } from '@payloadcms/ui';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useCallback, useState } from 'react';

import { AddressForm } from './AddressForm';
import { AddressInput } from './AddressInput';
import { AddressPickerMap } from './AddressPickerMap';

import './styles.css';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const AddressPickerField: GroupFieldClientComponent = ({
  path,
  showCoordinates = true,
}: {
  path: string;
  showCoordinates?: boolean;
}) => {
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
    async (lat: number, lng: number) => {
      // Use Geocoding API to get address from coordinates
      const geocoder = new google.maps.Geocoder();

      try {
        const result = await geocoder.geocode({ location: { lat, lng } });

        if (result.results && result.results[0]) {
          const place = result.results[0];

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
        }
      } catch (error) {
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
      <div className="address-picker-error">
        <p>Google Maps API key is not configured.</p>
        <p>
          Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment
          variables.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <div className="address-picker-container">
        {/* Street address field with autocomplete */}
        <AddressInput
          path={`${path}.streetAddress`}
          value={streetAddress || ''}
          onChange={setStreetAddress}
          onPlaceSelect={handlePlaceSelect}
          placeholder="Street address"
          isGeocoding={isGeocoding}
        />

        {/* Map */}
        <div className="address-picker-map-section">
          <AddressPickerMap
            center={mapCenter}
            lat={lat}
            lng={lng}
            onMapMove={handleMapMove}
            onGeocodingChange={setIsGeocoding}
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
  );
};
