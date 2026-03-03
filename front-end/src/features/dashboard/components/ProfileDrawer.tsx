import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Animated,
  Dimensions,
  Easing,
  ToastAndroid,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  User,
  Building2,
  MapPin,
  Phone,
  Package,
  ShoppingCart,
  Truck,
  Edit2,
  Save,
  LogOut,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { useAuthStore } from '@stores/auth.store';
import { useNavigation } from '@react-navigation/native';
import { authService } from '@services/authService';
import { GlassCard } from '../../../design-system/GlassCard';
import { GlassButton } from '../../../design-system/GlassButton';
import { GlassInput } from '../../../design-system/GlassInput';
import { COLORS } from '../../../design-system/tokens';

interface ProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
  showSuccessAnimation?: boolean;
}

interface Base {
  id: string;
  name: string;
  location: string;
  type: string;
  capacity: string;
  addressType?: string;
  isDefault?: boolean;
  isNew?: boolean;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  visible,
  onClose,
  showSuccessAnimation = false,
}) => {
  const { user, logout, setUser } = useAuthStore();
  const navigation = useNavigation();
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'company' | 'bases'>('personal');
  const [showSuccess, setShowSuccess] = useState(showSuccessAnimation);
  const [isSaving, setIsSaving] = useState(false);

  const slideAnim = new Animated.Value(Dimensions.get('window').width);
  const successOpacity = new Animated.Value(0);
  const successScale = new Animated.Value(0.3);
  const checkmarkRotation = new Animated.Value(0);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

      if (showSuccessAnimation && showSuccess) {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(successOpacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(successScale, {
              toValue: 1,
              friction: 4,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.timing(checkmarkRotation, {
              toValue: 1,
              duration: 600,
              easing: Easing.bounce,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setTimeout(() => {
              setShowSuccess(false);
              if (user?.role) {
                redirectToDashboard(user.role);
              }
            }, 2000);
          });
        }, 500);
      }
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, showSuccessAnimation]);

  const redirectToDashboard = (role: string) => {
    onClose();
    switch (role) {
      case 'buyer':
        navigation.navigate('BuyerDashboard' as never);
        break;
      case 'seller':
        navigation.navigate('SellerDashboard' as never);
        break;
      case 'transport':
        navigation.navigate('TransporterDashboard' as never);
        break;
      default:
        navigation.navigate('DashboardMain' as never);
    }
  };

  const [personalInfo, setPersonalInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'buyer',
  });

  const [companyInfo, setCompanyInfo] = useState({
    companyName: '',
    vatNumber: '',
    businessType: '',
    companyAddress: '',
    website: '',
    establishedYear: '',
  });

  const [bases, setBases] = useState<Base[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      Promise.all([
        authService.getCompany().catch(() => ({ success: false, company: null })),
        authService.getBases().catch(() => ({ success: false, bases: [] })),
      ])
        .then(([companyRes, basesRes]) => {
          if (companyRes.company) {
            setCompanyInfo({
              companyName: companyRes.company.companyName || '',
              vatNumber: companyRes.company.vatNumber || '',
              businessType: '',
              companyAddress: '',
              website: companyRes.company.website || '',
              establishedYear: '',
            });
          }
          if (basesRes.bases) {
            setBases(basesRes.bases);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [visible]);

  const handleLogout = async () => {
    await logout();
    onClose();
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Onboarding' as never,
          state: {
            routes: [{ name: 'RoleSelection' }],
            index: 0,
          },
        },
      ],
    });
  };

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert('Success', message);
    }
  };

  const showError = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert('Error', message);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatedUser = await authService.updateProfile({
        name: personalInfo.name,
        email: personalInfo.email,
        phone: personalInfo.phone,
      });
      setUser(updatedUser);

      if (companyInfo.companyName) {
        await authService.updateCompany({
          companyName: companyInfo.companyName,
          vatNumber: companyInfo.vatNumber || undefined,
          website: companyInfo.website || undefined,
        });
      }

      for (const base of bases) {
        if (base.isNew) {
          await authService.createBase({
            label: base.name,
            addressType: base.addressType || 'WAREHOUSE',
            street: base.location,
            isDefault: base.isDefault,
          });
        }
      }

      const basesRes = await authService.getBases().catch(() => ({ bases: [] }));
      setBases(basesRes.bases || []);

      setEditMode(false);
      showToast('Profile updated successfully!');
    } catch (error: any) {
      console.error('Profile save error:', error);
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to save profile';
      showError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const addBase = () => {
    const newBase: Base = {
      id: `new-${Date.now()}`,
      name: 'New Base',
      location: '',
      type: 'warehouse',
      capacity: '',
      addressType: 'WAREHOUSE',
      isNew: true,
    };
    setBases([...bases, newBase]);
  };

  const removeBase = async (id: string) => {
    const base = bases.find((b) => b.id === id);
    if (base && !base.isNew) {
      try {
        await authService.deleteBase(id);
        showToast('Base removed');
      } catch {
        showError('Failed to remove base');
        return;
      }
    }
    setBases(bases.filter((b) => b.id !== id));
  };

  const renderPersonalTab = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {/* Avatar */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: 'rgba(74,222,128,0.2)',
            borderWidth: 2,
            borderColor: '#4ADE80',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#4ADE80',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 12,
          }}
        >
          <User size={44} color="#4ADE80" />
        </View>
        <Text style={{ color: COLORS.textPrimary, fontSize: 20, fontWeight: '700', marginTop: 12 }}>
          {personalInfo.name || 'Your Name'}
        </Text>
        <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 4 }}>
          {personalInfo.email}
        </Text>
      </View>

      <GlassCard tier="medium" style={{ marginBottom: 12 }}>
        <GlassInput
          label="Full Name"
          value={personalInfo.name}
          onChangeText={(text) => setPersonalInfo({ ...personalInfo, name: text })}
          placeholder="Enter full name"
          editable={editMode}
        />
        <GlassInput
          label="Email"
          value={personalInfo.email}
          onChangeText={(text) => setPersonalInfo({ ...personalInfo, email: text })}
          placeholder="Enter email"
          keyboardType="email-address"
          editable={editMode}
          containerStyle={{ marginBottom: 0 }}
        />
      </GlassCard>

      <GlassCard tier="medium" style={{ marginBottom: 12 }}>
        <GlassInput
          label="Phone"
          value={personalInfo.phone}
          onChangeText={(text) => setPersonalInfo({ ...personalInfo, phone: text })}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          editable={editMode}
          containerStyle={{ marginBottom: 0 }}
        />
      </GlassCard>

      {/* Role Badge */}
      <GlassCard tier="subtle">
        <Text
          style={{
            color: COLORS.textMuted,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.8,
            marginBottom: 8,
          }}
        >
          ACCOUNT TYPE
        </Text>
        {(() => {
          const roleIcons: Record<string, { icon: any; color: string }> = {
            seller: { icon: Package, color: '#4ADE80' },
            buyer: { icon: ShoppingCart, color: '#60A5FA' },
            transporter: { icon: Truck, color: '#A78BFA' },
            admin: { icon: User, color: '#FCD34D' },
            farmer: { icon: Package, color: '#4ADE80' },
          };
          const roleConfig = roleIcons[personalInfo.role?.toLowerCase()] || roleIcons.buyer;
          const RoleIcon = roleConfig.icon;
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <RoleIcon size={18} color={roleConfig.color} />
              <Text
                style={{ color: roleConfig.color, fontWeight: '600', textTransform: 'capitalize' }}
              >
                {personalInfo.role || 'Unknown'}
              </Text>
            </View>
          );
        })()}
      </GlassCard>
    </ScrollView>
  );

  const renderCompanyTab = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <GlassCard tier="medium" style={{ marginBottom: 12 }}>
        <GlassInput
          label="Company Name"
          value={companyInfo.companyName}
          onChangeText={(text) => setCompanyInfo({ ...companyInfo, companyName: text })}
          placeholder="Enter company name"
          editable={editMode}
        />
        <GlassInput
          label="VAT Number"
          value={companyInfo.vatNumber}
          onChangeText={(text) => setCompanyInfo({ ...companyInfo, vatNumber: text })}
          placeholder="Enter VAT number"
          editable={editMode}
        />
        <GlassInput
          label="Business Type"
          value={companyInfo.businessType}
          onChangeText={(text) => setCompanyInfo({ ...companyInfo, businessType: text })}
          placeholder="e.g., Agriculture, Manufacturing"
          editable={editMode}
        />
        <GlassInput
          label="Company Address"
          value={companyInfo.companyAddress}
          onChangeText={(text) => setCompanyInfo({ ...companyInfo, companyAddress: text })}
          placeholder="Enter company address"
          editable={editMode}
          multiline
        />
        <GlassInput
          label="Website"
          value={companyInfo.website}
          onChangeText={(text) => setCompanyInfo({ ...companyInfo, website: text })}
          placeholder="https://www.example.com"
          keyboardType="url"
          editable={editMode}
        />
        <GlassInput
          label="Established Year"
          value={companyInfo.establishedYear}
          onChangeText={(text) => setCompanyInfo({ ...companyInfo, establishedYear: text })}
          placeholder="e.g., 2020"
          keyboardType="numeric"
          editable={editMode}
          containerStyle={{ marginBottom: 0 }}
        />
      </GlassCard>
    </ScrollView>
  );

  const renderBasesTab = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {bases.map((base, index) => (
        <GlassCard key={base.id} tier="medium" style={{ marginBottom: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 16 }}>
              {base.name}
            </Text>
            {editMode && (
              <TouchableOpacity onPress={() => removeBase(base.id)} style={{ padding: 4 }}>
                <Trash2 size={18} color="#F87171" />
              </TouchableOpacity>
            )}
          </View>
          {editMode ? (
            <>
              <GlassInput
                label="Base Name"
                value={base.name}
                onChangeText={(text) => {
                  const updated = [...bases];
                  updated[index] = { ...base, name: text };
                  setBases(updated);
                }}
                placeholder="Base name"
              />
              <GlassInput
                label="Location"
                value={base.location}
                onChangeText={(text) => {
                  const updated = [...bases];
                  updated[index] = { ...base, location: text };
                  setBases(updated);
                }}
                placeholder="Location"
                leftIcon={<MapPin size={16} color={COLORS.textMuted} />}
              />
              <GlassInput
                label="Type"
                value={base.type}
                onChangeText={(text) => {
                  const updated = [...bases];
                  updated[index] = { ...base, type: text as any };
                  setBases(updated);
                }}
                placeholder="warehouse/distribution/collection"
                leftIcon={<Building2 size={16} color={COLORS.textMuted} />}
              />
              <GlassInput
                label="Capacity"
                value={base.capacity}
                onChangeText={(text) => {
                  const updated = [...bases];
                  updated[index] = { ...base, capacity: text };
                  setBases(updated);
                }}
                placeholder="Capacity"
                containerStyle={{ marginBottom: 0 }}
              />
            </>
          ) : (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MapPin size={14} color={COLORS.textMuted} />
                <Text style={{ color: COLORS.textSecondary, marginLeft: 8, fontSize: 14 }}>
                  {base.location || 'No location'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Building2 size={14} color={COLORS.textMuted} />
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    marginLeft: 8,
                    fontSize: 14,
                    textTransform: 'capitalize',
                  }}
                >
                  {base.type}
                </Text>
              </View>
            </View>
          )}
        </GlassCard>
      ))}

      {editMode && (
        <GlassButton
          label="Add New Base"
          onPress={addBase}
          variant="ghost"
          fullWidth
          leftIcon={<Plus size={16} color={COLORS.textSecondary} />}
        />
      )}
    </ScrollView>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

        <Animated.View
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: Platform.OS === 'web' ? 400 : '88%',
            backgroundColor: 'rgba(5,46,22,0.97)',
            borderLeftWidth: 1,
            borderLeftColor: 'rgba(74,222,128,0.2)',
            transform: [{ translateX: slideAnim }],
            shadowColor: '#000',
            shadowOffset: { width: -4, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            {/* Success Animation Overlay */}
            {showSuccess && (
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(5,46,22,0.98)',
                  zIndex: 1000,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: successOpacity,
                }}
              >
                <Animated.View
                  style={{
                    transform: [
                      { scale: successScale },
                      {
                        rotate: checkmarkRotation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: 'rgba(74,222,128,0.2)',
                      borderWidth: 2,
                      borderColor: '#4ADE80',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#4ADE80', fontSize: 56 }}>✓</Text>
                  </View>
                </Animated.View>
                <Animated.Text
                  style={{
                    marginTop: 24,
                    fontSize: 22,
                    fontWeight: '700',
                    color: '#4ADE80',
                    opacity: successOpacity,
                  }}
                >
                  Profile Created Successfully!
                </Animated.Text>
                <Animated.Text
                  style={{
                    marginTop: 8,
                    fontSize: 15,
                    color: COLORS.textSecondary,
                    opacity: successOpacity,
                  }}
                >
                  Redirecting to your dashboard...
                </Animated.Text>
              </Animated.View>
            )}

            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <Text style={{ color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' }}>
                Profile
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => (editMode ? handleSave() : setEditMode(true))}
                  style={{ padding: 8 }}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#4ADE80" />
                  ) : editMode ? (
                    <Save size={22} color="#4ADE80" />
                  ) : (
                    <Edit2 size={22} color={COLORS.textSecondary} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={{ padding: 8 }} disabled={isSaving}>
                  <X size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tabs */}
            <View
              style={{
                flexDirection: 'row',
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.08)',
              }}
            >
              {(['personal', 'company', 'bases'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderBottomWidth: 2,
                    borderBottomColor: activeTab === tab ? '#4ADE80' : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      fontSize: 13,
                      color: activeTab === tab ? '#4ADE80' : COLORS.textMuted,
                    }}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Loading */}
            {isLoading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#4ADE80" />
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                {activeTab === 'personal' && renderPersonalTab()}
                {activeTab === 'company' && renderCompanyTab()}
                {activeTab === 'bases' && renderBasesTab()}
              </View>
            )}

            {/* Logout */}
            <View
              style={{
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <GlassButton
                label="Logout"
                onPress={handleLogout}
                variant="danger"
                fullWidth
                leftIcon={<LogOut size={18} color="#FFFFFF" />}
              />
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};
