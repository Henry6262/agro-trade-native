import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { Camera, FileText, CheckCircle, XCircle } from 'lucide-react-native';
import { GlassCard, GlassInput, GlassButton } from '../../../../../design-system';
import { VerificationFormProps, VerificationStatus } from '../types';

export const VerificationForm: React.FC<VerificationFormProps> = ({ job, onSubmit, onCancel }) => {
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
    setVerifiedSpecs((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleMethodChange = (key: string, value: string) => {
    setTestMethods((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [`method-${key}`]: '' }));
  };

  const handleAddPhoto = () => {
    Alert.alert('Add Photo Evidence', 'Choose photo source', [
      { text: 'Camera', onPress: () => addMockPhoto('camera') },
      { text: 'Gallery', onPress: () => addMockPhoto('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const addMockPhoto = (source: string) => {
    const newPhoto = {
      type: 'photo',
      url: `https://example.com/photo-${Date.now()}.jpg`,
      caption: `Photo from ${source}`,
      timestamp: new Date(),
    };
    setEvidence((prev) => [...prev, newPhoto]);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    specKeys.forEach((key) => {
      if (!verifiedSpecs[key]) {
        newErrors[key] = 'Required';
      }
      if (!testMethods[key]) {
        newErrors[`method-${key}`] = 'Test method required';
      }
    });

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
      inspectorId: 'inspector-001',
      originalSpecs: job.productDetails.claimedSpecs,
      verifiedSpecs: Object.keys(verifiedSpecs).reduce(
        (acc, key) => {
          acc[key] = `${verifiedSpecs[key]}%`;
          return acc;
        },
        {} as Record<string, string>
      ),
      testMethods: specKeys.map((key) => ({
        parameter: key,
        method: testMethods[key] || '',
        equipment: 'Standard Equipment',
        standardUsed: 'ISO Standards',
      })),
      evidence,
      notes: notes + (correctedSpecs.notes ? `\n\nCorrections: ${correctedSpecs.notes}` : ''),
      verificationStatus,
      verifiedAt: new Date(),
      productSpecifications:
        Object.keys(correctedSpecs).length > 0
          ? {
              variety: correctedSpecs.variety || job.productDetails.claimedSpecs.variety,
              grade: correctedSpecs.grade || job.productDetails.claimedSpecs.grade,
              origin: correctedSpecs.origin || job.productDetails.claimedSpecs.origin,
            }
          : undefined,
    };

    onSubmit(result);
  };

  const statusVerifiedActive = verificationStatus === VerificationStatus.VERIFIED;
  const statusPartialActive = verificationStatus === VerificationStatus.PARTIALLY_VERIFIED;
  const statusFailedActive = verificationStatus === VerificationStatus.FAILED;

  return (
    <GlassCard tier="strong">
      <Text style={styles.formTitle}>Verification Form</Text>

      {/* Specifications */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Verify Specifications</Text>

        {specKeys.map((key) => (
          <GlassCard key={key} tier="subtle" style={styles.specCard}>
            <Text style={styles.specKeyLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
            <Text style={styles.specClaimedText}>
              Claimed: {job.productDetails.claimedSpecs[key]}
            </Text>

            <GlassInput
              testID={`input-${key}`}
              placeholder="Verified value"
              value={verifiedSpecs[key] || ''}
              onChangeText={(value) => handleSpecChange(key, value)}
              keyboardType="numeric"
              error={errors[key]}
              containerStyle={styles.inputContainer}
            />

            <GlassInput
              testID={`method-${key}`}
              placeholder="Test method used"
              value={testMethods[key] || ''}
              onChangeText={(value) => handleMethodChange(key, value)}
              error={errors[`method-${key}`]}
              containerStyle={styles.inputContainer}
            />
          </GlassCard>
        ))}
      </View>

      {/* Product Specification Corrections */}
      <View style={styles.section}>
        <TouchableOpacity
          onPress={() => setShowCorrections(!showCorrections)}
          style={styles.correctionsToggle}
        >
          <Text style={styles.correctionsLabel}>Product Specification Corrections</Text>
          <Text style={styles.correctionsArrow}>{showCorrections ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {showCorrections && (
          <GlassCard tier="subtle" style={styles.correctionsCard}>
            <Text style={styles.correctionsHint}>
              If seller-provided specifications are incorrect, enter corrected values:
            </Text>

            <GlassInput
              placeholder="Product variety (if different)"
              value={correctedSpecs.variety || ''}
              onChangeText={(value) => setCorrectedSpecs((prev) => ({ ...prev, variety: value }))}
              containerStyle={styles.inputContainer}
            />
            <GlassInput
              placeholder="Grade (if different)"
              value={correctedSpecs.grade || ''}
              onChangeText={(value) => setCorrectedSpecs((prev) => ({ ...prev, grade: value }))}
              containerStyle={styles.inputContainer}
            />
            <GlassInput
              placeholder="Origin (if different)"
              value={correctedSpecs.origin || ''}
              onChangeText={(value) => setCorrectedSpecs((prev) => ({ ...prev, origin: value }))}
              containerStyle={styles.inputContainer}
            />
            <GlassInput
              placeholder="Additional corrections notes"
              value={correctedSpecs.notes || ''}
              onChangeText={(value) => setCorrectedSpecs((prev) => ({ ...prev, notes: value }))}
              multiline
              numberOfLines={2}
            />
          </GlassCard>
        )}
      </View>

      {/* Verification Status */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Verification Status</Text>
        <View style={styles.statusRow}>
          <TouchableOpacity
            testID="status-verified"
            onPress={() => setVerificationStatus(VerificationStatus.VERIFIED)}
            style={[
              styles.statusBtn,
              styles.statusBtnLeft,
              statusVerifiedActive && styles.statusBtnActiveGreen,
            ]}
          >
            <CheckCircle
              size={15}
              color={statusVerifiedActive ? '#4ADE80' : 'rgba(255,255,255,0.35)'}
            />
            <Text style={[styles.statusBtnText, statusVerifiedActive && { color: '#4ADE80' }]}>
              Verified
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="status-partially-verified"
            onPress={() => setVerificationStatus(VerificationStatus.PARTIALLY_VERIFIED)}
            style={[
              styles.statusBtn,
              styles.statusBtnCenter,
              statusPartialActive && styles.statusBtnActiveYellow,
            ]}
          >
            <Text style={[styles.statusBtnText, statusPartialActive && { color: '#FCD34D' }]}>
              Partial
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="status-failed"
            onPress={() => setVerificationStatus(VerificationStatus.FAILED)}
            style={[
              styles.statusBtn,
              styles.statusBtnRight,
              statusFailedActive && styles.statusBtnActiveRed,
            ]}
          >
            <XCircle size={15} color={statusFailedActive ? '#F87171' : 'rgba(255,255,255,0.35)'} />
            <Text style={[styles.statusBtnText, statusFailedActive && { color: '#F87171' }]}>
              Failed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Evidence */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Evidence</Text>

        <TouchableOpacity
          testID="photo-picker"
          onPress={handleAddPhoto}
          style={styles.photoPickerBtn}
        >
          <Camera size={20} color="rgba(255,255,255,0.5)" />
          <Text style={styles.photoPickerText}>Add Photo Evidence</Text>
        </TouchableOpacity>

        {evidence.length > 0 && (
          <View style={styles.evidenceList}>
            {evidence.map((item, index) => (
              <View key={index} style={styles.evidenceItem}>
                <FileText size={15} color="rgba(255,255,255,0.45)" />
                <Text style={styles.evidenceCaption}>{item.caption}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          Notes{' '}
          {verificationStatus === VerificationStatus.FAILED && (
            <Text style={{ color: '#F87171' }}>*</Text>
          )}
        </Text>
        <GlassInput
          testID="verification-notes"
          placeholder="Add verification notes..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          error={errors.notes}
        />
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <GlassButton
          label="Cancel"
          onPress={onCancel}
          variant="secondary"
          size="md"
          style={styles.actionBtnHalf}
        />
        <GlassButton
          label="Submit Verification"
          onPress={handleSubmit}
          variant="primary"
          size="md"
          style={styles.actionBtnHalf}
        />
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  actionBtnHalf: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  correctionsArrow: {
    color: '#FCD34D',
    fontSize: 12,
  },
  correctionsCard: {
    gap: 8,
  },
  correctionsHint: {
    color: 'rgba(252,211,77,0.7)',
    fontSize: 11,
    marginBottom: 8,
  },
  correctionsLabel: {
    color: '#FCD34D',
    fontSize: 13,
    fontWeight: '600',
  },
  correctionsToggle: {
    alignItems: 'center',
    backgroundColor: 'rgba(252,211,77,0.1)',
    borderColor: 'rgba(252,211,77,0.2)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  evidenceCaption: {
    color: 'rgba(255,255,255,0.55)',
    flex: 1,
    fontSize: 13,
  },
  evidenceItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  evidenceList: {
    gap: 6,
    marginTop: 8,
  },
  formTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 8,
  },
  photoPickerBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  photoPickerText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  specCard: {
    marginBottom: 12,
  },
  specClaimedText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginBottom: 10,
  },
  specKeyLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  statusBtnActiveGreen: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderColor: 'rgba(74,222,128,0.35)',
  },
  statusBtnActiveRed: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderColor: 'rgba(248,113,113,0.35)',
  },
  statusBtnActiveYellow: {
    backgroundColor: 'rgba(252,211,77,0.12)',
    borderColor: 'rgba(252,211,77,0.35)',
  },
  statusBtnCenter: {
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  statusBtnLeft: {
    borderBottomLeftRadius: 10,
    borderTopLeftRadius: 10,
  },
  statusBtnRight: {
    borderBottomRightRadius: 10,
    borderTopRightRadius: 10,
  },
  statusBtnText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
  },
});
