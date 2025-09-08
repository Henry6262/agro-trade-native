import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuthStore } from '../../stores/auth.store';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * AuthGuard component that handles authentication-based navigation
 * - If requireAuth is true and user is not authenticated, redirects to RoleSelection
 * - If requireAuth is false and user is authenticated, redirects to Dashboard
 * - Can be used to protect routes or redirect authenticated users away from auth screens
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  redirectTo,
  requireAuth = false,
}) => {
  const navigation = useNavigation();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return; // Wait for auth state to be determined

    if (requireAuth && !isAuthenticated) {
      // User needs to be authenticated but isn't - redirect to auth
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'RoleSelection' as never }],
        })
      );
    } else if (!requireAuth && isAuthenticated) {
      // User is authenticated but on an auth screen - redirect to main app
      const targetRoute = redirectTo || 'Main';
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: targetRoute as never }],
        })
      );
    }
  }, [isAuthenticated, isLoading, requireAuth, navigation, redirectTo]);

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  // If auth requirements are met, render children
  if (requireAuth && isAuthenticated) {
    return <>{children}</>;
  }
  
  if (!requireAuth && !isAuthenticated) {
    return <>{children}</>;
  }

  // Otherwise show loading (will redirect soon)
  return (
    <View className="flex-1 bg-gray-900 justify-center items-center">
      <ActivityIndicator size="large" color="#10B981" />
    </View>
  );
};