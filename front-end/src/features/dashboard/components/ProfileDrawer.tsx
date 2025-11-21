import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Platform,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import {
  X,
  User,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Edit2,
  Save,
  LogOut,
  Plus,
  Trash2,
  ChevronRight,
  Package,
  ShoppingCart,
  Truck,
} from 'lucide-react-native';
import { useAuthStore } from '@stores/auth.store';
import { useNavigation } from '@react-navigation/native';

interface ProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
  showSuccessAnimation?: boolean;
}

interface Base {
  id: string;
  name: string;
  location: string;
  type: 'warehouse' | 'distribution' | 'collection';
  capacity: string;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  visible,
  onClose,
  showSuccessAnimation = false,
}) => {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation();
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'company' | 'bases'>('personal');
  const [showSuccess, setShowSuccess] = useState(showSuccessAnimation);

  // Animation values
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

      // Show success animation if needed
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
            // Hide success animation after 2 seconds and redirect
            setTimeout(() => {
              setShowSuccess(false);
              // Redirect based on user role
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

  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
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

  const [bases, setBases] = useState<Base[]>([
    {
      id: '1',
      name: 'Main Warehouse',
      location: 'Sofia, Bulgaria',
      type: 'warehouse',
      capacity: '5000 tons',
    },
  ]);

  const handleLogout = async () => {
    // Clear the auth session (now async)
    await logout();
    onClose();

    // Navigate to the Onboarding stack and then to RoleSelection
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

  const handleSave = () => {
    // Save profile information
    console.log('Saving profile:', { personalInfo, companyInfo, bases });
    setEditMode(false);
    // TODO: API call to save data
  };

  const addBase = () => {
    const newBase: Base = {
      id: Date.now().toString(),
      name: 'New Base',
      location: '',
      type: 'warehouse',
      capacity: '',
    };
    setBases([...bases, newBase]);
  };

  const removeBase = (id: string) => {
    setBases(bases.filter((base) => base.id !== id));
  };

  const renderPersonalTab = () => (
    <View className="p-4">
      <View className="mb-6">
        <View className="w-24 h-24 bg-emerald-500 rounded-full items-center justify-center self-center mb-4">
          <User size={48} color="white" />
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-gray-500 text-sm mb-1">Full Name</Text>
            {editMode ? (
              <TextInput
                value={personalInfo.name}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, name: text })}
                className="bg-gray-100 p-3 rounded-lg text-gray-900"
              />
            ) : (
              <Text className="text-gray-900 text-lg">{personalInfo.name}</Text>
            )}
          </View>

          <View>
            <Text className="text-gray-500 text-sm mb-1">Email</Text>
            {editMode ? (
              <TextInput
                value={personalInfo.email}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, email: text })}
                className="bg-gray-100 p-3 rounded-lg text-gray-900"
                keyboardType="email-address"
              />
            ) : (
              <Text className="text-gray-900 text-lg">{personalInfo.email}</Text>
            )}
          </View>

          <View>
            <Text className="text-gray-500 text-sm mb-1">Phone</Text>
            {editMode ? (
              <TextInput
                value={personalInfo.phone}
                onChangeText={(text) => setPersonalInfo({ ...personalInfo, phone: text })}
                className="bg-gray-100 p-3 rounded-lg text-gray-900"
                keyboardType="phone-pad"
              />
            ) : (
              <Text className="text-gray-900 text-lg">{personalInfo.phone || 'Not provided'}</Text>
            )}
          </View>

          <View>
            <Text className="text-gray-500 text-sm mb-1">Account Type</Text>
            <View className="flex-row items-center gap-2">
              {(() => {
                const roleIcons = {
                  seller: { icon: Package, color: '#10b981', bg: '#dcfce7' },
                  buyer: { icon: ShoppingCart, color: '#3b82f6', bg: '#dbeafe' },
                  transporter: { icon: Truck, color: '#8b5cf6', bg: '#ede9fe' },
                  admin: { icon: User, color: '#f59e0b', bg: '#fef3c7' },
                  farmer: { icon: Package, color: '#10b981', bg: '#dcfce7' },
                };
                const roleConfig = roleIcons[personalInfo.role?.toLowerCase()] || roleIcons.buyer;
                const RoleIcon = roleConfig.icon;

                return (
                  <View
                    className="flex-row items-center gap-2 px-4 py-2 rounded-full"
                    style={{ backgroundColor: roleConfig.bg }}
                  >
                    <RoleIcon size={18} color={roleConfig.color} />
                    <Text className="font-semibold capitalize" style={{ color: roleConfig.color }}>
                      {personalInfo.role || 'Unknown'}
                    </Text>
                  </View>
                );
              })()}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderCompanyTab = () => (
    <ScrollView className="p-4">
      <View className="space-y-4">
        <View>
          <Text className="text-gray-500 text-sm mb-1">Company Name</Text>
          {editMode ? (
            <TextInput
              value={companyInfo.companyName}
              onChangeText={(text) => setCompanyInfo({ ...companyInfo, companyName: text })}
              className="bg-gray-100 p-3 rounded-lg text-gray-900"
              placeholder="Enter company name"
            />
          ) : (
            <Text className="text-gray-900 text-lg">
              {companyInfo.companyName || 'Not provided'}
            </Text>
          )}
        </View>

        <View>
          <Text className="text-gray-500 text-sm mb-1">VAT Number</Text>
          {editMode ? (
            <TextInput
              value={companyInfo.vatNumber}
              onChangeText={(text) => setCompanyInfo({ ...companyInfo, vatNumber: text })}
              className="bg-gray-100 p-3 rounded-lg text-gray-900"
              placeholder="Enter VAT number"
            />
          ) : (
            <Text className="text-gray-900 text-lg">{companyInfo.vatNumber || 'Not provided'}</Text>
          )}
        </View>

        <View>
          <Text className="text-gray-500 text-sm mb-1">Business Type</Text>
          {editMode ? (
            <TextInput
              value={companyInfo.businessType}
              onChangeText={(text) => setCompanyInfo({ ...companyInfo, businessType: text })}
              className="bg-gray-100 p-3 rounded-lg text-gray-900"
              placeholder="e.g., Agriculture, Manufacturing"
            />
          ) : (
            <Text className="text-gray-900 text-lg">
              {companyInfo.businessType || 'Not provided'}
            </Text>
          )}
        </View>

        <View>
          <Text className="text-gray-500 text-sm mb-1">Company Address</Text>
          {editMode ? (
            <TextInput
              value={companyInfo.companyAddress}
              onChangeText={(text) => setCompanyInfo({ ...companyInfo, companyAddress: text })}
              className="bg-gray-100 p-3 rounded-lg text-gray-900"
              placeholder="Enter company address"
              multiline
            />
          ) : (
            <Text className="text-gray-900 text-lg">
              {companyInfo.companyAddress || 'Not provided'}
            </Text>
          )}
        </View>

        <View>
          <Text className="text-gray-500 text-sm mb-1">Website</Text>
          {editMode ? (
            <TextInput
              value={companyInfo.website}
              onChangeText={(text) => setCompanyInfo({ ...companyInfo, website: text })}
              className="bg-gray-100 p-3 rounded-lg text-gray-900"
              placeholder="https://www.example.com"
              keyboardType="url"
            />
          ) : (
            <Text className="text-gray-900 text-lg">{companyInfo.website || 'Not provided'}</Text>
          )}
        </View>

        <View>
          <Text className="text-gray-500 text-sm mb-1">Established Year</Text>
          {editMode ? (
            <TextInput
              value={companyInfo.establishedYear}
              onChangeText={(text) => setCompanyInfo({ ...companyInfo, establishedYear: text })}
              className="bg-gray-100 p-3 rounded-lg text-gray-900"
              placeholder="e.g., 2020"
              keyboardType="numeric"
            />
          ) : (
            <Text className="text-gray-900 text-lg">
              {companyInfo.establishedYear || 'Not provided'}
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );

  const renderBasesTab = () => (
    <ScrollView className="p-4">
      <View className="space-y-4">
        {bases.map((base, index) => (
          <View key={base.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1">
                {editMode ? (
                  <TextInput
                    value={base.name}
                    onChangeText={(text) => {
                      const updated = [...bases];
                      updated[index] = { ...base, name: text };
                      setBases(updated);
                    }}
                    className="bg-white p-2 rounded text-gray-900 font-semibold"
                    placeholder="Base name"
                  />
                ) : (
                  <Text className="text-gray-900 font-semibold text-lg">{base.name}</Text>
                )}
              </View>
              {editMode && (
                <TouchableOpacity onPress={() => removeBase(base.id)} className="ml-2 p-2">
                  <Trash2 size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>

            <View className="space-y-2">
              <View className="flex-row items-center">
                <MapPin size={16} color="#6b7280" />
                {editMode ? (
                  <TextInput
                    value={base.location}
                    onChangeText={(text) => {
                      const updated = [...bases];
                      updated[index] = { ...base, location: text };
                      setBases(updated);
                    }}
                    className="flex-1 ml-2 bg-white p-2 rounded text-gray-700"
                    placeholder="Location"
                  />
                ) : (
                  <Text className="ml-2 text-gray-700">{base.location}</Text>
                )}
              </View>

              <View className="flex-row items-center">
                <Building2 size={16} color="#6b7280" />
                {editMode ? (
                  <TextInput
                    value={base.type}
                    onChangeText={(text) => {
                      const updated = [...bases];
                      updated[index] = { ...base, type: text as any };
                      setBases(updated);
                    }}
                    className="flex-1 ml-2 bg-white p-2 rounded text-gray-700"
                    placeholder="Type (warehouse/distribution/collection)"
                  />
                ) : (
                  <Text className="ml-2 text-gray-700 capitalize">{base.type}</Text>
                )}
              </View>

              <View className="flex-row items-center">
                <Package size={16} color="#6b7280" />
                {editMode ? (
                  <TextInput
                    value={base.capacity}
                    onChangeText={(text) => {
                      const updated = [...bases];
                      updated[index] = { ...base, capacity: text };
                      setBases(updated);
                    }}
                    className="flex-1 ml-2 bg-white p-2 rounded text-gray-700"
                    placeholder="Capacity"
                  />
                ) : (
                  <Text className="ml-2 text-gray-700">{base.capacity}</Text>
                )}
              </View>
            </View>
          </View>
        ))}

        {editMode && (
          <TouchableOpacity
            onPress={addBase}
            className="bg-emerald-500 p-4 rounded-xl flex-row items-center justify-center"
          >
            <Plus size={20} color="white" />
            <Text className="ml-2 text-white font-semibold">Add New Base</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

        <Animated.View
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: Platform.OS === 'web' ? 400 : '85%',
            backgroundColor: 'white',
            transform: [{ translateX: slideAnim }],
            shadowColor: '#000',
            shadowOffset: { width: -2, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 5,
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
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
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
                  <View className="w-32 h-32 bg-emerald-500 rounded-full items-center justify-center">
                    <Text className="text-white text-6xl">✓</Text>
                  </View>
                </Animated.View>
                <Animated.Text
                  style={{
                    marginTop: 24,
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#10b981',
                    opacity: successOpacity,
                  }}
                >
                  Profile Created Successfully!
                </Animated.Text>
                <Animated.Text
                  style={{
                    marginTop: 8,
                    fontSize: 16,
                    color: '#6b7280',
                    opacity: successOpacity,
                  }}
                >
                  Redirecting to your dashboard...
                </Animated.Text>
              </Animated.View>
            )}

            {/* Header */}
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">Profile</Text>
              <View className="flex-row items-center space-x-3">
                <TouchableOpacity
                  onPress={() => (editMode ? handleSave() : setEditMode(true))}
                  className="p-2"
                >
                  {editMode ? (
                    <Save size={24} color="#10b981" />
                  ) : (
                    <Edit2 size={24} color="#6b7280" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} className="p-2">
                  <X size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tabs */}
            <View className="flex-row border-b border-gray-200">
              {(['personal', 'company', 'bases'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`flex-1 py-3 ${activeTab === tab ? 'border-b-2 border-emerald-500' : ''}`}
                >
                  <Text
                    className={`text-center font-medium capitalize ${
                      activeTab === tab ? 'text-emerald-600' : 'text-gray-500'
                    }`}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab Content */}
            <View className="flex-1">
              {activeTab === 'personal' && renderPersonalTab()}
              {activeTab === 'company' && renderCompanyTab()}
              {activeTab === 'bases' && renderBasesTab()}
            </View>

            {/* Logout Button */}
            <View className="p-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={handleLogout}
                className="bg-red-500 p-4 rounded-xl flex-row items-center justify-center"
              >
                <LogOut size={20} color="white" />
                <Text className="ml-2 text-white font-semibold">Logout</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};
