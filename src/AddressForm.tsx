'use client';

import { TextInput } from '@payloadcms/ui';
import React from 'react';

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
  return (
    <div className="address-form-fields">
      {showCoordinates && (
        <div className="address-picker-row">
          <TextInput
            path={`${path}.lat`}
            label="Latitude"
            value={lat?.toString() ?? ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value)) setLat(value);
            }}
            placeholder="0.0"
          />
          <TextInput
            path={`${path}.lng`}
            label="Longitude"
            value={lng?.toString() ?? ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value)) setLng(value);
            }}
            placeholder="0.0"
          />
        </div>
      )}

      <TextInput
        path={`${path}.apartment`}
        label="Apartment, Unit, Suite, etc."
        value={apartment ?? ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setApartment(e.target.value)
        }
        placeholder="Apt 4B"
      />

      <TextInput
        path={`${path}.city`}
        label="City"
        value={city ?? ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setCity(e.target.value)
        }
        placeholder="Victoria"
      />

      <TextInput
        path={`${path}.state`}
        label="State / Province"
        value={state ?? ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setState(e.target.value)
        }
        placeholder="BC"
      />

      <div className="address-picker-row">
        <TextInput
          path={`${path}.postalCode`}
          label="Postal Code"
          value={postalCode ?? ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPostalCode(e.target.value)
          }
          placeholder="V8W 3M6"
        />
        <TextInput
          path={`${path}.country`}
          label="Country"
          value={country ?? ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCountry(e.target.value)
          }
          placeholder="Canada"
        />
      </div>
    </div>
  );
};
