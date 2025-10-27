'use client';

import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useCallback, useEffect, useRef } from 'react';

interface GmpSelectEvent {
  place: google.maps.places.Place;
}

/**
 * Augments the React JSX namespace to add type definitions for the
 * Places UI Kit  web components. This provides
 * type-checking and autocompletion for their props, including custom
 * events, within JSX.
 */
interface GmpBasicPlaceAutocomplete
  // @ts-expect-error BasicPlaceAutocompleteElement not in official types yet
  extends React.HTMLAttributes<google.maps.places.BasicPlaceAutocompleteElement> {
  'ongmp-select': (event: GmpSelectEvent) => void;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-basic-place-autocomplete': React.DetailedHTMLProps<
        GmpBasicPlaceAutocomplete,
        // @ts-expect-error BasicPlaceAutocompleteElement not in official types yet
        google.maps.places.BasicPlaceAutocompleteElement
      >;
    }
  }
}

interface AddressSearchProps {
  onPlaceSelect: (place: google.maps.places.Place | null) => void;
}

export const AddressSearch: React.FC<AddressSearchProps> = ({
  onPlaceSelect,
}) => {
  const autocompleteRef = useRef<HTMLElement>(null);

  // Load the places library to ensure the web component is available
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    // Ensure places library is loaded
    if (placesLib == null) {
      return;
    }
  }, [placesLib]);

  useEffect(() => {
    // Add error listener to the autocomplete element
    const element = autocompleteRef.current;
    if (element != null) {
      const errorHandler = (event: Event): void => {
        const customEvent = event as CustomEvent<unknown>;
        // Error handling - could be logged to telemetry service
        void customEvent;
      };

      element.addEventListener('gmp-error', errorHandler);

      return () => {
        element.removeEventListener('gmp-error', errorHandler);
      };
    }
  }, []);

  const handleGmpSelect = useCallback(
    (event: GmpSelectEvent) => {
      onPlaceSelect(event.place);
    },
    [onPlaceSelect],
  );

  const handleError = useCallback((event: CustomEvent) => {
    // Error handling - could be logged to telemetry service
    void event;
  }, []);

  return (
    <div className="address-search-container">
      <gmp-basic-place-autocomplete
        ref={autocompleteRef}
        ongmp-select={handleGmpSelect}
        ongmp-error={handleError}
        aria-label="Search for an address"
      />
    </div>
  );
};
