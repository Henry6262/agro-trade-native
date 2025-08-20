// Shim for react-native-reanimated on web platform
export default {
  createAnimatedComponent: (component: any) => component,
  View: () => null,
  Text: () => null,
  Image: () => null,
  ScrollView: () => null,
};

export const useSharedValue = (initialValue: any) => ({ value: initialValue });
export const useAnimatedStyle = () => ({});
export const withTiming = (value: any) => value;
export const withSpring = (value: any) => value;
export const withSequence = (...args: any[]) => args[0];
export const withDelay = (delay: number, value: any) => value;
export const interpolate = (value: any, inputRange: any[], outputRange: any[]) => outputRange[0];
export const Easing = {
  linear: () => {},
  ease: () => {},
  quad: () => {},
  cubic: () => {},
  poly: () => {},
  sin: () => {},
  circle: () => {},
  exp: () => {},
  elastic: () => {},
  back: () => {},
  bounce: () => {},
  bezier: () => {},
  in: () => {},
  out: () => {},
  inOut: () => {},
};
export const runOnJS = (fn: Function) => fn;
export const runOnUI = (fn: Function) => fn;