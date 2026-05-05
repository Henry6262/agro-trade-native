import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardStackParamList } from './types';
import { UserDataProvider } from '@contexts/UserDataContext';

import DashboardMainScreen from '../screens/dashboard/DashboardMainScreen';
import CommandCenterScreen from '../screens/dashboard/admin/CommandCenterScreen';
import AgentNetworkScreen from '../screens/dashboard/admin/AgentNetworkScreen';
import OperationsScreen from '../screens/dashboard/admin/OperationsScreen';
import IntelligenceScreen from '../screens/dashboard/shared/IntelligenceScreen';
import ImpactScreen from '../screens/dashboard/shared/ImpactScreen';
import TraceabilityScreen from '../screens/dashboard/shared/TraceabilityScreen';
import SellerDashboardScreen from '../screens/dashboard/SellerDashboardScreen';
import BuyerDashboardScreen from '../screens/dashboard/BuyerDashboardScreen';
import TransporterDashboardScreen from '../screens/dashboard/TransporterDashboardScreen';
import TradeDetailScreen from '../screens/trade/TradeDetailScreen';
import UnifiedDashboardScreen from '../screens/dashboard/UnifiedDashboardScreen';
import TradeHubScreen from '../screens/trade/TradeHubScreen';

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
        <Stack.Screen name="Impact" component={ImpactScreen} />
        <Stack.Screen name="Traceability" component={TraceabilityScreen} />
        <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} />
        <Stack.Screen name="BuyerDashboard" component={BuyerDashboardScreen} />
        <Stack.Screen name="TransporterDashboard" component={TransporterDashboardScreen} />
        <Stack.Screen name="TradeDetail" component={TradeDetailScreen} />
        <Stack.Screen name="UnifiedDashboard" component={UnifiedDashboardScreen} />
        <Stack.Screen name="TradeHub" component={TradeHubScreen} />
      </Stack.Navigator>
    </UserDataProvider>
  );
}
