'use client';

import { useMapsLibrary } from '@vis.gl/react-google-maps';
import React, { useCallback, useEffect, useRef } from 'react';

interface AddressSearchProps {
  onPlaceSelect: (place: google.maps.places.Place | null) => void;
}

interface GmpSelectEvent {
  place: google.maps.places.Place;
}

export const AddressSearch: React.FC<AddressSearchProps> = ({
  onPlaceSelect,
}) => {
  const autocompleteRef = useRef<HTMLElement>(null);

  // Load the places library to ensure the web component is available
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    if (placesLib) {
      console.log('[AddressSearch] Places library loaded successfully');
    } else {
      console.log('[AddressSearch] Waiting for Places library...');
    }
  }, [placesLib]);

  useEffect(() => {
    // Add error listener to the autocomplete element
    const element = autocompleteRef.current;
    if (element) {
      element.addEventListener('gmp-error', (event: Event) => {
        const customEvent = event as CustomEvent;
        console.error('[AddressSearch] Error details:', {
          type: event.type,
          detail: customEvent.detail,
          target: event.target,
        });
      });
    }
  }, []);

  const handleGmpSelect = useCallback(
    (event: GmpSelectEvent) => {
      console.log(
        '[AddressSearch] Place selected from autocomplete:',
        event.place?.id,
      );
      onPlaceSelect(event.place);
    },
    [onPlaceSelect],
  );

  const handleError = useCallback((event: CustomEvent) => {
    console.error('[AddressSearch] Autocomplete error:', event);
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

// Type declarations for Google Maps web components
interface GmpBasicPlaceAutocomplete extends React.HTMLAttributes<HTMLElement> {
  'ongmp-select': (event: GmpSelectEvent) => void;
  'ongmp-error': (event: CustomEvent) => void;
  ref?: React.Ref<HTMLElement>;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'gmp-basic-place-autocomplete': React.DetailedHTMLProps<
        GmpBasicPlaceAutocomplete,
        HTMLElement
      >;
    }
  }
}
