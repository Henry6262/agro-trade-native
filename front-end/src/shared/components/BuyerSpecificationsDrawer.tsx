import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Check } from 'lucide-react-native';

interface BuyerSpecificationsDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (specifications: any) => void;
  productId: string;
  productName: string;
  onBack?: () => void;
}

export const BuyerSpecificationsDrawer: React.FC<BuyerSpecificationsDrawerProps> = ({
  visible,
  onClose,
  onSave,
  productId,
  productName,
  onBack,
}) => {
  const [quantity, setQuantity] = useState('');
  const [pricePerKilo, setPricePerKilo] = useState('');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    const specs = {
      productId,
      quantity: quantity || '0',
      unit: 'tons',
      pricePerKilo: pricePerKilo || '0',
      deliveryDeadline,
      notes,
    };

    onSave([specs]);
  };

  const isValid =
    quantity && parseFloat(quantity) > 0 && pricePerKilo && parseFloat(pricePerKilo) > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-black/50">
          <View className="bg-neutral-900 rounded-t-3xl mt-20" style={{ flex: 1 }}>
            {/* Header */}
            <View className="flex-row justify-between items-center p-6 border-b border-neutral-700">
              <TouchableOpacity onPress={onBack || onClose}>
                <Text className="text-blue-400 font-semibold">Back</Text>
              </TouchableOpacity>
              <Text className="text-xl font-bold text-white">Product Requirements</Text>
              <TouchableOpacity onPress={handleSave} disabled={!isValid}>
                <Text className={isValid ? 'text-blue-400 font-semibold' : 'text-gray-500'}>
                  Next
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
              <Text className="text-lg text-white mb-1">{productName}</Text>
              <Text className="text-gray-400 mb-6">Specify your requirements</Text>

              {/* Quantity Input */}
              <View className="mb-6">
                <Text className="text-white font-semibold mb-2">Quantity Required</Text>
                <View className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
                  <View className="flex-row items-center">
                    <TextInput
                      value={quantity}
                      onChangeText={setQuantity}
                      placeholder="0"
                      placeholderTextColor="#6B7280"
                      keyboardType="numeric"
                      className="flex-1 text-white text-lg"
                    />
                    <Text className="text-gray-400 ml-2">tons</Text>
                  </View>
                </View>
              </View>

              {/* Price Input */}
              <View className="mb-6">
                <Text className="text-white font-semibold mb-2">Maximum Price</Text>
                <View className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
                  <View className="flex-row items-center">
                    <Text className="text-gray-400 mr-2">€</Text>
                    <TextInput
                      value={pricePerKilo}
                      onChangeText={setPricePerKilo}
                      placeholder="0.00"
                      placeholderTextColor="#6B7280"
                      keyboardType="numeric"
                      className="flex-1 text-white text-lg"
                    />
                    <Text className="text-gray-400 ml-2">per kg</Text>
                  </View>
                </View>
                {quantity && pricePerKilo && (
                  <Text className="text-gray-400 text-sm mt-2">
                    Total budget: €
                    {(
                      parseFloat(quantity || '0') *
                      1000 *
                      parseFloat(pricePerKilo || '0')
                    ).toLocaleString()}
                  </Text>
                )}
              </View>

              {/* Delivery Deadline */}
              <View className="mb-6">
                <Text className="text-white font-semibold mb-2">Delivery Deadline (Optional)</Text>
                <View className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
                  <TextInput
                    value={deliveryDeadline}
                    onChangeText={setDeliveryDeadline}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor="#6B7280"
                    className="text-white text-lg"
                  />
                </View>
              </View>

              {/* Additional Notes */}
              <View className="mb-6">
                <Text className="text-white font-semibold mb-2">
                  Additional Requirements (Optional)
                </Text>
                <View className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Any specific quality requirements, certifications, etc."
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={4}
                    className="text-white"
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </ScrollView>

            {/* Footer Button */}
            <View className="p-6 border-t border-neutral-700">
              <TouchableOpacity
                onPress={handleSave}
                disabled={!isValid}
                className={`rounded-xl py-4 ${isValid ? 'bg-blue-500' : 'bg-gray-700'}`}
              >
                <Text className="text-white text-center font-semibold text-lg">
                  Continue to Review
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
