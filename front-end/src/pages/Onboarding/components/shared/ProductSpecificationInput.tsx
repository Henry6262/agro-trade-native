import React from 'react';
import { View, Text, TextInput } from 'react-native';

interface SpecificationInputProps {
  spec: {
    id?: string;
    code?: string;
    name?: string;
    unit?: string;
    dataType?: string;
    minValue?: number;
    maxValue?: number;
    importance?: string;
  };
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function ProductSpecificationInput({
  spec,
  value,
  onChange,
  error,
}: SpecificationInputProps) {
  const isRequired = spec.importance === 'CRITICAL' || spec.importance === 'IMPORTANT';

  const handleChange = (text: string) => {
    let processedValue = text;

    // Validate numeric inputs
    if (spec.dataType === 'NUMBER') {
      processedValue = text.replace(/[^0-9.]/g, '');
    }

    onChange(processedValue);
  };

  return (
    <View className="bg-white/50 rounded-2xl p-4 mb-3 border border-gray-200/50">
      {/* Label Row */}
      <View className="mb-3">
        <Text className="text-gray-900 text-sm font-semibold">
          {spec.name || spec.code}
          {isRequired && <Text className="text-red-400"> *</Text>}
        </Text>
        {error && <Text className="text-red-400 text-xs mt-1">{error}</Text>}
      </View>

      {/* Input Field with Unit Square */}
      <View className="flex-row items-center">
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={`Enter ${spec.name?.toLowerCase() || spec.code}`}
          placeholderTextColor="#9CA3AF"
          className={`flex-1 bg-white rounded-l-xl px-4 py-3 text-gray-900 ${
            error ? 'border border-red-500/50' : ''
          }`}
          keyboardType={spec.dataType === 'NUMBER' ? 'numeric' : 'default'}
        />
        {/* Unit/Type Square on the right */}
        <View className="bg-white rounded-r-xl border-l border-gray-200 px-4 py-3 min-w-[60px] items-center justify-center">
          <Text className="text-emerald-600 font-medium text-sm">
            {spec.unit || (spec.dataType === 'NUMBER' ? '#' : 'TXT')}
          </Text>
        </View>
      </View>

      {/* Valid Range Display */}
      {spec.dataType === 'NUMBER' && (spec.minValue || spec.maxValue) && (
        <View className="flex-row items-center justify-end mt-2">
          <View className="bg-blue-600/10 px-3 py-1 rounded-lg">
            <Text className="text-blue-400 text-xs">
              Valid range: {spec.minValue || '0'} - {spec.maxValue || '∞'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
