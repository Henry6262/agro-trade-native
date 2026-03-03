import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import {
  Check,
  X,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react-native';

import { SpecificationMatch, MatchType, BuyerSpecification, OfferSpecification } from '../types';

interface SpecificationComparisonProps {
  buyerRequirements: string[]; // From existing data structure
  offerSpecifications: any[]; // From existing data structure
  className?: string;
  showHeader?: boolean;
}

export const SpecificationComparison: React.FC<SpecificationComparisonProps> = ({
  buyerRequirements = [],
  offerSpecifications = [],
  className = '',
  showHeader = true,
}) => {
  // Transform existing data into comparison structure
  const generateSpecificationMatches = (): SpecificationMatch[] => {
    const matches: SpecificationMatch[] = [];

    // Process buyer requirements
    buyerRequirements.forEach((requirement) => {
      const reqParts = requirement.split(':');
      const reqName = reqParts[0]?.trim() || requirement;
      const reqValue = reqParts[1]?.trim() || '';

      // Try to find matching offer specification
      const matchingOfferSpec = offerSpecifications.find(
        (offerSpec) =>
          offerSpec.name?.toLowerCase().includes(reqName.toLowerCase()) ||
          reqName.toLowerCase().includes(offerSpec.name?.toLowerCase()) ||
          offerSpec.valueText?.toLowerCase().includes(reqName.toLowerCase())
      );

      let matchType: MatchType = 'missing';
      let score = 0;
      let message = '';

      if (matchingOfferSpec) {
        const offerValue =
          matchingOfferSpec.valueText ||
          matchingOfferSpec.valueNumber?.toString() ||
          matchingOfferSpec.value;

        if (reqValue && offerValue) {
          // Try to compare values
          if (reqValue.toLowerCase() === offerValue.toLowerCase()) {
            matchType = 'exact';
            score = 100;
            message = 'Perfect match';
          } else if (isNumericComparison(reqValue, offerValue)) {
            const comparison = compareNumericValues(reqValue, offerValue);
            matchType = comparison.type;
            score = comparison.score;
            message = comparison.message;
          } else {
            // Text comparison - check if similar
            const similarity = calculateTextSimilarity(reqValue, offerValue);
            if (similarity > 0.7) {
              matchType = 'close';
              score = 85;
              message = 'Very similar';
            } else if (similarity > 0.4) {
              matchType = 'partial';
              score = 60;
              message = 'Partially matches';
            } else {
              matchType = 'partial';
              score = 30;
              message = 'Different specification';
            }
          }
        } else {
          matchType = 'partial';
          score = 50;
          message = 'Specification provided but no comparison value';
        }
      }

      matches.push({
        specification: {
          id: `req_${matches.length}`,
          name: reqName,
          requiredValue: reqValue,
          category: 'quality',
          priority: 'required',
        } as BuyerSpecification,
        offerValue: matchingOfferSpec
          ? ({
              id: `offer_${matches.length}`,
              name: matchingOfferSpec.name || reqName,
              value:
                matchingOfferSpec.valueText ||
                matchingOfferSpec.valueNumber ||
                matchingOfferSpec.value ||
                'N/A',
              category: 'quality',
              matchesRequirement: matchType === 'exact' || matchType === 'close',
            } as OfferSpecification)
          : undefined,
        matchType,
        score,
        message,
      });
    });

    // Add offer specifications that don't match any requirements
    offerSpecifications.forEach((offerSpec) => {
      const alreadyMatched = matches.some(
        (match) =>
          match.offerValue?.name === offerSpec.name ||
          offerSpec.name?.toLowerCase().includes(match.specification.name.toLowerCase())
      );

      if (!alreadyMatched && offerSpec.name) {
        matches.push({
          specification: {
            id: `additional_${matches.length}`,
            name: offerSpec.name,
            requiredValue: 'Not specified',
            category: 'other',
            priority: 'optional',
          } as BuyerSpecification,
          offerValue: {
            id: `offer_additional_${matches.length}`,
            name: offerSpec.name,
            value: offerSpec.valueText || offerSpec.valueNumber || offerSpec.value || 'N/A',
            category: 'other',
            matchesRequirement: false,
          } as OfferSpecification,
          matchType: 'exceeded',
          score: 20,
          message: 'Additional specification provided',
        });
      }
    });

    return matches;
  };

  const isNumericComparison = (req: string, offer: string): boolean => {
    const reqNum = extractNumber(req);
    const offerNum = extractNumber(offer);
    return reqNum !== null && offerNum !== null;
  };

  const extractNumber = (text: string): number | null => {
    const match = text.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  };

  const compareNumericValues = (req: string, offer: string) => {
    const reqNum = extractNumber(req);
    const offerNum = extractNumber(offer);

    if (reqNum === null || offerNum === null) {
      return { type: 'partial' as MatchType, score: 40, message: 'Could not compare values' };
    }

    const difference = Math.abs(reqNum - offerNum);
    const percentageDiff = (difference / reqNum) * 100;

    if (percentageDiff === 0) {
      return { type: 'exact' as MatchType, score: 100, message: 'Exact match' };
    } else if (percentageDiff <= 5) {
      return {
        type: 'close' as MatchType,
        score: 90,
        message: `Very close (${percentageDiff.toFixed(1)}% diff)`,
      };
    } else if (percentageDiff <= 15) {
      return {
        type: 'partial' as MatchType,
        score: 70,
        message: `Acceptable (${percentageDiff.toFixed(1)}% diff)`,
      };
    } else {
      return {
        type: 'partial' as MatchType,
        score: 40,
        message: `Significant difference (${percentageDiff.toFixed(1)}% diff)`,
      };
    }
  };

  const calculateTextSimilarity = (a: string, b: string): number => {
    const normalize = (str: string) => str.toLowerCase().replace(/[^\w]/g, '');
    const normA = normalize(a);
    const normB = normalize(b);

    if (normA === normB) return 1;
    if (normA.length === 0 || normB.length === 0) return 0;

    // Simple similarity based on common characters
    const shorter = normA.length < normB.length ? normA : normB;
    const longer = normA.length < normB.length ? normB : normA;

    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) {
        matches++;
      }
    }

    return matches / longer.length;
  };

  const getMatchIcon = (matchType: MatchType) => {
    switch (matchType) {
      case 'exact':
        return <Check size={16} color="#10B981" />;
      case 'close':
        return <Check size={16} color="#10B981" />;
      case 'partial':
        return <AlertTriangle size={16} color="#FBBF24" />;
      case 'exceeded':
        return <TrendingUp size={16} color="#3B82F6" />;
      case 'missing':
        return <X size={16} color="#EF4444" />;
      default:
        return <Minus size={16} color="#6B7280" />;
    }
  };

  const getMatchColors = (matchType: MatchType) => {
    switch (matchType) {
      case 'exact':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          text: 'text-green-400',
          label: 'text-green-300',
        };
      case 'close':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          text: 'text-green-400',
          label: 'text-green-300',
        };
      case 'partial':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
          label: 'text-yellow-300',
        };
      case 'exceeded':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          label: 'text-blue-300',
        };
      case 'missing':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-400',
          label: 'text-red-300',
        };
      default:
        return {
          bg: 'bg-neutral-500/10',
          border: 'border-neutral-500/30',
          text: 'text-gray-500',
          label: 'text-gray-600',
        };
    }
  };

  const specificationMatches = generateSpecificationMatches();
  const overallScore =
    specificationMatches.length > 0
      ? Math.round(
          specificationMatches.reduce((sum, match) => sum + match.score, 0) /
            specificationMatches.length
        )
      : 0;

  return (
    <View className={`${className}`}>
      {showHeader && (
        <View className="mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-900 font-semibold text-lg">Specification Comparison</Text>
            <View className="bg-gradient-to-r from-blue-500/20 to-green-500/20 px-3 py-1 rounded-lg border border-blue-500/30">
              <Text className="text-blue-400 font-bold text-sm">{overallScore}% Overall Match</Text>
            </View>
          </View>
          <Text className="text-gray-500 text-sm mt-1">
            Comparing your requirements with seller&apos;s offer
          </Text>
        </View>
      )}

      <ScrollView
        className="max-h-80"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <View className="space-y-3">
          {specificationMatches.map((match, index) => {
            const colors = getMatchColors(match.matchType);

            return (
              <View key={index} className={`${colors.bg} ${colors.border} border rounded-lg p-3`}>
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      {getMatchIcon(match.matchType)}
                      <Text className={`${colors.text} font-medium text-sm ml-2`}>
                        {match.specification.name}
                      </Text>
                    </View>
                    {match.message && (
                      <Text className={`${colors.label} text-xs mt-1`}>{match.message}</Text>
                    )}
                  </View>
                  <View
                    className={`px-2 py-1 rounded ${colors.bg} ${colors.border} border-opacity-50`}
                  >
                    <Text className={`${colors.text} text-xs font-bold`}>{match.score}%</Text>
                  </View>
                </View>

                <View className="flex-row justify-between mt-2">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-500 text-xs mb-1">Your Requirement</Text>
                    <View className="bg-gray-50/50 rounded px-2 py-1">
                      <Text className="text-gray-600 text-xs">
                        {match.specification.requiredValue || 'Not specified'}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-500 text-xs mb-1">Seller&apos;s Offer</Text>
                    <View className="bg-gray-50/50 rounded px-2 py-1">
                      <Text className="text-gray-600 text-xs">
                        {match.offerValue?.value?.toString() || 'Not provided'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}

          {specificationMatches.length === 0 && (
            <View className="bg-gray-50/50 rounded-lg p-6 items-center border border-gray-200/50">
              <Info size={24} color="#6B7280" />
              <Text className="text-gray-500 font-medium mt-2">No Specifications to Compare</Text>
              <Text className="text-gray-400 text-sm text-center mt-1">
                No detailed specifications provided for comparison
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
