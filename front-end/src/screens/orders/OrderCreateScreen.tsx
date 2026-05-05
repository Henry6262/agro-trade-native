import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OrderCreateScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Create Order</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { color: '#1F2937', fontSize: 20 },
});
