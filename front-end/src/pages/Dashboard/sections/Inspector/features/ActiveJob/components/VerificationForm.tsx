import React, { useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Camera, CheckCircle, FileText, XCircle } from 'lucide-react-native';
import type { VerificationFormProps, InspectorVerificationStatus } from '../types';

export const VerificationForm: React.FC<VerificationFormProps> = ({ job, onSubmit, onCancel }) => {
  const [verifiedSpecs, setVerifiedSpecs] = useState<Record<string, string>>({});
  const [correctedSpecs, setCorrectedSpecs] = useState<Record<string, string>>({});
  const [testMethods, setTestMethods] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [evidence, setEvidence] = useState<
    { type: 'photo' | 'document' | 'video'; url: string; caption?: string; timestamp: Date }[]
  >([]);
  const [verificationStatus, setVerificationStatus] =
    useState<InspectorVerificationStatus>('VERIFIED');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCorrections, setShowCorrections] = useState(false);

  const specKeys = Object.keys(job.productDetails.claimedSpecs);

  const handleSpecChange = (key: string, value: string) => {
    setVerifiedSpecs((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleMethodChange = (key: string, value: string) => {
    setTestMethods((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [`method-${key}`]: '' }));
  };

  const addMockPhoto = (source: string) => {
    setEvidence((prev) => [
      ...prev,
      {
        type: 'photo',
        url: `https://example.com/photo-${Date.now()}.jpg`,
        caption: `Photo from ${source}`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleAddPhoto = () => {
    Alert.alert('Add Photo Evidence', 'Choose photo source', [
      { text: 'Camera', onPress: () => addMockPhoto('camera') },
      { text: 'Gallery', onPress: () => addMockPhoto('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    specKeys.forEach((key) => {
      if (!verifiedSpecs[key]) {
        nextErrors[key] = 'Required';
      }
      if (!testMethods[key]) {
        nextErrors[`method-${key}`] = 'Test method required';
      }
    });
    if (verificationStatus === 'FAILED' && !notes.trim()) {
      nextErrors.notes = 'Notes are required for failed verification';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    onSubmit({
      verifiedSpecs,
      testMethods,
      notes,
      correctedSpecs,
      evidence,
      verificationStatus,
    });
  };

  return (
    <ScrollView className="bg-white rounded-lg">
      <View className="p-4 space-y-4">
        <Text className="text-lg font-semibold">Verification Form</Text>

        {specKeys.map((key) => (
          <View key={key} className="bg-gray-50 p-3 rounded-lg">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
            <Text className="text-xs text-gray-500 mb-2">
              Claimed: {job.productDetails.claimedSpecs[key]}
            </Text>
            <TextInput
              placeholder="Verified value"
              value={verifiedSpecs[key] || ''}
              onChangeText={(value) => handleSpecChange(key, value)}
              className={`bg-white border ${
                errors[key] ? 'border-red-500' : 'border-gray-300'
              } rounded px-3 py-2 mb-2`}
              keyboardType="numeric"
            />
            {errors[key] && <Text className="text-red-500 text-xs">{errors[key]}</Text>}
            <TextInput
              placeholder="Test method used"
              value={testMethods[key] || ''}
              onChangeText={(value) => handleMethodChange(key, value)}
              className={`bg-white border ${
                errors[`method-${key}`] ? 'border-red-500' : 'border-gray-300'
              } rounded px-3 py-2`}
            />
            {errors[`method-${key}`] && (
              <Text className="text-red-500 text-xs">{errors[`method-${key}`]}</Text>
            )}
          </View>
        ))}

        <View>
          <TouchableOpacity
            onPress={() => setShowCorrections((prev) => !prev)}
            className="flex-row items-center justify-between bg-amber-50 p-3 rounded-lg"
          >
            <Text className="text-sm font-semibold text-amber-800">
              Product Specification Corrections
            </Text>
            <Text className="text-amber-600">{showCorrections ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          {showCorrections && (
            <View className="mt-2 bg-amber-50 p-3 rounded-lg space-y-2">
              <TextInput
                placeholder="Product variety (if different)"
                value={correctedSpecs.variety || ''}
                onChangeText={(value) => setCorrectedSpecs((prev) => ({ ...prev, variety: value }))}
                className="bg-white border border-amber-300 rounded px-3 py-2"
              />
              <TextInput
                placeholder="Grade (if different)"
                value={correctedSpecs.grade || ''}
                onChangeText={(value) => setCorrectedSpecs((prev) => ({ ...prev, grade: value }))}
                className="bg-white border border-amber-300 rounded px-3 py-2"
              />
              <TextInput
                placeholder="Origin (if different)"
                value={correctedSpecs.origin || ''}
                onChangeText={(value) => setCorrectedSpecs((prev) => ({ ...prev, origin: value }))}
                className="bg-white border border-amber-300 rounded px-3 py-2"
              />
            </View>
          )}
        </View>

        <View>
          <Text className="text-sm font-semibold text-gray-700 mb-2">Evidence</Text>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={handleAddPhoto}
              className="flex-row items-center px-3 py-2 bg-gray-100 rounded-lg"
            >
              <Camera size={16} color="#374151" />
              <Text className="ml-2 text-sm text-gray-700">Add Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Alert.alert('Add Document', 'Document uploader coming soon.')}
              className="flex-row items-center px-3 py-2 bg-gray-100 rounded-lg"
            >
              <FileText size={16} color="#374151" />
              <Text className="ml-2 text-sm text-gray-700">Add Document</Text>
            </TouchableOpacity>
          </View>
          {evidence.length > 0 && (
            <ScrollView horizontal className="mt-3">
              {evidence.map((item) => (
                <View key={item.url} className="mr-3">
                  <Image
                    source={{ uri: item.url }}
                    style={{ width: 80, height: 80, borderRadius: 8 }}
                  />
                  <Text className="text-xs text-gray-500 mt-1">{item.caption}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View>
          <Text className="text-sm font-semibold text-gray-700 mb-2">Verification Notes</Text>
          <TextInput
            multiline
            placeholder="Add additional notes..."
            value={notes}
            onChangeText={setNotes}
            className={`bg-white border ${errors.notes ? 'border-red-500' : 'border-gray-300'} rounded px-3 py-2 min-h-[80px]`}
          />
          {errors.notes && <Text className="text-red-500 text-xs mt-1">{errors.notes}</Text>}
        </View>

        <View>
          <Text className="text-sm font-semibold text-gray-700 mb-2">Verification Status</Text>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => setVerificationStatus('VERIFIED')}
              className={`flex-1 flex-row items-center justify-center px-3 py-2 rounded-lg ${
                verificationStatus === 'VERIFIED' ? 'bg-green-600' : 'bg-gray-100'
              }`}
            >
              <CheckCircle
                size={16}
                color={verificationStatus === 'VERIFIED' ? '#fff' : '#374151'}
              />
              <Text
                className={`ml-2 font-medium ${
                  verificationStatus === 'VERIFIED' ? 'text-white' : 'text-gray-700'
                }`}
              >
                Verified
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setVerificationStatus('FAILED')}
              className={`flex-1 flex-row items-center justify-center px-3 py-2 rounded-lg ${
                verificationStatus === 'FAILED' ? 'bg-red-600' : 'bg-gray-100'
              }`}
            >
              <XCircle size={16} color={verificationStatus === 'FAILED' ? '#fff' : '#374151'} />
              <Text
                className={`ml-2 font-medium ${
                  verificationStatus === 'FAILED' ? 'text-white' : 'text-gray-700'
                }`}
              >
                Failed
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row space-x-3">
          {onCancel && (
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-gray-100 rounded-lg py-3"
              onPress={onCancel}
            >
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-green-600 rounded-lg py-3"
            onPress={handleSubmit}
          >
            <Text className="text-white font-semibold">Submit Verification</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};
