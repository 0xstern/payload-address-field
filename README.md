# Address Picker Field

A custom Payload CMS field component that provides an interactive address picker using Google Places and Google Maps.

## Features

- **Search Input**: Autocomplete search using Google Places API
- **Interactive Map**: Click on the map to select or adjust location
- **Automatic Geocoding**: Converts map clicks to addresses
- **Complete Address Form**: All address components in separate fields:
  - Latitude / Longitude
  - Street Address
  - Apartment/Unit/Suite
  - City
  - State/Province/Emirate
  - Postal Code
  - Country

## Setup

### 1. Environment Variables

Add your Google Maps API key to your `.env` file:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 2. Enable Required APIs

In the [Google Cloud Console](https://console.cloud.google.com/), enable the following APIs:

- [Maps JavaScript API](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com)
- [Places API](https://console.cloud.google.com/apis/library/places-backend.googleapis.com)
- [Geocoding API](https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com)

### 3. Get an API Key

Follow the [official documentation](https://developers.google.com/maps/documentation/javascript/get-api-key) to create and configure your API key.

## Usage

### Basic Usage

```typescript
import { addressField } from '@/fields/address';

export const MyCollection: CollectionConfig = {
  slug: 'my-collection',
  fields: [addressField()],
};
```

### Custom Configuration

```typescript
addressField({
  name: 'businessAddress',
  label: 'Business Address',
  required: true,
  showCoordinates: false, // Hide lat/lng fields (default: true)
  admin: {
    description: 'Enter the primary business location',
  },
});
```

### Options

| Option            | Type      | Default     | Description                                 |
| ----------------- | --------- | ----------- | ------------------------------------------- |
| `name`            | `string`  | `'address'` | Field name                                  |
| `label`           | `string`  | `'Address'` | Field label                                 |
| `required`        | `boolean` | `false`     | Make fields required                        |
| `showCoordinates` | `boolean` | `true`      | Show/hide latitude and longitude fields     |
| `admin`           | `object`  | `{}`        | Admin config (condition, description, etc.) |

## Field Structure

The address field stores data as a group with the following subfields:

```typescript
{
  search: string; // Last search query (internal)
  lat: number; // Latitude
  lng: number; // Longitude
  streetAddress: string; // Street number and name
  apartment: string; // Apartment, unit, suite, etc.
  city: string; // City
  state: string; // State, province, or emirate
  postalCode: string; // Postal/ZIP code
  country: string; // Country
  placeId: string; // Google Place ID (internal)
  formattedAddress: string; // Full formatted address (internal)
}
```

## Accessing Data

### In Hooks

```typescript
{
  hooks: {
    beforeChange: [
      ({ data }) => {
        const { address } = data
        console.log(`Property located at: ${address.city}, ${address.country}`)
        console.log(`Coordinates: ${address.lat}, ${address.lng}`)
        return data
      },
    ],
  },
}
```

### In Templates

```tsx
import type { Property } from '@/payload-types';

export function PropertyCard({ property }: { property: Property }) {
  const { address } = property;

  return (
    <div>
      <h2>{property.title}</h2>
      <address>
        {address.streetAddress}
        <br />
        {address.apartment && (
          <>
            {address.apartment}
            <br />
          </>
        )}
        {address.city}, {address.state} {address.postalCode}
        <br />
        {address.country}
      </address>
      <p>
        Location: {address.lat}, {address.lng}
      </p>
    </div>
  );
}
```

## Customization

### Styling

The component uses CSS variables from Payload's theme. You can override styles by creating a custom CSS file:

```css
.address-picker-container {
  /* Your custom styles */
}
```

### Default Map Center

Edit `AddressPickerMap.tsx` to change the default map center:

```typescript
const DEFAULT_CENTER = { lat: 49.2734, lng: -123.1037 };
```

## Reference Implementation

This component is based on the [Google Places UI Kit](https://github.com/googlemaps/js-samples/tree/main/dist/samples/places-ui-kit) and uses:

- `@vis.gl/react-google-maps` for React integration
- Google Maps Web Components for Places autocomplete
- Geocoding API for reverse geocoding (click to address)

## Troubleshooting

### API Key Not Working

1. Ensure the API key is set as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (note the `NEXT_PUBLIC_` prefix)
2. Verify all required APIs are enabled in Google Cloud Console
3. Check API key restrictions (HTTP referrers, API restrictions)
4. Restart your development server after adding the environment variable

### Map Not Displaying

1. Check browser console for errors
2. Verify your API key has access to Maps JavaScript API
3. Ensure you're using a valid Map ID (or remove the mapId prop)

### Autocomplete Not Working

1. Verify Places API is enabled
2. Check API key restrictions
3. Ensure you're using React 19+ (required for custom elements support)

## License

MIT
