import React, { useState } from 'react';
import {
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

const TOPICS = ['All', 'Mutual Funds', 'Stock Market', 'Tax Planning', 'SIP & Investing'];

export default function NewsletterScreen() {
  const router = useRouter();
  const { newsletters, refreshing, refetch } = useCMS();
  const [activeTopic, setActiveTopic] = useState('All');

  const filtered = activeTopic === 'All'
    ? newsletters
    : newsletters.filter(n => n.topic === activeTopic);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={Theme.background.primary} barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Finance Newsletters</Text>
          <Text style={styles.headerSub}>{newsletters.length} expert publications</Text>
        </View>
        <TouchableOpacity style={styles.syncBtn} onPress={refetch} activeOpacity={0.7}>
          <Ionicons name="refresh" size={20} color={Theme.green.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Topic Filter ── */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {TOPICS.map(t => (
            <TouchableOpacity
              key={t}
              style={[
                styles.filterTab, 
                activeTopic === t && styles.filterTabActive
              ]}
              onPress={() => setActiveTopic(t)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.filterText, 
                activeTopic === t && styles.filterTextActive
              ]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Newsletter List ── */}
      <ScrollView 
        contentContainerStyle={styles.list} 
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
        {filtered.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push({ 
              pathname: '/book-detail', 
              params: { id: item.id, type: 'newsletter' } 
            })}
          >
            {/* Left Thumbnail cover */}
            {item.coverUrl && item.coverUrl.startsWith('http') ? (
              <Image source={{ uri: item.coverUrl }} style={styles.thumbnailCover} />
            ) : (
              <View style={[styles.thumbnailCover, { backgroundColor: item.bg || '#EAF5EE', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 32 }}>{item.emoji || '📰'}</Text>
              </View>
            )}

            {/* Middle: Info */}
            <View style={styles.cardInfo}>
              <View style={styles.cardTopRow}>
                <Text style={styles.issueText}>{item.issue.toUpperCase()}</Text>
                {item.hot && (
                  <View style={styles.hotBadge}>
                    <Text style={styles.hotText}>NEW</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardTopic}>{item.topic}  •  {item.date}</Text>
            </View>

            {/* Right: Read CTA */}
            <TouchableOpacity
              style={styles.readBtn}
              activeOpacity={0.7}
              onPress={() => router.push({
                pathname: '/reader',
                params: { id: item.id, type: 'newsletter' }
              })}
            >
              <Text style={styles.readBtnText}>Read</Text>
              <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={48} color={Theme.text.muted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>No newsletters found on this topic.</Text>
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
  filterWrapper: { 
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  filterRow: { 
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    gap: 8,
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
  list: { 
    padding: 20, 
    gap: 12 
  },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Theme.background.card, 
    borderRadius: 16, 
    padding: 12, 
    borderWidth: 1,
    borderColor: Theme.border,
  },
  thumbnailCover: { 
    width: 55, 
    height: 72, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  cardInfo: { 
    flex: 1,
    marginLeft: 14,
  },
  cardTopRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 4 
  },
  issueText: { 
    fontSize: 11.5, 
    fontWeight: '800',
    color: Theme.green.primary,
  },
  hotBadge: { 
    backgroundColor: '#3C2215', 
    borderRadius: 4, 
    paddingHorizontal: 6, 
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FF9F0A',
  },
  hotText: { 
    color: '#FF9F0A', 
    fontSize: 8, 
    fontWeight: '800' 
  },
  cardTitle: { 
    fontSize: 14.5, 
    fontWeight: '800', 
    color: Theme.text.primary, 
    marginBottom: 4 
  },
  cardTopic: { 
    fontSize: 11, 
    color: Theme.text.secondary 
  },
  readBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.green.primary,
    borderRadius: 10, 
    paddingVertical: 10, 
    paddingHorizontal: 16,
    gap: 4,
  },
  readBtnText: { 
    color: '#FFFFFF', 
    fontSize: 13.5, 
    fontWeight: '800' 
  },
  emptyContainer: {
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