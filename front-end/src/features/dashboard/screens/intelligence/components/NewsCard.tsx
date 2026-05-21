import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageIcon } from 'lucide-react-native';
import { GlassCard, GlassBadge, COLORS } from '@design-system';
import { formatTimeAgo } from '../../../../../utils/formatTimeAgo';

interface NewsArticle {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  source: string;
  publishedAt: string;
}

interface NewsCardProps {
  article: NewsArticle;
  onPress: (url: string) => void;
  delay?: number;
}

export const NewsCard: React.FC<NewsCardProps> = ({ article, onPress, delay = 0 }) => (
  <TouchableOpacity
    onPress={() => onPress(article.url)}
    activeOpacity={0.75}
    style={styles.wrapper}
  >
    <GlassCard tier="subtle" noPadding animate delay={delay}>
      <View style={styles.imageContainer}>
        {article.imageUrl ? (
          <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <ImageIcon size={22} color={COLORS.textMuted} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.45)']}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <GlassBadge label={article.source} variant="muted" />
          <Text style={styles.time}>{formatTimeAgo(article.publishedAt)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {article.title}
        </Text>
        {!!article.description && (
          <Text style={styles.description} numberOfLines={2}>
            {article.description}
          </Text>
        )}
      </View>
    </GlassCard>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  content: { padding: 12 },
  description: { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 17, marginTop: 4 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  image: { height: 140, width: '100%' },
  imageContainer: { borderRadius: 0, overflow: 'hidden' },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    height: 100,
    justifyContent: 'center',
  },
  time: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  title: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', lineHeight: 19 },
  wrapper: { marginBottom: 12 },
});
