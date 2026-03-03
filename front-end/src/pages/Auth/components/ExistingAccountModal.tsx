import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, LogIn, UserPlus } from 'lucide-react-native';
interface ExistingAccountModalProps {
  visible: boolean;
  userEmail: string;
  userName: string;
  userRole?: string;
  onLoginExisting: () => void;
  onCreateNew: () => void;
  onSwitchAccount: () => void;
}

export const ExistingAccountModal: React.FC<ExistingAccountModalProps> = ({
  visible,
  userEmail,
  userName,
  userRole,
  onLoginExisting,
  onCreateNew,
  onSwitchAccount,
}) => {
  const { width } = Dimensions.get('window');
  const isWeb = Platform.OS === 'web';
  const modalWidth = isWeb ? Math.min(480, width * 0.9) : width * 0.9;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-white/60 justify-center items-center p-4">
        <View
          className="bg-gray-50 rounded-2xl overflow-hidden"
          style={{ width: modalWidth, maxWidth: 480 }}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-4"
          >
            <View className="items-center">
              <View className="bg-white/20 rounded-full p-3 mb-3">
                <User size={32} color="white" />
              </View>
              <Text className="text-gray-900 text-xl font-bold">Account Detected</Text>
            </View>
          </LinearGradient>

          <View className="p-6">
            <Text className="text-gray-600 text-center mb-6">
              We found an existing account for:
            </Text>

            <View className="bg-white rounded-lg p-4 mb-6">
              <Text className="text-gray-900 font-semibold text-lg">{userName}</Text>
              <Text className="text-gray-400 text-sm mt-1">{userEmail}</Text>
              {userRole && (
                <View className="mt-3 flex-row">
                  <View className="bg-emerald-500/20 px-3 py-1 rounded-full">
                    <Text className="text-emerald-400 text-xs font-medium capitalize">
                      {userRole} Account
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <Text className="text-gray-400 text-center mb-6">
              Would you like to login to your existing profile or create a new one?
            </Text>

            {/* Action Buttons */}
            <View className="space-y-3">
              <TouchableOpacity
                onPress={onLoginExisting}
                className="bg-emerald-500 rounded-xl py-4 px-6 flex-row justify-center items-center"
              >
                <LogIn size={20} color="white" />
                <Text className="text-white font-bold text-base ml-2">
                  Login to Existing Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onCreateNew}
                className="bg-white border border-gray-200 rounded-xl py-4 px-6 flex-row justify-center items-center"
              >
                <UserPlus size={20} color="#9CA3AF" />
                <Text className="text-gray-600 font-medium text-base ml-2">Create New Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onSwitchAccount} className="py-3">
                <Text className="text-blue-400 text-center text-sm">
                  Use a Different Google Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
