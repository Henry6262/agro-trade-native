import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type NavArgs = [screen: 'OrderDetail', params: { orderId: string }] | [screen: 'Main'];

let _pending: NavArgs | null = null;

export function queueNavigate(...args: NavArgs): void {
  if (navigationRef.isReady()) {
    // @ts-expect-error — overloads don't narrow cleanly here
    navigationRef.navigate(...args);
  } else {
    _pending = args;
  }
}

export function flushPendingNavigation(): void {
  if (_pending && navigationRef.isReady()) {
    // @ts-expect-error — overloads don't narrow cleanly here
    navigationRef.navigate(..._pending);
    _pending = null;
  }
}
