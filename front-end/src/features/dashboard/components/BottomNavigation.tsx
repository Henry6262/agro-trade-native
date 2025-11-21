import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface NavigationItem {
  id: string;
  icon: LucideIcon;
  label: string;
}

interface BottomNavigationProps {
  items: NavigationItem[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeSection,
  onSectionChange,
}) => {
  // Limit to 5 items for bottom nav (common mobile pattern)
  const displayItems = items.slice(0, 5);

  return (
    <SafeAreaView className="bg-neutral-900 border-t border-neutral-700">
      <View className="flex-row justify-around items-center h-20 px-2">
        {displayItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSectionChange(item.id)}
              className="flex-1 items-center justify-center py-3 h-full"
              activeOpacity={0.7}
            >
              <Icon size={26} color={isActive ? '#10B981' : '#6B7280'} />
              <Text
                className={`text-xs mt-1.5 font-medium ${
                  isActive ? 'text-green-500' : 'text-gray-500'
                }`}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};
