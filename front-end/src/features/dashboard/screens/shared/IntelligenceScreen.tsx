'use client';

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import {
  Search,
  FileText,
  Eye,
  Download,
  Filter,
  TrendingUp,
  BarChart3,
  AlertTriangle,
} from 'lucide-react-native';
import {
  GlassCard,
  GlassBadge,
  GlassButton,
  GlassInput,
  StatCard,
} from '../../../../design-system';
import { COLORS } from '../../../../design-system';

const DIVIDER = { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 8 };

interface IntelligenceScreenProps {
  id?: string;
}

interface Report {
  id: string;
  title: string;
  category: string;
  source: string;
  region: string;
  date: string;
  status: string;
  impact: string;
  summary: string;
  tags: string[];
  priceChange: string;
  confidence: number;
}

export default function IntelligenceScreen({ id: _id }: IntelligenceScreenProps = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const reports: Report[] = [
    {
      id: 'MKT-2025-001',
      title: 'CORN FUTURES PRICE ANALYSIS',
      category: 'PRICE FORECAST',
      source: 'MARKET DATA',
      region: 'Midwest USA',
      date: '2025-06-17',
      status: 'current',
      impact: 'high',
      summary:
        'Detailed analysis of corn futures showing 15% price increase expected due to weather conditions',
      tags: ['corn', 'futures', 'weather', 'pricing'],
      priceChange: '+12.5%',
      confidence: 85,
    },
    {
      id: 'MKT-2025-002',
      title: 'ORGANIC PRODUCE DEMAND SURGE',
      category: 'DEMAND ANALYSIS',
      source: 'CONSUMER DATA',
      region: 'California',
      date: '2025-06-16',
      status: 'trending',
      impact: 'critical',
      summary:
        'Consumer demand for organic produce increased 28% quarter-over-quarter in major metropolitan areas',
      tags: ['organic', 'demand', 'consumer', 'growth'],
      priceChange: '+28.3%',
      confidence: 92,
    },
    {
      id: 'MKT-2025-003',
      title: 'WHEAT EXPORT OPPORTUNITIES',
      category: 'TRADE ANALYSIS',
      source: 'EXPORT DATA',
      region: 'Great Plains',
      date: '2025-06-15',
      status: 'current',
      impact: 'medium',
      summary: 'New trade agreements opening wheat export channels to Southeast Asian markets',
      tags: ['wheat', 'export', 'trade', 'asia'],
      priceChange: '+8.7%',
      confidence: 78,
    },
    {
      id: 'MKT-2025-004',
      title: 'DROUGHT IMPACT ASSESSMENT',
      category: 'RISK ANALYSIS',
      source: 'WEATHER DATA',
      region: 'Southwest USA',
      date: '2025-06-14',
      status: 'alert',
      impact: 'critical',
      summary:
        'Extended drought conditions threatening crop yields across multiple agricultural regions',
      tags: ['drought', 'risk', 'yield', 'climate'],
      priceChange: '+22.1%',
      confidence: 89,
    },
    {
      id: 'MKT-2025-005',
      title: 'SUSTAINABLE FARMING TRENDS',
      category: 'TREND ANALYSIS',
      source: 'INDUSTRY REPORTS',
      region: 'National',
      date: '2025-06-13',
      status: 'current',
      impact: 'low',
      summary:
        'Growing adoption of sustainable farming practices creating new market opportunities',
      tags: ['sustainability', 'trends', 'innovation', 'practices'],
      priceChange: '+5.2%',
      confidence: 71,
    },
  ];

  const getCategoryVariant = (
    category: string
  ): 'info' | 'success' | 'muted' | 'danger' | 'warning' => {
    switch (category) {
      case 'PRICE FORECAST':
        return 'info';
      case 'DEMAND ANALYSIS':
        return 'success';
      case 'TRADE ANALYSIS':
        return 'muted';
      case 'RISK ANALYSIS':
        return 'danger';
      case 'TREND ANALYSIS':
        return 'warning';
      default:
        return 'muted';
    }
  };

  const getImpactVariant = (impact: string): 'danger' | 'warning' | 'muted' | 'success' => {
    switch (impact) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'muted';
      case 'low':
        return 'success';
      default:
        return 'muted';
    }
  };

  const getStatusVariant = (status: string): 'success' | 'info' | 'danger' | 'muted' => {
    switch (status) {
      case 'current':
        return 'success';
      case 'trending':
        return 'info';
      case 'alert':
        return 'danger';
      default:
        return 'muted';
    }
  };

  const filteredReports = reports.filter(
    (report) =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>MARKET INTELLIGENCE</Text>
          <Text style={styles.subtitle}>Agricultural market analysis and forecasting</Text>
        </View>
        <View style={styles.headerButtons}>
          <GlassButton label="New Analysis" onPress={() => {}} variant="primary" size="sm" />
          <GlassButton
            label="Filter"
            onPress={() => {}}
            variant="secondary"
            size="sm"
            leftIcon={<Filter size={14} color={COLORS.textPrimary} />}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard
          label="Total Reports"
          value={847}
          icon={<FileText size={16} color={COLORS.textSecondary} />}
          color={COLORS.textPrimary}
          style={styles.statCard}
          delay={0}
        />
        <StatCard
          label="Price Alerts"
          value={7}
          icon={<AlertTriangle size={16} color={COLORS.danger} />}
          color={COLORS.danger}
          style={styles.statCard}
          delay={60}
        />
        <StatCard
          label="Market Trends"
          value={23}
          icon={<TrendingUp size={16} color={COLORS.accentGreen} />}
          color={COLORS.accentGreen}
          style={styles.statCard}
          delay={120}
        />
      </View>

      {/* Search */}
      <GlassInput
        placeholder="Search market reports..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        leftIcon={<Search size={16} color={COLORS.textMuted} />}
        containerStyle={styles.searchInput}
      />

      {/* Reports List */}
      <GlassCard tier="medium" delay={180} noPadding>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MARKET REPORTS</Text>
        </View>
        {filteredReports.map((report, index) => (
          <TouchableOpacity
            key={report.id}
            onPress={() => setSelectedReport(report)}
            activeOpacity={0.7}
            style={[styles.reportRow, index < filteredReports.length - 1 && styles.reportBorder]}
          >
            <View style={styles.reportLeft}>
              <BarChart3 size={18} color={COLORS.textMuted} style={styles.reportIcon} />
              <View style={styles.reportMeta}>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportId}>{report.id}</Text>
                <Text style={styles.reportSummary}>{report.summary}</Text>
                <View style={styles.tagsRow}>
                  {report.tags.map((tag) => (
                    <GlassBadge
                      key={tag}
                      label={tag}
                      variant="muted"
                      size="sm"
                      style={styles.tag}
                    />
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.reportRight}>
              <GlassBadge
                label={report.category}
                variant={getCategoryVariant(report.category)}
                size="sm"
                style={styles.badge}
              />
              <GlassBadge
                label={report.impact.toUpperCase()}
                variant={getImpactVariant(report.impact)}
                size="sm"
                style={styles.badge}
              />
              <GlassBadge
                label={report.status.toUpperCase()}
                variant={getStatusVariant(report.status)}
                size="sm"
                style={styles.badge}
              />
              <View style={styles.priceRow}>
                <TrendingUp size={11} color={COLORS.accentGreen} />
                <Text style={styles.priceChange}>{report.priceChange}</Text>
              </View>
              <Text style={styles.reportDate}>{report.date}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </GlassCard>

      {/* Report Detail Modal */}
      {selectedReport && (
        <Modal
          visible={!!selectedReport}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedReport(null)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard tier="strong" style={styles.modalCard} animate={false} noPadding>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalTitle}>{selectedReport.title}</Text>
                    <Text style={styles.modalId}>{selectedReport.id}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.closeBtn}>
                    <Text style={styles.closeX}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={DIVIDER} />

                <View style={styles.modalBody}>
                  <View style={styles.modalColumns}>
                    <View style={styles.modalCol}>
                      <Text style={styles.fieldLabel}>ANALYSIS TYPE</Text>
                      <View style={styles.badgeRow}>
                        <GlassBadge
                          label={selectedReport.category}
                          variant={getCategoryVariant(selectedReport.category)}
                          style={styles.badge}
                        />
                        <GlassBadge
                          label={`IMPACT: ${selectedReport.impact.toUpperCase()}`}
                          variant={getImpactVariant(selectedReport.impact)}
                          style={styles.badge}
                        />
                      </View>

                      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>MARKET DETAILS</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Source:</Text>
                        <Text style={styles.detailVal}>{selectedReport.source}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Region:</Text>
                        <Text style={styles.detailVal}>{selectedReport.region}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Date:</Text>
                        <Text style={styles.detailVal}>{selectedReport.date}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Status:</Text>
                        <GlassBadge
                          label={selectedReport.status.toUpperCase()}
                          variant={getStatusVariant(selectedReport.status)}
                          size="sm"
                        />
                      </View>
                    </View>

                    <View style={styles.modalCol}>
                      <Text style={styles.fieldLabel}>MARKET INDICATORS</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Price Change</Text>
                        <Text style={styles.priceChangeLarge}>{selectedReport.priceChange}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Confidence Level</Text>
                        <Text style={styles.detailVal}>{selectedReport.confidence}%</Text>
                      </View>
                      <View style={styles.progressBg}>
                        <View
                          style={[styles.progressBar, { width: `${selectedReport.confidence}%` }]}
                        />
                      </View>

                      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>TAGS</Text>
                      <View style={styles.tagsRow}>
                        {selectedReport.tags.map((tag) => (
                          <GlassBadge
                            key={tag}
                            label={tag}
                            variant="muted"
                            size="sm"
                            style={styles.tag}
                          />
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={DIVIDER} />
                  <Text style={styles.fieldLabel}>EXECUTIVE SUMMARY</Text>
                  <Text style={styles.summaryText}>{selectedReport.summary}</Text>

                  <View style={DIVIDER} />
                  <View style={styles.modalActions}>
                    <GlassButton
                      label="View Full Analysis"
                      onPress={() => {}}
                      variant="primary"
                      size="sm"
                      leftIcon={<Eye size={14} color="#fff" />}
                      style={styles.modalBtn}
                    />
                    <GlassButton
                      label="Export Data"
                      onPress={() => {}}
                      variant="secondary"
                      size="sm"
                      leftIcon={<Download size={14} color={COLORS.textPrimary} />}
                      style={styles.modalBtn}
                    />
                    <GlassButton
                      label="Share Report"
                      onPress={() => {}}
                      variant="ghost"
                      size="sm"
                      style={styles.modalBtn}
                    />
                  </View>
                </View>
              </ScrollView>
            </GlassCard>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerButtons: { flexDirection: 'row', gap: 8 },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  root: { backgroundColor: 'transparent', flex: 1, padding: 16 },
  searchInput: { marginBottom: 16 },
  statCard: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  subtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  // eslint-disable-next-line react-native/sort-styles
  sectionHeader: { paddingBottom: 10, paddingHorizontal: 16, paddingTop: 14 },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  reportRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  reportBorder: { borderBottomColor: 'rgba(255,255,255,0.08)', borderBottomWidth: 1 },
  reportLeft: { flex: 3, flexDirection: 'row', gap: 10 },
  reportIcon: { marginTop: 2 },
  reportMeta: { flex: 1, gap: 4 },
  reportTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  reportId: { color: COLORS.textMuted, fontFamily: 'monospace', fontSize: 10 },
  reportSummary: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 17 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag: {},
  reportRight: { alignItems: 'flex-end', flex: 1, gap: 5 },
  badge: { alignSelf: 'flex-end' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  priceRow: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 4 },
  priceChange: {
    color: COLORS.accentGold,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  reportDate: { color: COLORS.textMuted, fontFamily: 'monospace', fontSize: 10 },
  // Modal
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: { maxHeight: '90%', maxWidth: 600, width: '100%' },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  modalHeaderText: { flex: 1 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  modalId: { color: COLORS.textMuted, fontFamily: 'monospace', fontSize: 11, marginTop: 3 },
  closeBtn: { padding: 4 },
  closeX: { color: COLORS.textSecondary, fontSize: 18 },
  modalBody: { gap: 12, padding: 20 },
  modalColumns: { flexDirection: 'row', gap: 16 },
  modalCol: { flex: 1, gap: 6 },
  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailKey: { color: COLORS.textSecondary, fontSize: 12 },
  detailVal: { color: COLORS.textPrimary, fontFamily: 'monospace', fontSize: 12 },
  priceChangeLarge: {
    color: COLORS.accentGold,
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '800',
  },
  progressBg: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 3,
    height: 6,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBar: { backgroundColor: COLORS.accentGreen, borderRadius: 3, height: '100%' },
  summaryText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  modalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalBtn: { flex: 1, minWidth: 120 },
});
