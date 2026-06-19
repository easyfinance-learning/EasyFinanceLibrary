import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { useCMS } from '../hooks/useCMS';

export default function BookDetailScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const router = useRouter();
  const { ebooks, newsletters } = useCMS();

  // Find item dynamically from CMS or local state
  const item = type === 'newsletter'
    ? newsletters.find(n => n.id === id)
    : ebooks.find(b => b.id === id);

  if (!item) {
    return (
      <SafeAreaView style={styles.errorSafe} edges={['top']}>
        <StatusBar backgroundColor={Theme.background.primary} barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF4D4D" style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>Details not found.</Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
            <Text style={styles.errorBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isNewsletter = type === 'newsletter';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={Theme.background.primary} barStyle="dark-content" />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={Theme.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerType}>{isNewsletter ? 'Newsletter Publication' : 'eBook Guide'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Visual Section ── */}
        <View style={styles.coverSection}>
          <View style={styles.coverShadow}>
            {item.coverUrl && item.coverUrl.startsWith('http') ? (
              <Image source={{ uri: item.coverUrl }} style={styles.coverImage} />
            ) : (
              <View style={[styles.coverImage, { backgroundColor: item.bg || '#EAF5EE', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 72 }}>{item.emoji || (isNewsletter ? '📰' : '📖')}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.coverTitle}>{item.title}</Text>
          <Text style={styles.coverAuthor}>by {isNewsletter ? 'Easy Finance Editorial' : 'Easy Finance Advisors'}</Text>
          
          {isNewsletter ? (
            <Text style={styles.metaLabel}>{(item as any).issue}  •  {(item as any).date}</Text>
          ) : (
            <Text style={styles.metaLabel}>{(item as any).pages} pages  •  {(item as any).readTime} read</Text>
          )}
        </View>

        {/* ── Body Content ── */}
        <View style={styles.body}>
          {/* Badges row */}
          <View style={styles.tagsRow}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>{(item as any).tag ?? (item as any).topic}</Text>
            </View>
            {!isNewsletter && (
              <View style={[styles.tagBadge, styles.levelBadge]}>
                <Text style={styles.levelBadgeText}>{(item as any).level}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.descText}>{item.description}</Text>

          {/* Value Highlights */}
          <Text style={styles.sectionTitle}>What you will learn</Text>
          <View style={styles.highlightsCard}>
            <View style={styles.highlightRow}>
              <Ionicons name="checkmark-circle" size={18} color={Theme.green.primary} style={styles.highlightIcon} />
              <Text style={styles.highlightText}>Detailed visual explanations of key terms</Text>
            </View>
            <View style={styles.highlightRow}>
              <Ionicons name="checkmark-circle" size={18} color={Theme.green.primary} style={styles.highlightIcon} />
              <Text style={styles.highlightText}>Practical steps to implement in your daily life</Text>
            </View>
            <View style={styles.highlightRow}>
              <Ionicons name="checkmark-circle" size={18} color={Theme.green.primary} style={styles.highlightIcon} />
              <Text style={styles.highlightText}>Insights backed by SEBI-registered advisory standards</Text>
            </View>
          </View>

          {/* Read Button */}
          <TouchableOpacity
            style={styles.readBtn}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/reader', params: { id, type } })}
          >
            <Ionicons name="book" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.readBtnText}>Start Reading Now</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: Theme.background.primary 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  backBtn: { 
    padding: 4 
  },
  headerType: { 
    color: Theme.text.secondary, 
    fontSize: 14, 
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  coverSection: { 
    alignItems: 'center', 
    paddingVertical: 28, 
    paddingHorizontal: 20,
    backgroundColor: Theme.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  coverShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  coverImage: { 
    width: 150, 
    height: 200, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  coverTitle: { 
    color: Theme.text.primary, 
    fontSize: 22, 
    fontWeight: '900', 
    textAlign: 'center',
    lineHeight: 28, 
    marginBottom: 6 
  },
  coverAuthor: { 
    color: Theme.text.secondary, 
    fontSize: 13,
    marginBottom: 12,
  },
  metaLabel: { 
    color: Theme.green.primary, 
    fontSize: 14, 
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  body: { 
    padding: 20 
  },
  tagsRow: { 
    flexDirection: 'row', 
    gap: 8, 
    marginBottom: 24 
  },
  tagBadge: { 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 6,
    backgroundColor: '#EAF5EE',
    borderWidth: 1,
    borderColor: Theme.green.primary,
  },
  tagBadgeText: { 
    color: Theme.green.primary, 
    fontSize: 13, 
    fontWeight: '800' 
  },
  levelBadge: {
    backgroundColor: Theme.background.secondary,
    borderColor: Theme.border,
  },
  levelBadgeText: {
    color: Theme.text.secondary,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: Theme.text.primary, 
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  descText: { 
    fontSize: 13.5, 
    color: Theme.text.secondary, 
    lineHeight: 22, 
    marginBottom: 24 
  },
  highlightsCard: {
    backgroundColor: Theme.background.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 28,
    gap: 12,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightIcon: {
    marginRight: 10,
  },
  highlightText: {
    fontSize: 12.5,
    color: Theme.text.secondary,
    fontWeight: '600',
    flex: 1,
  },
  readBtn: { 
    flexDirection: 'row',
    backgroundColor: Theme.green.primary,
    borderRadius: 14, 
    paddingVertical: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  readBtnText: { 
    color: '#FFFFFF', 
    fontSize: 15.5, 
    fontWeight: '900' 
  },
  errorSafe: {
    flex: 1,
    backgroundColor: Theme.background.primary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    color: Theme.text.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
  },
  errorBtn: {
    backgroundColor: Theme.green.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  errorBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});