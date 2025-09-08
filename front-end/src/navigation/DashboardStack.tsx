import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardStackParamList } from './types';
import { UserDataProvider } from '../contexts/UserDataContext';

import DashboardMainScreen from '../features/dashboard/screens/DashboardMainScreen';
import CommandCenterScreen from '../features/dashboard/screens/admin/CommandCenterScreen';
import AgentNetworkScreen from '../features/dashboard/screens/admin/AgentNetworkScreen';
import OperationsScreen from '../features/dashboard/screens/admin/OperationsScreen';
import IntelligenceScreen from '../features/dashboard/screens/shared/IntelligenceScreen';
import SellerDashboardScreen from '../features/dashboard/screens/seller/SellerDashboardScreen';
import BuyerDashboardScreen from '../features/dashboard/screens/buyer/BuyerDashboardScreen';
import TransporterDashboardScreen from '../features/dashboard/screens/transporter/TransporterDashboardScreen';
import TransporterBiddingScreen from '../features/dashboard/screens/transporter/TransporterBiddingScreen';
import TransporterTransfersScreen from '../features/dashboard/screens/transporter/TransporterTransfersScreen';
import TransporterFleetScreen from '../features/dashboard/screens/transporter/TransporterFleetScreen';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardStack() {
  return (
    <UserDataProvider>
      <Stack.Navigator
        initialRouteName="DashboardMain"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="DashboardMain" component={DashboardMainScreen} />
        <Stack.Screen name="CommandCenter" component={CommandCenterScreen} />
        <Stack.Screen name="AgentNetwork" component={AgentNetworkScreen} />
        <Stack.Screen name="Operations" component={OperationsScreen} />
        <Stack.Screen name="Intelligence" component={IntelligenceScreen} />
        <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} />
        <Stack.Screen name="BuyerDashboard" component={BuyerDashboardScreen} />
        <Stack.Screen name="TransporterDashboard" component={TransporterDashboardScreen} />
        <Stack.Screen name="TransporterBidding" component={TransporterBiddingScreen} />
        <Stack.Screen name="TransporterTransfers" component={TransporterTransfersScreen} />
        <Stack.Screen name="TransporterFleet" component={TransporterFleetScreen} />
      </Stack.Navigator>
    </UserDataProvider>
  );
}