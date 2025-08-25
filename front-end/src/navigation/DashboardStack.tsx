import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { DashboardStackParamList } from './types';

import DashboardMainScreen from '../screens/dashboard/DashboardMainScreen';
import CommandCenterScreen from '../screens/dashboard/CommandCenterScreen';
import AgentNetworkScreen from '../screens/dashboard/AgentNetworkScreen';
import OperationsScreen from '../screens/dashboard/OperationsScreen';
import IntelligenceScreen from '../screens/dashboard/IntelligenceScreen';
import SellerDashboardScreen from '../screens/dashboard/SellerDashboardScreen';
import BuyerDashboardScreen from '../screens/dashboard/BuyerDashboardScreen';
import TransporterDashboardScreen from '../screens/dashboard/TransporterDashboardScreen';
import TransporterBiddingScreen from '../screens/dashboard/TransporterBiddingScreen';
import TransporterTransfersScreen from '../screens/dashboard/TransporterTransfersScreen';
import TransporterFleetScreen from '../screens/dashboard/TransporterFleetScreen';

const Stack = createStackNavigator<DashboardStackParamList>();

export default function DashboardStack() {
  return (
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
  );
}