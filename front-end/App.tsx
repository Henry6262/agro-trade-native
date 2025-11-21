import './src/styles/nativewind.setup';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RootNavigator from './src/navigation/RootNavigator';
import { AppBootstrap } from './src/navigation/AppBootstrap';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <AppBootstrap>{(appState) => <RootNavigator appState={appState} />}</AppBootstrap>
    </QueryClientProvider>
  );
}
