/**
 * Type declarations for Google Maps Web Components
 *
 * These types provide TypeScript support for Google's native web components
 * used for Places autocomplete functionality.
 */

import type { CustomEvent } from 'react';

/**
 * Event emitted when a place is selected from the autocomplete
 */
export interface GmpSelectEvent {
  /** The selected place object from Google Maps */
  place: google.maps.places.Place;
}

/**
 * Props for the gmp-basic-place-autocomplete web component
 */
interface GmpBasicPlaceAutocompleteElement extends HTMLElement {
  /** Event handler for place selection */
  'ongmp-select'?: (event: GmpSelectEvent) => void;
  /** Event handler for errors */
  'ongmp-error'?: (event: CustomEvent) => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-basic-place-autocomplete': Partial<GmpBasicPlaceAutocompleteElement> &
        React.HTMLAttributes<HTMLElement>;
    }
  }
}

export {};
