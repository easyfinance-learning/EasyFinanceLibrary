import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { Theme } from '../../constants/theme';
import { useCMS } from '../../hooks/useCMS';

export default function HomeScreen() {
  const router = useRouter();
  const { ebooks, newsletters, refreshing, refetch } = useCMS();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Dynamic Continue Reading state
  const [lastRead, setLastRead] = useState<{
    id: string;
    type: 'ebook' | 'newsletter';
    title: string;
    page: number;
    total: number;
    coverUrl?: string;
  } | null>(null);

  // Favorites Count
  const [favoritesCount, setFavoritesCount] = useState(0);
  
  // User initial matching header avatar
  const [userInitial, setUserInitial] = useState('U');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.displayName) {
          setUserInitial(user.displayName.charAt(0).toUpperCase());
        } else if (user.email) {
          const nameFromEmail = user.email.split('@')[0];
          setUserInitial(nameFromEmail.charAt(0).toUpperCase());
        }
      } else {
        AsyncStorage.getItem('userEmail').then(email => {
          if (email) {
            const nameFromEmail = email.split('@')[0];
            setUserInitial(nameFromEmail.charAt(0).toUpperCase());
          }
        });
      }
    });
    return unsubscribe;
  }, []);

  const loadDashboardStats = useCallback(async () => {
    try {
      // Load last read
      const lastReadJson = await AsyncStorage.getItem('last_read_item');
      if (lastReadJson) {
        const parsed = JSON.parse(lastReadJson);
        // Find fresh item in lists to ensure matching cover URL
        const matched = parsed.type === 'newsletter'
          ? newsletters.find((n) => n.id === parsed.id)
          : ebooks.find((b) => b.id === parsed.id);
        
        if (matched) {
          setLastRead({
            id: parsed.id,
            type: parsed.type,
            title: matched.title,
            page: parsed.page,
            total: parsed.total,
            coverUrl: matched.coverUrl,
          });
        }
      } else if (ebooks.length > 0) {
        // Fallback to first book as suggestion
        setLastRead({
          id: ebooks[0].id,
          type: 'ebook',
          title: ebooks[0].title,
          page: 1,
          total: ebooks[0].pages || 5,
          coverUrl: ebooks[0].coverUrl,
        });
      }

      // Load favorites count
      const bookmarksJson = await AsyncStorage.getItem('bookmarks_data');
      if (bookmarksJson) {
        const bookmarks = JSON.parse(bookmarksJson);
        const count = Object.values(bookmarks).reduce((acc: number, curr: any) => acc + (curr?.length || 0), 0);
        setFavoritesCount(count);
      }
    } catch (e) {
      console.warn('Error loading dashboard stats:', e);
    }
  }, [ebooks, newsletters]);

  // Load last read item and favorites count
  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  // Filter items based on search query
  const filteredEbooks = ebooks.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNewsletters = newsletters.filter(letter =>
    letter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    letter.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={Theme.background.primary} barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/images/easy-finance-logo.png')}
            style={styles.logoMascot}
            resizeMode="contain"
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerBrandGreen}>Easy Finance</Text>
            <Text style={styles.headerBrandWhite}>Library</Text>
            <Text style={styles.headerTagline}>LEARN • PLAN • GROW</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.avatarBtn} 
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{userInitial}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
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
        {/* ── Search Bar with Glow effect ── */}
        <View style={[
          styles.searchBox,
          isSearchFocused && styles.searchBoxFocused
        ]}>
          <Ionicons name="search" size={20} color={isSearchFocused ? Theme.green.primary : Theme.text.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books, newsletters, topics..."
            placeholderTextColor={Theme.text.muted}
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Theme.text.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {searchQuery ? (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>Search Results for {`"${searchQuery}"`}</Text>
            
            {filteredEbooks.length === 0 && filteredNewsletters.length === 0 ? (
              <View style={styles.emptySearch}>
                <Ionicons name="search-outline" size={48} color={Theme.text.muted} style={{ marginBottom: 12 }} />
                <Text style={styles.emptySearchText}>No results found. Try another query.</Text>
              </View>
            ) : null}

            {filteredEbooks.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={styles.searchSectionTitle}>eBooks</Text>
                {filteredEbooks.map(book => (
                  <TouchableOpacity
                    key={book.id}
                    style={styles.searchResultCard}
                    activeOpacity={0.8}
                    onPress={() => router.push({
                      pathname: '/book-detail',
                      params: { id: book.id, type: 'ebook' }
                    })}
                  >
                    {book.coverUrl && book.coverUrl.startsWith('http') ? (
                      <Image source={{ uri: book.coverUrl }} style={styles.searchResultCover} />
                    ) : (
                      <View style={[styles.searchResultCover, { backgroundColor: book.bg || '#EAF5EE', alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ fontSize: 24 }}>{book.emoji || '📖'}</Text>
                      </View>
                    )}
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName} numberOfLines={1}>{book.title}</Text>
                      <Text style={styles.searchResultDesc} numberOfLines={2}>{book.description}</Text>
                      <Text style={styles.searchResultMeta}>{book.pages} pages • {book.level}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {filteredNewsletters.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={styles.searchSectionTitle}>Newsletters</Text>
                {filteredNewsletters.map(letter => (
                  <TouchableOpacity
                    key={letter.id}
                    style={styles.searchResultCard}
                    activeOpacity={0.8}
                    onPress={() => router.push({
                      pathname: '/book-detail',
                      params: { id: letter.id, type: 'newsletter' }
                    })}
                  >
                    {letter.coverUrl && letter.coverUrl.startsWith('http') ? (
                      <Image source={{ uri: letter.coverUrl }} style={styles.searchResultCover} />
                    ) : (
                      <View style={[styles.searchResultCover, { backgroundColor: letter.bg || '#EAF5EE', alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ fontSize: 24 }}>{letter.emoji || '📰'}</Text>
                      </View>
                    )}
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName} numberOfLines={1}>{letter.title} - {letter.issue}</Text>
                      <Text style={styles.searchResultDesc} numberOfLines={2}>{letter.description}</Text>
                      <Text style={styles.searchResultMeta}>{letter.date} • {letter.topic}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* ── Continue Reading Card ── */}
            {lastRead && (
              <TouchableOpacity
                style={styles.continueCard}
                activeOpacity={0.9}
                onPress={() => router.push({
                  pathname: '/reader',
                  params: { id: lastRead.id, type: lastRead.type }
                })}
              >
                <View style={styles.continueLeft}>
                  <View style={styles.continueBadge}>
                    <Text style={styles.continueBadgeText}>CONTINUE READING</Text>
                  </View>
                  <Text style={styles.continueTitle} numberOfLines={2}>{lastRead.title}</Text>
                  <Text style={styles.continueSubtitle}>
                    Last read: Section {lastRead.page} of {lastRead.total}
                  </Text>
                  <View style={styles.continueBtn}>
                    <Ionicons name="play" size={14} color={Theme.background.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.continueBtnText}>Resume Reading</Text>
                  </View>
                </View>
                <View style={styles.continueRight}>
                  {lastRead.coverUrl && lastRead.coverUrl.startsWith('http') ? (
                    <Image source={{ uri: lastRead.coverUrl }} style={styles.continueCover} />
                  ) : (
                    <View style={styles.continuePlaceholderCover}>
                      <Text style={{ fontSize: 32 }}>📖</Text>
                    </View>
                  )}
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBg}>
                      <View style={[
                        styles.progressBarFill, 
                        {
                          width: `${
                            lastRead.total && !isNaN(lastRead.total) && lastRead.total > 0 && lastRead.page && !isNaN(lastRead.page)
                              ? Math.min(100, Math.max(10, (lastRead.page / lastRead.total) * 100))
                              : 10
                          }%`
                        }
                      ]} />
                    </View>
                    <Text style={styles.progressText}>
                      {lastRead.total && !isNaN(lastRead.total) && lastRead.total > 0 && lastRead.page && !isNaN(lastRead.page)
                        ? Math.round((lastRead.page / lastRead.total) * 100)
                        : 0}% complete
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* ── Quick Access Grid ── */}
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.quickAccessGrid}>
              <TouchableOpacity
                style={[styles.shortcutCard, { flex: 0.8 }]}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/ebooks')}
              >
                <View style={[styles.shortcutIconContainer, { backgroundColor: '#EAF5EE' }]}>
                  <Ionicons name="book" size={26} color={Theme.green.primary} />
                </View>
                <Text style={styles.shortcutCount}>{ebooks.length}</Text>
                <Text style={styles.shortcutLabel}>eBooks</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutCard, { flex: 1.2 }]}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/newsletters')}
              >
                <View style={[styles.shortcutIconContainer, { backgroundColor: '#FFF6E5' }]}>
                  <Ionicons name="newspaper" size={26} color="#FF9F0A" />
                </View>
                <Text style={styles.shortcutCount}>{newsletters.length}</Text>
                <Text style={styles.shortcutLabel}>Newsletters</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shortcutCard, { flex: 1.0 }]}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <View style={[styles.shortcutIconContainer, { backgroundColor: '#F9EFFF' }]}>
                  <Ionicons name="bookmark" size={26} color="#BF5AF2" />
                </View>
                <Text style={styles.shortcutCount}>{favoritesCount}</Text>
                <Text style={styles.shortcutLabel}>Bookmarks</Text>
              </TouchableOpacity>
            </View>

            {/* ── Latest eBooks (Netflix/Kindle Style) ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured eBooks</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/ebooks')} activeOpacity={0.7}>
                <Text style={styles.viewAllBtn}>See All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={ebooks}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.ebookCoverCard}
                  activeOpacity={0.85}
                  onPress={() => router.push({
                    pathname: '/book-detail',
                    params: { id: item.id, type: 'ebook' }
                  })}
                >
                  {item.coverUrl && item.coverUrl.startsWith('http') ? (
                    <Image source={{ uri: item.coverUrl }} style={styles.ebookCardCover} />
                  ) : (
                    <View style={[styles.ebookCardCover, { backgroundColor: item.bg || '#EAF5EE', alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 48 }}>{item.emoji || '📖'}</Text>
                    </View>
                  )}
                  <View style={styles.ebookCardDetails}>
                    <View style={styles.ebookCardTag}>
                      <Text style={styles.ebookCardTagText}>{item.tag.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.ebookCardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.ebookCardMeta}>{item.pages} pages • {item.level}</Text>
                    <View style={styles.ebookReadNow}>
                      <Text style={styles.ebookReadNowText}>Read Now</Text>
                      <Ionicons name="arrow-forward" size={12} color={Theme.green.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />

            {/* ── Latest Newsletters ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Newsletters</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/newsletters')} activeOpacity={0.7}>
                <Text style={styles.viewAllBtn}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.newsletterList}>
              {newsletters.slice(0, 3).map((letter) => (
                <TouchableOpacity
                  key={letter.id}
                  style={styles.newsletterItemCard}
                  activeOpacity={0.8}
                  onPress={() => router.push({
                    pathname: '/book-detail',
                    params: { id: letter.id, type: 'newsletter' }
                  })}
                >
                  {letter.coverUrl && letter.coverUrl.startsWith('http') ? (
                    <Image source={{ uri: letter.coverUrl }} style={styles.newsletterItemCover} />
                  ) : (
                    <View style={[styles.newsletterItemCover, { backgroundColor: letter.bg || '#EAF5EE', alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 24 }}>{letter.emoji || '📰'}</Text>
                    </View>
                  )}
                  <View style={styles.newsletterItemContent}>
                    <Text style={styles.newsletterItemTopic}>{letter.topic.toUpperCase()}</Text>
                    <Text style={styles.newsletterItemTitle} numberOfLines={1}>{letter.title}</Text>
                    <Text style={styles.newsletterItemIssue}>{letter.issue} • {letter.date}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.newsletterItemBtn}
                    activeOpacity={0.7}
                    onPress={() => router.push({
                      pathname: '/reader',
                      params: { id: letter.id, type: 'newsletter' }
                    })}
                  >
                    <Text style={styles.newsletterItemBtnText}>Read</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Pro Premium Banner Removed ── */}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Theme.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
    backgroundColor: Theme.background.secondary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  notificationBtn: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Theme.green.primary,
    borderRadius: 7,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  logoMascot: {
    width: 134,
    height: 134,
  },
  headerTextContainer: {
    flexDirection: 'column',
  },
  headerBrandGreen: {
    fontSize: 22,
    fontWeight: '900',
    color: Theme.green.primary,
  },
  headerBrandWhite: {
    fontSize: 22,
    fontWeight: '900',
    color: Theme.text.primary,
    marginTop: -2,
  },
  headerTagline: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.text.muted,
    letterSpacing: 1.2,
    marginTop: 4,
  },
  avatarBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Theme.green.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
    backgroundColor: Theme.background.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.background.secondary,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  searchBoxFocused: {
    borderColor: Theme.green.primary,
    shadowColor: Theme.green.primary,
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Theme.text.primary,
    padding: 0,
  },
  
  // Search Results Styles
  searchResultsContainer: {
    flex: 1,
  },
  searchResultsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.text.primary,
    marginBottom: 16,
  },
  searchSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.green.primary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  searchResultCard: {
    flexDirection: 'row',
    backgroundColor: Theme.background.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  searchResultCover: {
    width: 60,
    height: 80,
    borderRadius: 8,
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.text.primary,
    marginBottom: 4,
  },
  searchResultDesc: {
    fontSize: 13,
    color: Theme.text.muted,
    marginBottom: 6,
    lineHeight: 16,
  },
  searchResultMeta: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.green.primary,
  },
  emptySearch: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySearchText: {
    color: Theme.text.muted,
    fontSize: 15,
    textAlign: 'center',
  },

  // Continue Card
  continueCard: {
    backgroundColor: '#EAF5EE',
    borderWidth: 1,
    borderColor: '#D0E8DB',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  continueLeft: {
    flex: 1.2,
    paddingRight: 10,
  },
  continueBadge: {
    backgroundColor: Theme.green.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  continueBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  continueTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Theme.text.primary,
    lineHeight: 25,
    marginBottom: 6,
  },
  continueSubtitle: {
    fontSize: 13,
    color: Theme.text.secondary,
    marginBottom: 16,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.green.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  continueRight: {
    flex: 0.8,
    alignItems: 'center',
  },
  continueCover: {
    width: 70,
    height: 95,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D0E8DB',
  },
  continuePlaceholderCover: {
    width: 70,
    height: 95,
    borderRadius: 8,
    backgroundColor: Theme.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D0E8DB',
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarBg: {
    width: 80,
    height: 4,
    backgroundColor: '#D0E8DB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Theme.green.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: Theme.text.muted,
    marginTop: 4,
    fontWeight: '600',
  },

  // Headings
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: Theme.text.primary,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  viewAllBtn: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.green.primary,
  },

  // Quick Access
  quickAccessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 12,
  },
  shortcutCard: {
    backgroundColor: Theme.background.card,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shortcutCount: {
    fontSize: 21,
    fontWeight: '800',
    color: Theme.text.primary,
    marginBottom: 2,
  },
  shortcutLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.text.muted,
  },

  // Horizontal lists
  horizontalList: {
    paddingRight: 20,
    marginBottom: 28,
    gap: 16,
  },
  ebookCoverCard: {
    width: 140,
    backgroundColor: Theme.background.card,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  ebookCardCover: {
    width: '100%',
    height: 160,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  ebookCardDetails: {
    padding: 12,
  },
  ebookCardTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF5EE',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  ebookCardTagText: {
    color: Theme.green.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  ebookCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.text.primary,
    marginBottom: 2,
  },
  ebookCardMeta: {
    fontSize: 11,
    color: Theme.text.muted,
    marginBottom: 8,
  },
  ebookReadNow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ebookReadNowText: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.green.primary,
  },

  // Vertical Newsletter Items
  newsletterList: {
    marginBottom: 28,
    gap: 12,
  },
  newsletterItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.background.card,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 16,
    padding: 12,
  },
  newsletterItemCover: {
    width: 50,
    height: 65,
    borderRadius: 8,
  },
  newsletterItemContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  newsletterItemTopic: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.green.primary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  newsletterItemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.text.primary,
    marginBottom: 3,
  },
  newsletterItemIssue: {
    fontSize: 12,
    color: Theme.text.muted,
  },
  newsletterItemBtn: {
    backgroundColor: Theme.green.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  newsletterItemBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  // Pro Banner
  proBanner: {
    flexDirection: 'row',
    backgroundColor: '#EAF5EE',
    borderWidth: 1,
    borderColor: '#D0E8DB',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proBannerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  proBadge: {
    backgroundColor: Theme.green.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  proBannerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: Theme.text.primary,
    marginBottom: 4,
  },
  proBannerText: {
    fontSize: 12,
    color: Theme.text.secondary,
    lineHeight: 16,
  },
  proBannerRight: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D0E8DB',
  },
});