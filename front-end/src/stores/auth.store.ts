import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../shared/types';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setRefreshToken: (refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  refreshTokens: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      // Actions
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setToken: (token: string) => {
        set({ token });
      },

      setRefreshToken: (refreshToken: string) => {
        set({ refreshToken });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({
          token: accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      login: (user: User, token: string, refreshToken?: string) => {
        set({
          user,
          token,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      logout: async () => {
        // Clear state
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });

        // Clear AsyncStorage to ensure complete logout
        try {
          await AsyncStorage.removeItem('auth-storage');
          // Clear any other app-specific storage if needed
          await AsyncStorage.multiRemove(['auth-storage', 'user-preferences', 'onboarding-data']);
        } catch (error) {
          console.error('Error clearing storage on logout:', error);
        }
      },

      refreshTokens: async () => {
        const state = get();
        if (!state.refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          set({ isLoading: true, error: null });

          // Import authService dynamically to avoid circular dependency
          const { authService } = await import('../services/authService');
          const response = await authService.refreshAccessToken(state.refreshToken);

          set({
            token: response.accessToken,
            refreshToken: response.refreshToken,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Token refresh failed:', error);
          // If refresh fails, logout the user
          get().logout();
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string) => {
        set({ error, isLoading: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        return () => {
          useAuthStore.setState({ _hasHydrated: true });
        };
      },
    }
  )
);
