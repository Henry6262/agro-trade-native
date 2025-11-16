import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { Camera, FileText, CheckCircle, XCircle } from 'lucide-react-native';
import { VerificationFormProps, VerificationStatus } from '../types';

export const VerificationForm: React.FC<VerificationFormProps> = ({
  job,
  onSubmit,
  onCancel,
}) => {
  const [verifiedSpecs, setVerifiedSpecs] = useState<Record<string, string>>({});
  const [correctedSpecs, setCorrectedSpecs] = useState<Record<string, any>>({});
  const [testMethods, setTestMethods] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [evidence, setEvidence] = useState<any[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    VerificationStatus.VERIFIED
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCorrections, setShowCorrections] = useState(false);

  const specKeys = Object.keys(job.productDetails.claimedSpecs);

  const handleSpecChange = (key: string, value: string) => {
    setVerifiedSpecs(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleMethodChange = (key: string, value: string) => {
    setTestMethods(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [`method-${key}`]: '' }));
  };

  const handleAddPhoto = () => {
    // Mock photo picker
    Alert.alert(
      'Add Photo Evidence',
      'Choose photo source',
      [
        { text: 'Camera', onPress: () => addMockPhoto('camera') },
        { text: 'Gallery', onPress: () => addMockPhoto('gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const addMockPhoto = (source: string) => {
    const newPhoto = {
      type: 'photo',
      url: `https://example.com/photo-${Date.now()}.jpg`,
      caption: `Photo from ${source}`,
      timestamp: new Date(),
    };
    setEvidence(prev => [...prev, newPhoto]);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Check all specs have values
    specKeys.forEach(key => {
      if (!verifiedSpecs[key]) {
        newErrors[key] = 'Required';
      }
      if (!testMethods[key]) {
        newErrors[`method-${key}`] = 'Test method required';
      }
    });

    // Check notes for failed verification
    if (verificationStatus === VerificationStatus.FAILED && !notes.trim()) {
      newErrors.notes = 'Notes are required for failed verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    const result = {
      jobId: job.id,
      inspectorId: 'inspector-001', // Would come from auth
      originalSpecs: job.productDetails.claimedSpecs,
      verifiedSpecs: Object.keys(verifiedSpecs).reduce((acc, key) => {
        acc[key] = `${verifiedSpecs[key]}%`; // Add unit
        return acc;
      }, {} as Record<string, string>),
      testMethods: specKeys.map(key => ({
        parameter: key,
        method: testMethods[key] || '',
        equipment: 'Standard Equipment',
        standardUsed: 'ISO Standards',
      })),
      evidence,
      notes: notes + (correctedSpecs.notes ? `\n\nCorrections: ${correctedSpecs.notes}` : ''),
      verificationStatus,
      verifiedAt: new Date(),
      // Include product specification corrections if provided
      productSpecifications: Object.keys(correctedSpecs).length > 0 ? {
        variety: correctedSpecs.variety || job.productDetails.claimedSpecs.variety,
        grade: correctedSpecs.grade || job.productDetails.claimedSpecs.grade,
        origin: correctedSpecs.origin || job.productDetails.claimedSpecs.origin,
      } : undefined,
    };

    onSubmit(result);
  };

  return (
    <ScrollView className="bg-white rounded-lg">
      <View className="p-4">
        <Text className="text-lg font-semibold mb-4">Verification Form</Text>

        {/* Specifications */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Verify Specifications
          </Text>
          
          {specKeys.map(key => (
            <View key={key} className="mb-4 bg-gray-50 p-3 rounded-lg">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
              <Text className="text-xs text-gray-500 mb-2">
                Claimed: {job.productDetails.claimedSpecs[key]}
              </Text>
              
              <TextInput
                testID={`input-${key}`}
                placeholder="Verified value"
                value={verifiedSpecs[key] || ''}
                onChangeText={(value) => handleSpecChange(key, value)}
                className={`bg-white border ${errors[key] ? 'border-red-500' : 'border-gray-300'} rounded px-3 py-2 mb-2`}
                keyboardType="numeric"
              />
              {errors[key] && (
                <Text className="text-red-500 text-xs">{errors[key]}</Text>
              )}
              
              <TextInput
                testID={`method-${key}`}
                placeholder="Test method used"
                value={testMethods[key] || ''}
                onChangeText={(value) => handleMethodChange(key, value)}
                className={`bg-white border ${errors[`method-${key}`] ? 'border-red-500' : 'border-gray-300'} rounded px-3 py-2`}
              />
              {errors[`method-${key}`] && (
                <Text className="text-red-500 text-xs">{errors[`method-${key}`]}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Product Specification Corrections */}
        <View className="mb-4">
          <TouchableOpacity
            onPress={() => setShowCorrections(!showCorrections)}
            className="flex-row items-center justify-between bg-amber-50 p-3 rounded-lg"
          >
            <Text className="text-sm font-semibold text-amber-800">
              Product Specification Corrections
            </Text>
            <Text className="text-amber-600">
              {showCorrections ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          
          {showCorrections && (
            <View className="mt-2 bg-amber-50 p-3 rounded-lg">
              <Text className="text-xs text-amber-700 mb-2">
                If seller-provided specifications are incorrect, enter corrected values:
              </Text>
              
              <TextInput
                placeholder="Product variety (if different)"
                value={correctedSpecs.variety || ''}
                onChangeText={(value) => setCorrectedSpecs(prev => ({ ...prev, variety: value }))}
                className="bg-white border border-amber-300 rounded px-3 py-2 mb-2"
              />
              
              <TextInput
                placeholder="Grade (if different)"
                value={correctedSpecs.grade || ''}
                onChangeText={(value) => setCorrectedSpecs(prev => ({ ...prev, grade: value }))}
                className="bg-white border border-amber-300 rounded px-3 py-2 mb-2"
              />
              
              <TextInput
                placeholder="Origin (if different)"
                value={correctedSpecs.origin || ''}
                onChangeText={(value) => setCorrectedSpecs(prev => ({ ...prev, origin: value }))}
                className="bg-white border border-amber-300 rounded px-3 py-2 mb-2"
              />
              
              <TextInput
                placeholder="Additional corrections notes"
                value={correctedSpecs.notes || ''}
                onChangeText={(value) => setCorrectedSpecs(prev => ({ ...prev, notes: value }))}
                className="bg-white border border-amber-300 rounded px-3 py-2"
                multiline
                numberOfLines={2}
              />
            </View>
          )}
        </View>

        {/* Verification Status */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Verification Status
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              testID="status-verified"
              onPress={() => setVerificationStatus(VerificationStatus.VERIFIED)}
              className={`flex-1 flex-row items-center justify-center py-2 rounded-l-lg border ${
                verificationStatus === VerificationStatus.VERIFIED
                  ? 'bg-green-100 border-green-600'
                  : 'bg-white border-gray-300'
              }`}
            >
              <CheckCircle size={16} color={verificationStatus === VerificationStatus.VERIFIED ? '#16a34a' : '#9ca3af'} />
              <Text className={`ml-1 text-sm ${
                verificationStatus === VerificationStatus.VERIFIED ? 'text-green-700' : 'text-gray-600'
              }`}>
                Verified
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              testID="status-partially-verified"
              onPress={() => setVerificationStatus(VerificationStatus.PARTIALLY_VERIFIED)}
              className={`flex-1 flex-row items-center justify-center py-2 border-t border-b ${
                verificationStatus === VerificationStatus.PARTIALLY_VERIFIED
                  ? 'bg-yellow-100 border-yellow-600'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`text-sm ${
                verificationStatus === VerificationStatus.PARTIALLY_VERIFIED ? 'text-yellow-700' : 'text-gray-600'
              }`}>
                Partial
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              testID="status-failed"
              onPress={() => setVerificationStatus(VerificationStatus.FAILED)}
              className={`flex-1 flex-row items-center justify-center py-2 rounded-r-lg border ${
                verificationStatus === VerificationStatus.FAILED
                  ? 'bg-red-100 border-red-600'
                  : 'bg-white border-gray-300'
              }`}
            >
              <XCircle size={16} color={verificationStatus === VerificationStatus.FAILED ? '#dc2626' : '#9ca3af'} />
              <Text className={`ml-1 text-sm ${
                verificationStatus === VerificationStatus.FAILED ? 'text-red-700' : 'text-gray-600'
              }`}>
                Failed
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Evidence */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Evidence
          </Text>
          
          <TouchableOpacity
            testID="photo-picker"
            onPress={handleAddPhoto}
            className="bg-gray-100 border border-gray-300 border-dashed rounded-lg py-4 flex-row items-center justify-center"
          >
            <Camera size={20} color="#6b7280" />
            <Text className="ml-2 text-gray-600">Add Photo Evidence</Text>
          </TouchableOpacity>
          
          {evidence.length > 0 && (
            <View className="mt-2">
              {evidence.map((item, index) => (
                <View key={index} className="flex-row items-center bg-gray-50 p-2 rounded mb-1">
                  <FileText size={16} color="#6b7280" />
                  <Text className="ml-2 text-sm text-gray-600 flex-1">{item.caption}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Notes */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Notes {verificationStatus === VerificationStatus.FAILED && <Text className="text-red-500">*</Text>}
          </Text>
          <TextInput
            testID="verification-notes"
            placeholder="Add verification notes..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            className={`bg-white border ${errors.notes ? 'border-red-500' : 'border-gray-300'} rounded px-3 py-2`}
            textAlignVertical="top"
          />
          {errors.notes && (
            <Text className="text-red-500 text-xs mt-1">{errors.notes}</Text>
          )}
        </View>

        {/* Actions */}
        <View className="flex-row">
          <TouchableOpacity
            onPress={onCancel}
            className="flex-1 bg-gray-200 py-3 rounded-lg mr-2"
          >
            <Text className="text-center text-gray-700 font-medium">Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleSubmit}
            className="flex-1 bg-green-600 py-3 rounded-lg ml-2"
          >
            <Text className="text-center text-white font-medium">Submit Verification</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};