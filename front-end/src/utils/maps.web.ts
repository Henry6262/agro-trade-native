import React from 'react';
import { View } from 'react-native';

type MapShimProps = {
  children?: React.ReactNode;
  style?: React.ComponentProps<typeof View>['style'];
};

type MapShimHandle = {
  animateToRegion: () => void;
  fitToCoordinates: () => void;
};

const MapViewShim = React.forwardRef<MapShimHandle, MapShimProps>(({ children, style }, ref) => {
  React.useImperativeHandle(ref, () => ({
    animateToRegion: () => undefined,
    fitToCoordinates: () => undefined,
  }));

  return React.createElement(View, { style }, children);
});

MapViewShim.displayName = 'MapViewShim';

export const Marker = ({ children }: Pick<MapShimProps, 'children'>) =>
  React.createElement(View, null, children);

export const Circle = () => null;
export const Polyline = () => null;
export const Callout = ({ children }: Pick<MapShimProps, 'children'>) =>
  React.createElement(View, null, children);

export const PROVIDER_GOOGLE = 'google';

export default MapViewShim;
