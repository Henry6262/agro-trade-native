import { useEffect, useRef } from 'react';

interface CircleProps {
  center: google.maps.LatLng | google.maps.LatLngLiteral | null;
  radius: number;
  map?: google.maps.Map;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  fillColor?: string;
  fillOpacity?: number;
}

export const Circle: React.FC<CircleProps> = ({
  center,
  radius,
  map,
  strokeColor = '#0c4cb3',
  strokeOpacity = 1,
  strokeWeight = 3,
  fillColor = '#3b82f6',
  fillOpacity = 0.3,
}) => {
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    // Remove existing circle if any
    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    // Create new circle if center is provided
    if (center) {
      circleRef.current = new google.maps.Circle({
        center,
        radius,
        map,
        strokeColor,
        strokeOpacity,
        strokeWeight,
        fillColor,
        fillOpacity,
        clickable: false, // Make it non-interactive
      });
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
    };
  }, [center, radius, map, strokeColor, strokeOpacity, strokeWeight, fillColor, fillOpacity]);

  return null;
};