import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryProvider } from './src/providers/QueryProvider';
import { RootNavigator } from './src/navigation';
import './src/styles/global.css';

export default function App() {
  return (
    <QueryProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </QueryProvider>
  );
}
