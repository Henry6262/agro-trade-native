import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { LoginForm, RegisterForm } from '../types';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const { login: setAuthState, logout: clearAuthState } = useAuthStore();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuthState(data.user, data.token);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      setAuthState(data.user, data.token);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearAuthState();
      queryClient.clear();
    },
    onError: () => {
      // Even if logout fails on server, clear local state
      clearAuthState();
      queryClient.clear();
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: authService.forgotPassword,
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authService.resetPassword(token, newPassword),
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (updatedUser) => {
      useAuthStore.getState().setUser(updatedUser);
      queryClient.setQueryData(['user'], updatedUser);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: {
      currentPassword: string;
      newPassword: string;
    }) => authService.changePassword(currentPassword, newPassword),
  });

  // Get user profile query
  const useUserProfile = () => {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
      queryKey: ['user'],
      queryFn: authService.getProfile,
      enabled: isAuthenticated,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  return {
    // Mutations
    loginMutation,
    registerMutation,
    logoutMutation,
    forgotPassword: forgotPasswordMutation,
    resetPassword: resetPasswordMutation,
    updateProfile: updateProfileMutation,
    changePassword: changePasswordMutation,
    
    // Hooks
    useUserProfile,
    
    // State
    ...useAuthStore(),
  };
};