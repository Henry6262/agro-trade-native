import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { MapPin, DollarSign, Edit2, Info, Weight } from 'lucide-react-native';

import { styles } from './styles';
import type { QuantityStepProps } from './types';

export function QuantityStep({
  location,
  priceOffer,
  defaultUnit,
  quantity,
  selectedQuantity,
  showCustomInput,
  customQuantity,
  presetQuantities,
  onLocationChange,
  onSelectQuantity,
  onShowCustomInput,
  onCustomQuantityChange,
  onCancelCustomInput,
}: QuantityStepProps) {
  return (
    <>
      <TouchableOpacity onPress={onLocationChange} style={styles.locationRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <MapPin size={16} color="#4ADE80" />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={styles.mutedSmallText}>Your Location</Text>
            <Text style={styles.bodyText}>{location?.city || location?.region || 'Not set'}</Text>
          </View>
        </View>
        <Edit2 size={16} color="rgba(255,255,255,0.4)" />
      </TouchableOpacity>

      {location && priceOffer ? (
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={styles.priceBadge}>
            <DollarSign size={18} color="white" />
            <Text style={styles.priceText}>
              {priceOffer.min} - {priceOffer.max}
            </Text>
            <Text style={styles.priceUnit}>/{defaultUnit}</Text>
          </View>
          <Text style={styles.mutedSmallText}>Price range for your region</Text>
        </View>
      ) : !location ? (
        <View style={styles.infoBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Info size={14} color="#F59E0B" />
            <Text style={styles.amberText}>Set location to see regional prices</Text>
          </View>
        </View>
      ) : null}

      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Weight size={20} color="white" />
          <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>How much can you supply?</Text>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          {presetQuantities.map((presetQuantity) => (
            <TouchableOpacity
              key={presetQuantity}
              onPress={() => onSelectQuantity(presetQuantity)}
              style={{ flex: 1, marginHorizontal: 4 }}
            >
              <View
                style={[
                  styles.qtyCard,
                  selectedQuantity === presetQuantity && !showCustomInput
                    ? styles.qtyCardSelected
                    : styles.qtyCardUnselected,
                ]}
              >
                <Text
                  style={[
                    styles.qtyText,
                    selectedQuantity === presetQuantity && !showCustomInput
                      ? styles.qtyTextSelected
                      : styles.qtyTextUnselected,
                  ]}
                >
                  {presetQuantity}/t
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {!showCustomInput ? (
          <TouchableOpacity onPress={onShowCustomInput} style={{ marginBottom: 12 }}>
            <View style={styles.qtyCardUnselected}>
              <Text style={styles.mutedText}>Custom Amount</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={{ marginBottom: 12 }}>
            <TextInput
              value={customQuantity}
              onChangeText={onCustomQuantityChange}
              placeholder="Enter quantity in tons..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="numeric"
              style={styles.customInput}
              autoFocus
            />
            <TouchableOpacity onPress={onCancelCustomInput} style={{ marginTop: 8 }}>
              <Text style={[styles.mutedSmallText, { textAlign: 'center' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.infoBoxBlue}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Info size={14} color="#3B82F6" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.blueText}>Choose your selling option</Text>
            <Text style={styles.blueMutedText}>
              <Text style={{ fontWeight: '600' }}>Create Listing:</Text> List your product on the
              marketplace.{'\n'}
              <Text style={{ fontWeight: '600' }}>Custom Offer:</Text> Provide specifications for a
              personalized quote.
            </Text>
          </View>
        </View>
      </View>

      {quantity > 0 && (
        <Text style={[styles.mutedSmallText, { textAlign: 'center' }]}>
          {quantity} {defaultUnit} selected
        </Text>
      )}
    </>
  );
}
