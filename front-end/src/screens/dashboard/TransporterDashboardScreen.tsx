import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { TransporterBiddingTab } from './components/TransporterBiddingTab';
import { TransporterTransfersTab } from './components/TransporterTransfersTab';
import { TransporterFleetTab } from './components/TransporterFleetTab';

interface TransporterDashboardScreenProps {
  activeTab?: string;
}

export default function TransporterDashboardScreen({ activeTab = 'bidding' }: TransporterDashboardScreenProps = {}) {
  const [currentTab, setCurrentTab] = useState(activeTab);

  const renderContent = () => {
    switch (currentTab) {
      case 'bidding':
        return <TransporterBiddingTab />;
      case 'transfers':
        return <TransporterTransfersTab />;
      case 'fleet':
        return <TransporterFleetTab />;
      default:
        return <TransporterBiddingTab />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header with Tabs */}
        <View className="px-4 pt-4 pb-2 border-b border-neutral-800">
          <Text className="text-2xl font-bold text-white mb-1">Transporter Dashboard</Text>
          <Text className="text-neutral-400 text-sm mb-4">Manage your transport operations</Text>
          
          {/* Tab Navigation */}
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setCurrentTab('bidding')}
              className={`flex-1 py-3 ${currentTab === 'bidding' ? 'border-b-2 border-green-500' : ''}`}
            >
              <Text className={`text-center font-medium ${currentTab === 'bidding' ? 'text-green-500' : 'text-neutral-400'}`}>
                Bidding
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCurrentTab('transfers')}
              className={`flex-1 py-3 ${currentTab === 'transfers' ? 'border-b-2 border-green-500' : ''}`}
            >
              <Text className={`text-center font-medium ${currentTab === 'transfers' ? 'text-green-500' : 'text-neutral-400'}`}>
                Transfers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCurrentTab('fleet')}
              className={`flex-1 py-3 ${currentTab === 'fleet' ? 'border-b-2 border-green-500' : ''}`}
            >
              <Text className={`text-center font-medium ${currentTab === 'fleet' ? 'text-green-500' : 'text-neutral-400'}`}>
                Fleet
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Content */}
        <View className="flex-1">
          {renderContent()}
        </View>
      </View>
    </SafeAreaView>
  );
}