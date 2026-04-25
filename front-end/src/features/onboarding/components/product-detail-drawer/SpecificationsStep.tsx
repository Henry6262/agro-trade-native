import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { ChevronRight, Package } from 'lucide-react-native';

import { styles } from './styles';
import type { SpecificationsStepProps } from './types';
import { getSpecificationKey } from './utils';

export function SpecificationsStep({
  productName,
  productSpecifications,
  specifications,
  quantity,
  defaultUnit,
  onBack,
  onChangeSpecification,
}: SpecificationsStepProps) {
  return (
    <>
      <View style={{ marginBottom: 16 }}>
        <TouchableOpacity
          onPress={onBack}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
        >
          <ChevronRight
            size={20}
            color="rgba(255,255,255,0.4)"
            style={{ transform: [{ rotate: '180deg' }] }}
          />
          <Text style={[styles.mutedText, { marginLeft: 8 }]}>Back to quantity</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Product Specifications</Text>
        <Text style={[styles.mutedText, { marginBottom: 16 }]}>
          Provide details about your {productName}
        </Text>
      </View>

      {productSpecifications.length > 0 ? (
        <View>
          {productSpecifications.map((specification) => {
            const specificationKey = getSpecificationKey(specification);
            const isRequired = ['CRITICAL', 'IMPORTANT'].includes(specification.importance);

            return (
              <View key={specificationKey} style={styles.specCard}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <Text style={[styles.specLabel, { flex: 1 }]}>
                    {specification.name || specification.code}
                    {isRequired && <Text style={{ color: '#F87171' }}> *</Text>}
                  </Text>
                  {specification.unit ? (
                    <View style={styles.unitBadge}>
                      <Text style={styles.unitText}>{specification.unit}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    value={specifications[specificationKey] || ''}
                    onChangeText={(value) => onChangeSpecification(specification, value)}
                    placeholder={`Enter ${specification.name?.toLowerCase() || specification.code}`}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={styles.specInput}
                    keyboardType={specification.dataType === 'NUMBER' ? 'numeric' : 'default'}
                  />
                </View>

                {specification.dataType === 'NUMBER' &&
                (specification.minValue !== undefined || specification.maxValue !== undefined) ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      marginTop: 8,
                    }}
                  >
                    <View style={styles.rangeTag}>
                      <Text style={styles.blueText}>
                        Valid range: {specification.minValue ?? '0'} -{' '}
                        {specification.maxValue ?? '∞'}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {specification.importance ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <View
                      style={[
                        styles.importanceBadge,
                        specification.importance === 'CRITICAL'
                          ? { backgroundColor: 'rgba(220,38,38,0.15)' }
                          : specification.importance === 'IMPORTANT'
                            ? { backgroundColor: 'rgba(245,158,11,0.15)' }
                            : { backgroundColor: 'rgba(255,255,255,0.08)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.importanceText,
                          specification.importance === 'CRITICAL'
                            ? { color: '#F87171' }
                            : specification.importance === 'IMPORTANT'
                              ? { color: '#FCD34D' }
                              : { color: 'rgba(255,255,255,0.4)' },
                        ]}
                      >
                        {specification.importance.toLowerCase()}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.darkCard}>
          <Text style={[styles.mutedText, { textAlign: 'center' }]}>
            No specifications required for this product
          </Text>
        </View>
      )}

      <View style={styles.greenInfoBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Package size={14} color="#4ADE80" />
          <Text style={[styles.greenText, { marginLeft: 8 }]}>
            Quantity: {quantity} {defaultUnit}
          </Text>
        </View>
      </View>
    </>
  );
}
