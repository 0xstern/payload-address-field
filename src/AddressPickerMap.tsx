'use client';

import type { MapConfig } from './index';

import { Map, useMap } from '@vis.gl/react-google-maps';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface AddressPickerMapProps {
  center: { lat: number; lng: number } | null;
  lat?: number;
  lng?: number;
  onMapMove: (lat: number, lng: number) => void;
  onGeocodingChange?: (isGeocoding: boolean) => void;
  mapConfig?: MapConfig;
}

const DEFAULT_CENTER = { lat: 48.421, lng: -123.3692 };
const DEFAULT_ZOOM = 12;
const SELECTED_ZOOM = 16;
const GEOCODE_DEBOUNCE_MS = 500;

// Component that adds a centered pin using map controls
const CenterPinControl: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    if (map == null) {
      return;
    }

    const controlDiv = document.createElement('div');
    controlDiv.style.pointerEvents = 'none';

    controlDiv.innerHTML = `
      <svg width="43" height="55" viewBox="0 -10 24 37" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="24" r="2" fill="#da4b48" opacity="0" style="transition: opacity 0.2s ease-out;" />
        <path d="M12 2a8 8 0 0 1 8 8c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 8-8Zm0 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" fill="#da4b48" stroke="#da4b48" stroke-width="2" style="transition: transform 0.2s ease-out; transform-origin: 12px 24px;" />
      </svg>
    `;

    const pinPath = controlDiv.querySelector('path') as SVGPathElement | null;
    const dot = controlDiv.querySelector('circle') as SVGCircleElement | null;

    const handleDragStart = () => {
      if (pinPath != null) {
        pinPath.style.transform = 'translateY(-10px)';
      }
      if (dot != null) {
        dot.style.opacity = '1';
      }
    };

    const handleDragEnd = () => {
      if (pinPath != null) {
        pinPath.style.transform = 'translateY(0)';
      }
      if (dot != null) {
        dot.style.opacity = '0';
      }
    };

    const dragStartListener = map.addListener('dragstart', handleDragStart);
    const dragEndListener = map.addListener('dragend', handleDragEnd);

    // @ts-expect-error ControlPosition.CENTER is available but not documented
    // This enables us to render the pin in full-screen mode
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    map.controls[google.maps.ControlPosition.CENTER].push(controlDiv);

    return () => {
      if (dragStartListener != null) {
        dragStartListener.remove();
      }
      if (dragEndListener != null) {
        dragEndListener.remove();
      }

      // @ts-expect-error ControlPosition.CENTER is available but not documented
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const index = map.controls[google.maps.ControlPosition.CENTER]
        .getArray()
        .indexOf(controlDiv);
      if (index > -1) {
        // @ts-expect-error ControlPosition.CENTER is available but not documented
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        map.controls[google.maps.ControlPosition.CENTER].removeAt(index);
      }
    };
  }, [map]);

  return null;
};

/**
 * Helper to trigger geocoding after a delay
 */
function triggerGeocodingWithDelay(
  lat: number,
  lng: number,
  onMapMove: (lat: number, lng: number) => void,
  setIsGeocoding: (value: boolean) => void,
  onGeocodingChange: ((isGeocoding: boolean) => void) | undefined,
): void {
  onMapMove(lat, lng);
  setIsGeocoding(false);
  if (onGeocodingChange !== undefined) {
    onGeocodingChange(false);
  }
}

export const AddressPickerMap: React.FC<AddressPickerMapProps> = ({
  center,
  lat,
  lng,
  onMapMove,
  onGeocodingChange,
  mapConfig = {},
}) => {
  const map = useMap();
  const isUserDragging = useRef(false);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const setIsGeocoding = useState(false)[1];

  // Pan to center when it changes (from search)
  useEffect(() => {
    if (center != null && map != null && !isUserDragging.current) {
      map.panTo(center);
      map.setZoom(SELECTED_ZOOM);
    }
  }, [center, map]);

  // Handle map idle (after pan/zoom) - trigger geocoding
  const handleMapIdle = useCallback(() => {
    if (map == null || !isUserDragging.current) {
      return;
    }

    isUserDragging.current = false;

    const mapCenter = map.getCenter();
    if (mapCenter != null) {
      const lat = mapCenter.lat();
      const lng = mapCenter.lng();

      // Clear any pending geocode requests
      if (geocodeTimeoutRef.current !== null) {
        clearTimeout(geocodeTimeoutRef.current);
      }

      setIsGeocoding(true);
      if (onGeocodingChange !== undefined) {
        onGeocodingChange(true);
      }

      // Debounce geocoding to avoid too many requests
      geocodeTimeoutRef.current = setTimeout(() => {
        triggerGeocodingWithDelay(
          lat,
          lng,
          onMapMove,
          setIsGeocoding,
          onGeocodingChange,
        );
      }, GEOCODE_DEBOUNCE_MS);
    }
  }, [map, onMapMove, onGeocodingChange, setIsGeocoding]);

  // Handle drag start
  const handleDragStart = useCallback(() => {
    isUserDragging.current = true;
  }, []);

  // Set up map event listeners
  useEffect(() => {
    if (map == null) {
      return;
    }

    const idleListener = map.addListener('idle', handleMapIdle);
    const dragStartListener = map.addListener('dragstart', handleDragStart);

    return () => {
      if (idleListener != null) {
        idleListener.remove();
      }
      if (dragStartListener != null) {
        dragStartListener.remove();
      }
      if (geocodeTimeoutRef.current !== null) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, [map, handleMapIdle, handleDragStart]);

  // Compute default center with proper null checks
  let computedDefaultCenter = DEFAULT_CENTER;
  if (center != null) {
    computedDefaultCenter = center;
  } else if (lat != null && lng != null) {
    computedDefaultCenter = { lat, lng };
  }

  const {
    defaultCenter = computedDefaultCenter,
    defaultZoom = DEFAULT_ZOOM,
    height = '350px',
    gestureHandling = 'greedy',
    disableDefaultUI = false,
    ...restMapConfig
  } = mapConfig;

  return (
    <div className="address-picker-map-wrapper">
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        gestureHandling={gestureHandling}
        disableDefaultUI={disableDefaultUI}
        {...restMapConfig}
        style={{
          width: '100%',
          height: typeof height === 'number' ? `${height}px` : height,
          borderRadius: '4px',
        }}
      >
        <CenterPinControl />
      </Map>
    </div>
  );
};
