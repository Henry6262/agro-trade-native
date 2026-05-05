import React from 'react';
import { View, Text } from 'react-native';

interface TransporterDashboardSectionProps {
  activeTab?: string;
}

export function TransporterDashboardSection({ activeTab = 'offers' }: TransporterDashboardSectionProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 18 }}>Transporter Dashboard — {activeTab}</Text>
    </View>
  );
}

export default TransporterDashboardSection;
