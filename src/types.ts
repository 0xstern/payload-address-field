export interface AddressData {
  search?: string;
  lat?: number;
  lng?: number;
  streetAddress?: string;
  apartment?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  placeId?: string;
  formattedAddress?: string;
}

export interface AddressComponentType {
  long_name: string;
  short_name: string;
  types: Array<string>;
}
