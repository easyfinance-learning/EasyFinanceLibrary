import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';
import { useCMS } from '../../hooks/useCMS';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2;

const FILTERS = ['All', 'Beginner', 'Advanced'];

export default function EBooksScreen() {
  const router = useRouter();
  const { ebooks, refreshing, refetch } = useCMS();
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = activeFilter === 'All'
    ? ebooks
    : ebooks.filter(b => b.level === activeFilter);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={Theme.background.primary} barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>eBooks Library</Text>
          <Text style={styles.headerSub}>{ebooks.length} premium guides available</Text>
        </View>
        <TouchableOpacity style={styles.syncBtn} onPress={refetch} activeOpacity={0.7}>
          <Ionicons name="refresh" size={20} color={Theme.green.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Filter Tabs ── */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterTab, 
              activeFilter === f && styles.filterTabActive
            ]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.filterText, 
              activeFilter === f && styles.filterTextActive
            ]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Books Grid ── */}
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
            tintColor={Theme.green.primary}
            colors={[Theme.green.primary]}
          />
        }
      >
        {filtered.map(book => (
          <TouchableOpacity
            key={book.id}
            style={[styles.card, { width: CARD_WIDTH }]}
            activeOpacity={0.85}
            onPress={() => router.push({
              pathname: '/book-detail',
              params: { id: book.id, type: 'ebook' }
            })}
          >
            {/* Book Cover */}
            <View style={styles.coverContainer}>
              {book.coverUrl && book.coverUrl.startsWith('http') ? (
                <Image source={{ uri: book.coverUrl }} style={styles.coverImage} />
              ) : (
                <View style={[styles.coverImage, { backgroundColor: book.bg || '#EAF5EE', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 64 }}>{book.emoji || '📖'}</Text>
                </View>
              )}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{book.tag.toUpperCase()}</Text>
              </View>
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
              <Text style={styles.bookMeta}>{book.pages} pages  •  {book.level}</Text>
              
              {/* Read Now CTA */}
              <View style={styles.readBtn}>
                <Text style={styles.readBtnText}>Read Now</Text>
                <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color={Theme.text.muted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>No books found in this category.</Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: Theme.text.primary 
  },
  headerSub: { 
    fontSize: 12, 
    color: Theme.text.secondary, 
    marginTop: 4 
  },
  syncBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Theme.background.secondary,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  filterRow: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  filterTab: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: Theme.background.secondary,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  filterTabActive: { 
    backgroundColor: Theme.green.primary,
    borderColor: Theme.green.primary,
  },
  filterText: { 
    color: Theme.text.secondary, 
    fontWeight: '600', 
    fontSize: 13 
  },
  filterTextActive: { 
    color: '#FFFFFF', 
    fontWeight: '800' 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 20, 
    gap: 12, 
    justifyContent: 'flex-start',
  },
  card: { 
    backgroundColor: Theme.background.card, 
    borderRadius: 16, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 8,
  },
  coverContainer: {
    position: 'relative',
    height: 160,
    width: '100%',
    backgroundColor: Theme.background.secondary,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badge: { 
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 6, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    backgroundColor: Theme.green.primary,
  },
  badgeText: { 
    color: '#FFFFFF', 
    fontSize: 10, 
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoContainer: {
    padding: 12,
  },
  bookTitle: { 
    fontSize: 13.5, 
    fontWeight: '800', 
    color: Theme.text.primary, 
    marginBottom: 4, 
    lineHeight: 18 
  },
  bookMeta: { 
    fontSize: 11, 
    color: Theme.text.secondary,
    marginBottom: 12,
  },
  readBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.green.primary,
    borderRadius: 10, 
    paddingVertical: 8,
    gap: 4,
  },
  readBtnText: { 
    color: '#FFFFFF', 
    fontSize: 11.5, 
    fontWeight: '800' 
  },
  emptyContainer: {
    width: '100%',
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Theme.text.muted,
    fontSize: 14,
    textAlign: 'center',
  },
});