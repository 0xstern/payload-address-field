'use client';

import { Map, useMap } from '@vis.gl/react-google-maps';
import React, { useCallback, useEffect, useRef } from 'react';

interface AddressPickerMapProps {
  center: { lat: number; lng: number } | null;
  lat?: number;
  lng?: number;
  onMapMove: (lat: number, lng: number) => void;
  onGeocodingChange?: (isGeocoding: boolean) => void;
}

const DEFAULT_CENTER = { lat: 49.2734, lng: -123.1037 };
const DEFAULT_ZOOM = 12;
const SELECTED_ZOOM = 16;

export const AddressPickerMap: React.FC<AddressPickerMapProps> = ({
  center,
  lat,
  lng,
  onMapMove,
  onGeocodingChange,
}) => {
  const map = useMap();
  const isUserDragging = useRef(false);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout>(null);
  const [isGeocoding, setIsGeocoding] = React.useState(false);

  // Pan to center when it changes (from search)
  useEffect(() => {
    if (center && map && !isUserDragging.current) {
      map.panTo(center);
      map.setZoom(SELECTED_ZOOM);
    }
  }, [center, map]);

  // Handle map idle (after pan/zoom)
  const handleMapIdle = useCallback(() => {
    if (!map || !isUserDragging.current) return;

    isUserDragging.current = false;

    // Clear any pending geocode requests
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    setIsGeocoding(true);
    onGeocodingChange?.(true);

    // Debounce geocoding to avoid too many requests
    geocodeTimeoutRef.current = setTimeout(async () => {
      const mapCenter = map.getCenter();
      if (mapCenter) {
        const lat = mapCenter.lat();
        const lng = mapCenter.lng();
        onMapMove(lat, lng);
        setIsGeocoding(false);
        onGeocodingChange?.(false);
      }
    }, 500); // Wait 500ms after user stops dragging
  }, [map, onMapMove, onGeocodingChange]);

  // Handle drag start
  const handleDragStart = useCallback(() => {
    isUserDragging.current = true;
  }, []);

  // Set up map event listeners
  useEffect(() => {
    if (!map) return;

    const idleListener = map.addListener('idle', handleMapIdle);
    const dragStartListener = map.addListener('dragstart', handleDragStart);

    return () => {
      if (idleListener) idleListener.remove();
      if (dragStartListener) dragStartListener.remove();
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, [map, handleMapIdle, handleDragStart]);

  return (
    <div className="address-picker-map-wrapper">
      <Map
        defaultCenter={center || (lat && lng ? { lat, lng } : DEFAULT_CENTER)}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapId="address-picker-map"
        style={{
          width: '100%',
          height: '350px',
          borderRadius: '4px',
        }}
      />
      {/* Fixed center marker using CSS */}
      <div
        className={`address-picker-center-marker ${isGeocoding ? 'is-geocoding' : ''}`}
      >
        <svg
          viewBox="0 0 24 24"
          width="36"
          height="36"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2a8 8 0 0 1 8 8c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 8-8Zm0 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
            strokeWidth="2"
            fill="var(--theme-error-500)"
            stroke="var(--theme-error-500)"
            fillRule="evenodd"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};
