import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, Info, Package } from 'lucide-react-native';

import { styles } from './styles';
import type { AuthStepProps } from './types';

export function AuthStep({
  productName,
  quantity,
  defaultUnit,
  specificationCount,
  onBack,
}: AuthStepProps) {
  return (
    <View style={{ paddingVertical: 16 }}>
      <TouchableOpacity
        onPress={onBack}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
      >
        <ChevronRight
          size={20}
          color="rgba(255,255,255,0.4)"
          style={{ transform: [{ rotate: '180deg' }] }}
        />
        <Text style={[styles.mutedText, { marginLeft: 8 }]}>Back to specifications</Text>
      </TouchableOpacity>

      <View style={{ marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>Sign in to Submit Your Offer</Text>
        <Text style={styles.mutedText}>
          Create an account or sign in to submit your custom offer for {productName}
        </Text>
      </View>

      <View style={[styles.darkCard, { marginBottom: 24 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Package size={16} color="#4ADE80" />
          <Text style={[styles.greenText, { marginLeft: 8 }]}>
            Quantity: {quantity} {defaultUnit}
          </Text>
        </View>
        {specificationCount > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Info size={16} color="#3B82F6" />
            <Text style={[styles.blueText, { marginLeft: 8 }]}>
              {specificationCount} specifications provided
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.darkCard}>
        <Text style={[styles.mutedText, { textAlign: 'center' }]}>
          Authentication required. Please sign in to continue.
        </Text>
      </View>
    </View>
  );
}
