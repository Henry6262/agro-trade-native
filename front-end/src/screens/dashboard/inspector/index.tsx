import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TABS = [
  { id: 'available' as const, label: 'Available Jobs' },
  { id: 'active' as const, label: 'My Assignments' },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface InspectorDashboardSectionProps {
  activeTab?: string;
}

export function InspectorDashboardSection({ activeTab = 'available' }: InspectorDashboardSectionProps) {
  const [tab, setTab] = useState<TabId>(activeTab as TabId);

  return (
    <View style={styles.root}>
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>
        <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', marginTop: 40 }}>
          Inspector — {tab === 'available' ? 'Available Jobs' : 'My Assignments'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  root: { flex: 1 },
  tabBar: {
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tabBtn: {
    marginRight: 24,
    paddingBottom: 12,
    paddingTop: 8,
  },
  tabBtnActive: {
    borderBottomColor: '#4ADE80',
    borderBottomWidth: 2,
  },
  tabText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#4ADE80',
  },
});
