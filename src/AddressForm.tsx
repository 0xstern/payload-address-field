'use client';

import { TextInput } from '@payloadcms/ui';
import React, { useCallback } from 'react';

interface AddressFormProps {
  path: string;
  lat?: number;
  lng?: number;
  apartment?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  setLat: (value: number) => void;
  setLng: (value: number) => void;
  setApartment: (value: string) => void;
  setCity: (value: string) => void;
  setState: (value: string) => void;
  setPostalCode: (value: string) => void;
  setCountry: (value: string) => void;
  showCoordinates?: boolean;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  path,
  lat,
  lng,
  apartment,
  city,
  state,
  postalCode,
  country,
  setLat,
  setLng,
  setApartment,
  setCity,
  setState,
  setPostalCode,
  setCountry,
  showCoordinates = true,
}) => {
  const handleLatChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.currentTarget.value);
      if (!Number.isNaN(value)) {
        setLat(value);
      }
    },
    [setLat],
  );

  const handleLngChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.currentTarget.value);
      if (!Number.isNaN(value)) {
        setLng(value);
      }
    },
    [setLng],
  );

  const handleApartmentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setApartment(e.currentTarget.value);
    },
    [setApartment],
  );

  const handleCityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCity(e.currentTarget.value);
    },
    [setCity],
  );

  const handleStateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setState(e.currentTarget.value);
    },
    [setState],
  );

  const handlePostalCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPostalCode(e.currentTarget.value);
    },
    [setPostalCode],
  );

  const handleCountryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCountry(e.currentTarget.value);
    },
    [setCountry],
  );

  return (
    <div className="address-form-fields">
      {showCoordinates && (
        <div className="address-picker-row">
          <TextInput
            path={`${path}.lat`}
            label="Latitude"
            value={lat?.toString() ?? ''}
            onChange={handleLatChange}
            placeholder="0.0"
          />
          <TextInput
            path={`${path}.lng`}
            label="Longitude"
            value={lng?.toString() ?? ''}
            onChange={handleLngChange}
            placeholder="0.0"
          />
        </div>
      )}

      <TextInput
        path={`${path}.apartment`}
        label="Apartment, Unit, Suite, etc."
        value={apartment ?? ''}
        onChange={handleApartmentChange}
        placeholder="Apt 4B"
      />

      <TextInput
        path={`${path}.city`}
        label="City"
        value={city ?? ''}
        onChange={handleCityChange}
        placeholder="Victoria"
      />

      <TextInput
        path={`${path}.state`}
        label="State / Province"
        value={state ?? ''}
        onChange={handleStateChange}
        placeholder="BC"
      />

      <div className="address-picker-row">
        <TextInput
          path={`${path}.postalCode`}
          label="Postal Code"
          value={postalCode ?? ''}
          onChange={handlePostalCodeChange}
          placeholder="V8W 3M6"
        />
        <TextInput
          path={`${path}.country`}
          label="Country"
          value={country ?? ''}
          onChange={handleCountryChange}
          placeholder="Canada"
        />
      </div>
    </div>
  );
};
