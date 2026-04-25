import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GlassButton, GlassInput } from '@design-system';

// expo-camera is lazily imported to avoid crashing when native module isn't
// linked in the current dev client build. It works correctly in production.
type CameraModule = typeof import('expo-camera');

interface InspectionExecutionProps {
  inspectionId: string;
  productName: string;
  onComplete: () => void;
  onBack: () => void;
}

type Grade = 'A' | 'B' | 'C';

const GRADE_OPTIONS: Grade[] = ['A', 'B', 'C'];

const GRADE_COLORS: Record<Grade, string> = {
  A: '#4ADE80',
  B: '#FBBF24',
  C: '#F87171',
};

export default function InspectionExecution({
  inspectionId,
  productName,
  onComplete,
  onBack,
}: InspectionExecutionProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [weightVerified, setWeightVerified] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [CameraView, setCameraView] = useState<CameraModule['CameraView'] | null>(null);
  const cameraRef = useRef<InstanceType<CameraModule['CameraView']> | null>(null);

  const handleTakePhoto = async () => {
    try {
      const cam: CameraModule = await import('expo-camera');
      const { status } = await cam.Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera access is needed to take photos.');
        return;
      }
      setCameraView(() => cam.CameraView);
      setShowCamera(true);
    } catch {
      Alert.alert(
        'Camera unavailable',
        'Camera is not available in this build. Photos can be added after rebuilding the app.'
      );
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) {
      setPhotos((prev) => [...prev, photo.uri]);
      setShowCamera(false);
    }
  };

  const handleSubmit = async () => {
    if (!grade) {
      Alert.alert('Missing grade', 'Please select a quality grade before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const { inspectionService } = await import('@services/inspectionService');

      for (const uri of photos) {
        const formData = new FormData();
        formData.append('photo', {
          uri,
          type: 'image/jpeg',
          name: `inspection-${Date.now()}.jpg`,
        } as unknown as Blob);
        const svc = inspectionService as typeof inspectionService & {
          uploadPhoto?: (id: string, fd: FormData) => Promise<void>;
        };
        await svc.uploadPhoto?.(inspectionId, formData);
      }

      await inspectionService.submitInspectionResults(inspectionId, {
        qualityScore: grade === 'A' ? 90 : grade === 'B' ? 70 : 50,
        qualityGrade: grade,
        verificationResult: {
          actualQuantity: parseFloat(weightVerified) || undefined,
          storageConditions: conditionNotes,
        },
        notes: conditionNotes,
        recommendVerification: true,
      });

      Alert.alert('Report submitted!', 'Your inspection report has been submitted.');
      onComplete();
    } catch {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (showCamera && CameraView) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} ref={cameraRef} facing="back" />
        <View style={styles.cameraControls}>
          <TouchableOpacity onPress={() => setShowCamera(false)} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCapture} style={styles.captureBtn} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>Inspection Report</Text>
      <Text style={styles.product}>{productName}</Text>

      {/* Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Photos</Text>
        <View style={styles.photosRow}>
          {photos.map((uri, i) => (
            <Image key={`photo-${i}`} source={{ uri }} style={styles.photoThumb} />
          ))}
          <TouchableOpacity style={styles.addPhotoBtn} onPress={handleTakePhoto}>
            <Text style={styles.addPhotoIcon}>📷</Text>
            <Text style={styles.addPhotoText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grade */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Quality Grade</Text>
        <View style={styles.gradeRow}>
          {GRADE_OPTIONS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.gradeBtn,
                grade === g && {
                  backgroundColor: `${GRADE_COLORS[g]}22`,
                  borderColor: GRADE_COLORS[g],
                },
              ]}
              onPress={() => setGrade(g)}
            >
              <Text style={[styles.gradeText, grade === g && { color: GRADE_COLORS[g] }]}>
                Grade {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Weight */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Verified Weight (tons)</Text>
        <GlassInput
          value={weightVerified}
          onChangeText={setWeightVerified}
          placeholder="e.g. 24.5"
          keyboardType="numeric"
        />
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Condition Notes</Text>
        <GlassInput
          value={conditionNotes}
          onChangeText={setConditionNotes}
          placeholder="Describe the condition of goods..."
          multiline
          numberOfLines={3}
        />
      </View>

      {submitting ? (
        <ActivityIndicator color="#4ADE80" style={styles.submitBtn} />
      ) : (
        <GlassButton
          label="Submit Report"
          onPress={handleSubmit}
          variant="primary"
          fullWidth
          disabled={!grade}
          style={styles.submitBtn}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addPhotoBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  addPhotoIcon: {
    fontSize: 20,
  },
  addPhotoText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 2,
  },
  backBtn: {
    marginBottom: 20,
  },
  backText: {
    color: 'rgba(74,222,128,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  cameraControls: {
    alignItems: 'center',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  cancelBtn: {
    left: 40,
    position: 'absolute',
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  captureBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    height: 72,
    width: 72,
  },
  content: {
    padding: 20,
  },
  gradeBtn: {
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
  },
  gradeRow: {
    flexDirection: 'row',
  },
  gradeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  photoThumb: {
    borderRadius: 12,
    height: 72,
    marginRight: 8,
    width: 72,
  },
  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  product: {
    color: 'rgba(74,222,128,0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
  },
  root: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  submitBtn: {
    marginBottom: 40,
    marginTop: 8,
  },
});
