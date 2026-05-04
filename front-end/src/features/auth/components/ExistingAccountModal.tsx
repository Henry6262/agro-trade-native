import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { User, LogIn, UserPlus } from 'lucide-react-native';
import { GlassCard } from '../../../design-system/GlassCard';
import { GlassButton } from '../../../design-system/GlassButton';
import { GlassBadge } from '../../../design-system/GlassBadge';
import { COLORS } from '../../../design-system/tokens';

interface ExistingAccountModalProps {
  visible: boolean;
  userEmail: string;
  userName: string;
  userRole?: string | undefined;
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
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <GlassCard
          tier="strong"
          style={{ width: modalWidth, maxWidth: 480 }}
          animate={false}
          noPadding
        >
          {/* Header */}
          <View
            style={{
              padding: 24,
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: 'rgba(74,222,128,0.15)',
                borderWidth: 1.5,
                borderColor: 'rgba(74,222,128,0.4)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                shadowColor: '#4ADE80',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
              }}
            >
              <User size={36} color="#4ADE80" />
            </View>
            <Text style={{ color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' }}>
              Account Detected
            </Text>
          </View>

          {/* Body */}
          <View style={{ padding: 24 }}>
            <Text
              style={{
                color: COLORS.textSecondary,
                textAlign: 'center',
                marginBottom: 20,
                fontSize: 15,
              }}
            >
              We found an existing account for:
            </Text>

            {/* User Info Card */}
            <GlassCard tier="subtle" style={{ marginBottom: 20 }} animate={false}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 17 }}>
                {userName}
              </Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4 }}>
                {userEmail}
              </Text>
              {userRole && (
                <View style={{ marginTop: 12 }}>
                  <GlassBadge label={`${userRole} Account`} variant="success" />
                </View>
              )}
            </GlassCard>

            <Text
              style={{
                color: COLORS.textMuted,
                textAlign: 'center',
                marginBottom: 24,
                fontSize: 14,
              }}
            >
              Would you like to login to your existing profile or create a new one?
            </Text>

            {/* Action Buttons */}
            <View style={{ gap: 12 }}>
              <GlassButton
                label="Login to Existing Profile"
                onPress={onLoginExisting}
                variant="primary"
                fullWidth
                leftIcon={<LogIn size={18} color="#FFFFFF" />}
              />

              <GlassButton
                label="Create New Profile"
                onPress={onCreateNew}
                variant="ghost"
                fullWidth
                leftIcon={<UserPlus size={18} color={COLORS.textSecondary} />}
              />

              <TouchableOpacity onPress={onSwitchAccount} style={{ paddingVertical: 8 }}>
                <Text style={{ color: '#60A5FA', textAlign: 'center', fontSize: 14 }}>
                  Use a Different Google Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
};
