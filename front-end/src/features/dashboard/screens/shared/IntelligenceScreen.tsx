"use client"

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
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

import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/Card';
import { Badge } from '@shared/components/Badge';
import { Button } from '@shared/components/Button';

interface IntelligenceScreenProps {
  id?: string;
}

export default function IntelligenceScreen({ id }: IntelligenceScreenProps = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  const reports = [
    {
      id: 'MKT-2025-001',
      title: 'CORN FUTURES PRICE ANALYSIS',
      category: 'PRICE FORECAST',
      source: 'MARKET DATA',
      region: 'Midwest USA',
      date: '2025-06-17',
      status: 'current',
      impact: 'high',
      summary: 'Detailed analysis of corn futures showing 15% price increase expected due to weather conditions',
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
      summary: 'Consumer demand for organic produce increased 28% quarter-over-quarter in major metropolitan areas',
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
      summary: 'Extended drought conditions threatening crop yields across multiple agricultural regions',
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
      summary: 'Growing adoption of sustainable farming practices creating new market opportunities',
      tags: ['sustainability', 'trends', 'innovation', 'practices'],
      priceChange: '+5.2%',
      confidence: 71,
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PRICE FORECAST':
        return 'bg-blue-500/20 text-blue-500';
      case 'DEMAND ANALYSIS':
        return 'bg-green-500/20 text-green-500';
      case 'TRADE ANALYSIS':
        return 'bg-purple-500/20 text-purple-500';
      case 'RISK ANALYSIS':
        return 'bg-red-500/20 text-red-500';
      case 'TREND ANALYSIS':
        return 'bg-orange-500/20 text-orange-500';
      default:
        return 'bg-neutral-500/20 text-neutral-300';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-500/20 text-red-500';
      case 'high':
        return 'bg-orange-500/20 text-orange-500';
      case 'medium':
        return 'bg-neutral-500/20 text-neutral-300';
      case 'low':
        return 'bg-green-500/20 text-green-500';
      default:
        return 'bg-neutral-500/20 text-neutral-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-green-500/20 text-green-500';
      case 'trending':
        return 'bg-blue-500/20 text-blue-500';
      case 'alert':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-neutral-500/20 text-neutral-300';
    }
  };

  const filteredReports = reports.filter(
    (report) =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <ScrollView className="flex-1 p-6 space-y-6">
      {/* Header */}
      <View className="flex-col gap-4">
        <View>
          <Text className="text-2xl font-bold text-white tracking-wider">
            MARKET INTELLIGENCE
          </Text>
          <Text className="text-sm text-neutral-400">
            Agricultural market analysis and forecasting
          </Text>
        </View>
        <View className="flex-row gap-2">
          <Button className="bg-green-600">
            <Text className="text-white">New Analysis</Text>
          </Button>
          <Button className="bg-green-600 flex-row items-center gap-2">
            <Filter color="#ffffff" size={16} />
            <Text className="text-white">Filter</Text>
          </Button>
        </View>
      </View>

      {/* Stats and Search */}
      <View className="flex-row flex-wrap gap-4">
        {/* Search Card */}
        <View className="flex-1 min-w-[200px]">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <View className="relative">
                <Search 
                  color="#9CA3AF" 
                  size={16} 
                  style={{ position: 'absolute', left: 12, top: 12, zIndex: 10 }}
                />
                <TextInput
                  placeholder="Search market reports..."
                  placeholderTextColor="#9CA3AF"
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  className="pl-10 bg-neutral-800 border border-neutral-600 text-white placeholder:text-neutral-400 rounded p-3"
                />
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Stats Cards */}
        <View className="flex-1 min-w-[120px]">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-neutral-400 tracking-wider">
                    TOTAL REPORTS
                  </Text>
                  <Text className="text-2xl font-bold text-white font-mono">847</Text>
                </View>
                <FileText color="#ffffff" size={32} />
              </View>
            </CardContent>
          </Card>
        </View>

        <View className="flex-1 min-w-[120px]">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-neutral-400 tracking-wider">
                    PRICE ALERTS
                  </Text>
                  <Text className="text-2xl font-bold text-red-500 font-mono">7</Text>
                </View>
                <AlertTriangle color="#ef4444" size={32} />
              </View>
            </CardContent>
          </Card>
        </View>

        <View className="flex-1 min-w-[120px]">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-neutral-400 tracking-wider">
                    MARKET TRENDS
                  </Text>
                  <Text className="text-2xl font-bold text-white font-mono">23</Text>
                </View>
                <TrendingUp color="#22c55e" size={32} />
              </View>
            </CardContent>
          </Card>
        </View>
      </View>

      {/* Market Intelligence Reports */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <Text className="text-sm font-medium text-neutral-300 tracking-wider">
            MARKET REPORTS
          </Text>
        </CardHeader>
        <CardContent>
          <View className="space-y-4">
            {filteredReports.map((report) => (
              <TouchableOpacity
                key={report.id}
                onPress={() => setSelectedReport(report)}
                className="border border-neutral-700 rounded p-4 bg-neutral-800"
                activeOpacity={0.7}
              >
                <View className="flex-col gap-4">
                  <View className="flex-1 space-y-2">
                    <View className="flex-row items-start gap-3">
                      <BarChart3 color="#9CA3AF" size={20} />
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-white tracking-wider">
                          {report.title}
                        </Text>
                        <Text className="text-xs text-neutral-400 font-mono">
                          {report.id}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-sm text-neutral-300 ml-8">
                      {report.summary}
                    </Text>

                    <View className="flex-row flex-wrap gap-2 ml-8">
                      {report.tags.map((tag) => (
                        <Badge key={tag} className="bg-neutral-800 text-neutral-300 text-xs">
                          <Text className="text-neutral-300">{tag}</Text>
                        </Badge>
                      ))}
                    </View>
                  </View>

                  <View className="flex-col items-end gap-2">
                    <View className="flex-row flex-wrap gap-2">
                      <Badge className={getCategoryColor(report.category)}>
                        <Text>{report.category}</Text>
                      </Badge>
                      <Badge className={getImpactColor(report.impact)}>
                        <Text>{report.impact.toUpperCase()}</Text>
                      </Badge>
                      <Badge className={getStatusColor(report.status)}>
                        <Text>{report.status.toUpperCase()}</Text>
                      </Badge>
                    </View>

                    <View className="flex-col gap-1">
                      <View className="flex-row items-center gap-2">
                        <TrendingUp color="#22c55e" size={12} />
                        <Text className="text-green-400 font-mono text-xs">
                          {report.priceChange}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <BarChart3 color="#9CA3AF" size={12} />
                        <Text className="text-neutral-400 text-xs">{report.region}</Text>
                      </View>
                      <Text className="font-mono text-xs text-neutral-400">
                        {report.date}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      {selectedReport && (
        <Modal
          visible={!!selectedReport}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedReport(null)}
        >
          <View className="flex-1 bg-black/50 items-center justify-center p-4">
            <ScrollView className="bg-neutral-900 border border-neutral-700 w-full max-w-4xl max-h-[90%] rounded-lg">
              <View className="flex-row items-center justify-between p-6 border-b border-neutral-700">
                <View>
                  <Text className="text-xl font-bold text-white tracking-wider">
                    {selectedReport.title}
                  </Text>
                  <Text className="text-sm text-neutral-400 font-mono">
                    {selectedReport.id}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedReport(null)}
                  className="p-2"
                >
                  <Text className="text-neutral-400 text-xl">✕</Text>
                </TouchableOpacity>
              </View>

              <View className="p-6 space-y-6">
                <View className="flex-row gap-6">
                  <View className="flex-1 space-y-4">
                    <View>
                      <Text className="text-sm font-medium text-neutral-300 tracking-wider mb-2">
                        ANALYSIS TYPE
                      </Text>
                      <View className="flex-row gap-2">
                        <Badge className={getCategoryColor(selectedReport.category)}>
                          <Text>{selectedReport.category}</Text>
                        </Badge>
                        <Badge className={getImpactColor(selectedReport.impact)}>
                          <Text>IMPACT: {selectedReport.impact.toUpperCase()}</Text>
                        </Badge>
                      </View>
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-neutral-300 tracking-wider mb-2">
                        MARKET DETAILS
                      </Text>
                      <View className="space-y-2">
                        <View className="flex-row justify-between">
                          <Text className="text-neutral-400">Data Source:</Text>
                          <Text className="text-white font-mono">{selectedReport.source}</Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-neutral-400">Region:</Text>
                          <Text className="text-white">{selectedReport.region}</Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-neutral-400">Date:</Text>
                          <Text className="text-white font-mono">{selectedReport.date}</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                          <Text className="text-neutral-400">Status:</Text>
                          <Badge className={getStatusColor(selectedReport.status)}>
                            <Text>{selectedReport.status.toUpperCase()}</Text>
                          </Badge>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="flex-1 space-y-4">
                    <View>
                      <Text className="text-sm font-medium text-neutral-300 tracking-wider mb-2">
                        MARKET INDICATORS
                      </Text>
                      <View className="space-y-3">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-neutral-400 text-sm">Price Change</Text>
                          <Text className="text-green-400 font-mono text-lg">
                            {selectedReport.priceChange}
                          </Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                          <Text className="text-neutral-400 text-sm">Confidence Level</Text>
                          <Text className="text-white font-mono">
                            {selectedReport.confidence}%
                          </Text>
                        </View>
                        <View className="w-full bg-neutral-800 rounded-full h-2">
                          <View
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${selectedReport.confidence}%` }}
                          />
                        </View>
                      </View>
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-neutral-300 tracking-wider mb-2">
                        TAGS
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {selectedReport.tags.map((tag) => (
                          <Badge key={tag} className="bg-neutral-800 text-neutral-300">
                            <Text className="text-neutral-300">{tag}</Text>
                          </Badge>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-medium text-neutral-300 tracking-wider mb-2">
                    EXECUTIVE SUMMARY
                  </Text>
                  <Text className="text-sm text-neutral-300 leading-relaxed">
                    {selectedReport.summary}
                  </Text>
                </View>

                <View className="flex-row gap-2 pt-4 border-t border-neutral-700">
                  <Button className="bg-green-600 flex-row items-center gap-2">
                    <Eye color="#ffffff" size={16} />
                    <Text className="text-white">View Full Analysis</Text>
                  </Button>
                  <Button className="border border-neutral-700 text-neutral-400 bg-transparent flex-row items-center gap-2">
                    <Download color="#9CA3AF" size={16} />
                    <Text className="text-neutral-400">Export Data</Text>
                  </Button>
                  <Button className="border border-neutral-700 text-neutral-400 bg-transparent">
                    <Text className="text-neutral-400">Share Report</Text>
                  </Button>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}