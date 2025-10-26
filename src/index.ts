import type { Field, GroupField } from 'payload';
import type { MapProps } from '@vis.gl/react-google-maps';

import deepMerge from './utilities/deepMerge';

/**
 * Options for configuring Google Places Autocomplete behavior
 */
export type PlacesAutocompleteOptions = {
  /** Restrict results to specific countries (ISO 3166-1 Alpha-2 country codes) */
  componentRestrictions?: {
    country?: string | Array<string>;
  };
  /** Restrict results to specific place types */
  types?: Array<string>;
  /** Bias results to a specific area */
  locationBias?: google.maps.places.LocationBias;
  /** Restrict results to a specific area */
  locationRestriction?: google.maps.places.LocationRestriction;
};

/**
 * Map configuration extends all MapProps from @vis.gl/react-google-maps
 * Plus adds convenient height option
 */
export type MapConfig = Omit<MapProps, 'style' | 'className' | 'children'> & {
  /** Map height (convenience prop, converted to style) */
  height?: string | number;
};

type AddressFieldType = (options?: {
  name?: string;
  label?: string;
  required?: boolean;
  /** Show/hide latitude and longitude fields */
  showCoordinates?: boolean;
  /** Configure Google Places Autocomplete behavior */
  placesAutocomplete?: PlacesAutocompleteOptions;
  /** Configure map appearance and behavior - extends all MapProps */
  mapConfig?: MapConfig;
  /** Override any field properties */
  overrides?: Partial<GroupField>;
}) => Field;

export const addressField: AddressFieldType = ({
  name = 'address',
  label = 'Address',
  required = false,
  showCoordinates = false,
  placesAutocomplete = {},
  mapConfig = {},
  overrides = {},
} = {}) => {
  const generatedAddressField: Field = {
    name,
    type: 'group',
    label,
    admin: {
      components: {
        Field: {
          path: '@/fields/address/Component#AddressPickerField',
          clientProps: {
            showCoordinates,
            placesAutocomplete,
            mapConfig,
          },
        },
      },
    },
    fields: [
      {
        name: 'search',
        type: 'text',
        admin: {
          hidden: true,
        },
      },
      {
        name: 'lat',
        type: 'number',
        required,
        admin: {
          hidden: true,
        },
      },
      {
        name: 'lng',
        type: 'number',
        required,
        admin: {
          hidden: true,
        },
      },
      {
        name: 'streetAddress',
        type: 'text',
        label: 'Street Address',
        required,
        admin: {
          hidden: true,
        },
      },
      {
        name: 'apartment',
        type: 'text',
        label: 'Apartment, Unit, Suite, etc.',
        admin: {
          hidden: true,
        },
      },
      {
        name: 'city',
        type: 'text',
        label: 'City',
        required,
        admin: {
          hidden: true,
        },
      },
      {
        name: 'state',
        type: 'text',
        label: 'State / Province / Emirate',
        required,
        admin: {
          hidden: true,
        },
      },
      {
        name: 'postalCode',
        type: 'text',
        label: 'Postal Code',
        admin: {
          hidden: true,
        },
      },
      {
        name: 'country',
        type: 'text',
        label: 'Country',
        required,
        admin: {
          hidden: true,
        },
      },
      {
        name: 'placeId',
        type: 'text',
        admin: {
          hidden: true,
        },
      },
      {
        name: 'formattedAddress',
        type: 'text',
        admin: {
          hidden: true,
        },
      },
    ],
  };

  return deepMerge(generatedAddressField, overrides);
};

// Re-export types for convenience
export type { MapProps } from '@vis.gl/react-google-maps';
