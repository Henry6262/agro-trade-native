import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#111827',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen 
          name="user-selection" 
          options={{ 
            title: 'Choose Your Role',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="seller/onboarding" 
          options={{ 
            title: 'Seller Onboarding',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="buyer/onboarding" 
          options={{ 
            title: 'Buyer Onboarding',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="transport/onboarding" 
          options={{ 
            title: 'Transport Onboarding',
            headerShown: false 
          }} 
        />
      </Stack>
    </>
  );
}
