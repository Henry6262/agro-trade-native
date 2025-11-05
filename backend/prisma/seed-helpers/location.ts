export type Coordinate = {
  latitude: number;
  longitude: number;
};

const CITY_COORDINATES: Record<string, Coordinate[]> = {
  sofia: [
    { latitude: 42.697708, longitude: 23.321868 },
    { latitude: 42.689882, longitude: 23.301171 },
    { latitude: 42.67342, longitude: 23.299833 },
  ],
  varna: [
    { latitude: 43.21405, longitude: 27.914734 },
    { latitude: 43.201297, longitude: 27.938801 },
    { latitude: 43.189247, longitude: 27.8805 },
  ],
  plovdiv: [
    { latitude: 42.135407, longitude: 24.74529 },
    { latitude: 42.155107, longitude: 24.712338 },
    { latitude: 42.118402, longitude: 24.716216 },
  ],
  ruse: [
    { latitude: 43.835571, longitude: 25.965655 },
    { latitude: 43.829528, longitude: 25.96588 },
    { latitude: 43.812028, longitude: 25.992246 },
  ],
  burgas: [
    { latitude: 42.504793, longitude: 27.462636 },
    { latitude: 42.482205, longitude: 27.46803 },
    { latitude: 42.508937, longitude: 27.497897 },
  ],
  'stara zagora': [
    { latitude: 42.425778, longitude: 25.634464 },
    { latitude: 42.419699, longitude: 25.625751 },
    { latitude: 42.435444, longitude: 25.60807 },
  ],
  vidin: [
    { latitude: 43.996155, longitude: 22.8679 },
    { latitude: 43.993116, longitude: 22.849265 },
    { latitude: 43.989801, longitude: 22.893885 },
  ],
  dobrich: [
    { latitude: 43.57259, longitude: 27.82728 },
    { latitude: 43.571194, longitude: 27.84099 },
    { latitude: 43.567722, longitude: 27.800003 },
  ],
  blagoevgrad: [
    { latitude: 42.020923, longitude: 23.09423 },
    { latitude: 42.010608, longitude: 23.08239 },
    { latitude: 42.029513, longitude: 23.096096 },
  ],
  montana: [
    { latitude: 43.4125, longitude: 23.2257 },
    { latitude: 43.401535, longitude: 23.219596 },
    { latitude: 43.421059, longitude: 23.239914 },
  ],
  pleven: [
    { latitude: 43.417042, longitude: 24.606111 },
    { latitude: 43.411761, longitude: 24.572723 },
    { latitude: 43.432268, longitude: 24.589482 },
  ],
  sliven: [
    { latitude: 42.6818, longitude: 26.3226 },
    { latitude: 42.705201, longitude: 26.319425 },
    { latitude: 42.673866, longitude: 26.326549 },
  ],
  'veliko tarnovo': [
    { latitude: 43.0757, longitude: 25.6172 },
    { latitude: 43.086564, longitude: 25.607036 },
    { latitude: 43.082561, longitude: 25.614422 },
  ],
  shumen: [
    { latitude: 43.271239, longitude: 26.936128 },
    { latitude: 43.273646, longitude: 26.925008 },
    { latitude: 43.256097, longitude: 26.934961 },
  ],
  yambol: [
    { latitude: 42.483, longitude: 26.501 },
    { latitude: 42.487097, longitude: 26.500448 },
    { latitude: 42.461417, longitude: 26.495505 },
  ],
  pernik: [
    { latitude: 42.607, longitude: 23.037 },
    { latitude: 42.599661, longitude: 23.020899 },
    { latitude: 42.597276, longitude: 23.045706 },
  ],
  pazardzhik: [
    { latitude: 42.1928, longitude: 24.3336 },
    { latitude: 42.205754, longitude: 24.342282 },
    { latitude: 42.190599, longitude: 24.335958 },
  ],
  kyustendil: [
    { latitude: 42.283, longitude: 22.691 },
    { latitude: 42.269865, longitude: 22.698956 },
    { latitude: 42.282863, longitude: 22.70392 },
  ],
};

export const listAvailableCities = (): string[] => Object.keys(CITY_COORDINATES);

export const getLocationForCity = (
  cityName: string,
  index: number,
): { coordinate: Coordinate } | null => {
  const coordinates = CITY_COORDINATES[cityName.toLowerCase()];
  if (!coordinates || coordinates.length === 0) {
    return null;
  }
  const coordinate = coordinates[index % coordinates.length];
  return { coordinate };
};

export const findAddressById = (_addressId: string) => undefined;
