import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { useCMS } from '../hooks/useCMS';
import * as Speech from 'expo-speech';

const { height } = Dimensions.get('window');

const splitIntoSentences = (text: string) => {
  if (!text) return [];
  // Clean markdown images completely: ![alt text](url)
  let cleanedText = text.replace(/!\[.*?\]\(.*?\)/g, '');
  // Clean decorative lines and excessive symbols
  cleanedText = cleanedText.replace(/─{5,}/g, ''); // Remove long divider lines
  // Clean hash symbols from headings
  cleanedText = cleanedText.replace(/#+/g, '');
  // Clean markdown bold and italic formatting symbols
  cleanedText = cleanedText.replace(/\*\*|__/g, '');
  cleanedText = cleanedText.replace(/\*|_/g, '');
  
  // First, split by double newlines or single newlines to preserve paragraph boundaries
  const blocks = cleanedText.split(/\n+/);
  const result: string[] = [];
  
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    
    // Split each block by sentence-ending punctuation
    const sentences = trimmed.match(/[^.!?]+[.!?]+(\s+|$)/g);
    if (sentences) {
      result.push(...sentences.map(s => s.trim()).filter(Boolean));
    } else {
      result.push(trimmed);
    }
  }
  return result;
};

export default function ReaderScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const router = useRouter();
  const { ebooks, newsletters } = useCMS();
  const insets = useSafeAreaInsets();
  
  const [fontSize, setFontSize] = useState(16);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showToc, setShowToc] = useState(false);

  const [showAudio, setShowAudio] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
  const [speechRate, setSpeechRate] = useState(1.0);

  const scrollRef = useRef<ScrollView>(null);

  const speechStateRef = useRef({
    isSpeaking: false,
    currentSentenceIdx: 0,
    sentences: [] as string[],
    rate: 1.0,
  });

  // Sync ref values whenever state changes
  useEffect(() => {
    speechStateRef.current.isSpeaking = isSpeaking;
    speechStateRef.current.currentSentenceIdx = currentSentenceIdx;
    speechStateRef.current.rate = speechRate;
  }, [isSpeaking, currentSentenceIdx, speechRate]);

  // Find book from CMS list
  const item = type === 'newsletter'
    ? newsletters.find(n => n.id === id)
    : ebooks.find(b => b.id === id);

  const isNewsletter = type === 'newsletter';

  // Split content into pages/chapters safely
  const pages = item
    ? (isNewsletter
        ? item.content.split('─────────────────────────').map(p => p.trim()).filter(Boolean)
        : item.content.split(/(?:\r?\n)+(?=# Chapter \d+)/).map(p => p.trim()).filter(Boolean))
    : [];

  const totalPages = pages.length;

  // Sync bookmark status when page index changes
  const checkBookmark = useCallback(async (pageIdx: number) => {
    try {
      const key = `${type}_${id}`;
      const bookmarksJson = await AsyncStorage.getItem('bookmarks_data');
      if (bookmarksJson) {
        const bookmarks = JSON.parse(bookmarksJson);
        const bookmarkedPages = bookmarks[key] || [];
        setIsBookmarked(bookmarkedPages.includes(pageIdx));
      } else {
        setIsBookmarked(false);
      }
    } catch (e) {
      console.warn('Error checking bookmark:', e);
    }
  }, [id, type]);

  // Load last read page and bookmarks
  useEffect(() => {
    const initializeReader = async () => {
      try {
        // Load last read page index
        const lastReadJson = await AsyncStorage.getItem('last_read_item');
        if (lastReadJson) {
          const parsed = JSON.parse(lastReadJson);
          if (parsed.id === id && parsed.type === type) {
            const pageIdx = parsed.page - 1;
            if (pageIdx >= 0 && pageIdx < totalPages) {
              setCurrentPageIndex(pageIdx);
              checkBookmark(pageIdx);
              return;
            }
          }
        }
        // Fallback to first page
        checkBookmark(0);
      } catch (e) {
        console.warn('Failed to load reader progress:', e);
      }
    };

    initializeReader();
  }, [id, type, totalPages, checkBookmark]);



  const handlePageChange = async (newIndex: number) => {
    if (newIndex >= 0 && newIndex < totalPages) {
      setCurrentPageIndex(newIndex);
      checkBookmark(newIndex);
      
      // Scroll to top of content
      scrollRef.current?.scrollTo({ y: 0, animated: false });

      // Save progress to AsyncStorage
      try {
        const readData = {
          id,
          type,
          page: newIndex + 1,
          total: totalPages,
        };
        await AsyncStorage.setItem('last_read_item', JSON.stringify(readData));
      } catch (e) {
        console.warn('Failed to save reading progress:', e);
      }
    }
  };

  const toggleBookmark = async () => {
    try {
      const key = `${type}_${id}`;
      const bookmarksJson = await AsyncStorage.getItem('bookmarks_data');
      let bookmarks = bookmarksJson ? JSON.parse(bookmarksJson) : {};
      
      let bookmarkedPages = bookmarks[key] || [];
      if (bookmarkedPages.includes(currentPageIndex)) {
        // Remove bookmark
        bookmarkedPages = bookmarkedPages.filter((p: number) => p !== currentPageIndex);
      } else {
        // Add bookmark
        bookmarkedPages.push(currentPageIndex);
      }
      
      bookmarks[key] = bookmarkedPages;
      await AsyncStorage.setItem('bookmarks_data', JSON.stringify(bookmarks));
      setIsBookmarked(bookmarkedPages.includes(currentPageIndex));
    } catch (e) {
      console.warn('Failed to toggle bookmark:', e);
    }
  };

  // Get current page content and header title
  const currentPageContent = pages[currentPageIndex] || '';

  const speakNext = useCallback(() => {
    const { isSpeaking: active, currentSentenceIdx: idx, sentences, rate } = speechStateRef.current;
    
    if (!active || idx >= sentences.length) {
      setIsSpeaking(false);
      setCurrentSentenceIdx(0);
      return;
    }
    
    const textToSpeak = sentences[idx];
    
    Speech.speak(textToSpeak, {
      rate,
      onDone: () => {
        if (speechStateRef.current.isSpeaking) {
          const nextIdx = idx + 1;
          setCurrentSentenceIdx(nextIdx);
          speechStateRef.current.currentSentenceIdx = nextIdx;
          speakNext();
        }
      },
      onError: (err) => {
        console.warn("Speech error:", err);
        setIsSpeaking(false);
      }
    });
  }, []);

  const startSpeaking = () => {
    const sentences = splitIntoSentences(currentPageContent);
    if (sentences.length === 0) return;
    
    Speech.stop();
    
    speechStateRef.current.sentences = sentences;
    speechStateRef.current.isSpeaking = true;
    
    setIsSpeaking(true);
    
    let idx = currentSentenceIdx;
    if (idx >= sentences.length) {
      idx = 0;
      setCurrentSentenceIdx(0);
      speechStateRef.current.currentSentenceIdx = 0;
    }
    
    const textToSpeak = sentences[idx];
    Speech.speak(textToSpeak, {
      rate: speechRate,
      onDone: () => {
        if (speechStateRef.current.isSpeaking) {
          const nextIdx = idx + 1;
          setCurrentSentenceIdx(nextIdx);
          speechStateRef.current.currentSentenceIdx = nextIdx;
          speakNext();
        }
      },
      onError: (err) => {
        console.warn("Speech error:", err);
        setIsSpeaking(false);
      }
    });
  };

  const pauseSpeaking = () => {
    setIsSpeaking(false);
    speechStateRef.current.isSpeaking = false;
    Speech.stop();
  };

  const stopSpeaking = () => {
    setIsSpeaking(false);
    speechStateRef.current.isSpeaking = false;
    setCurrentSentenceIdx(0);
    speechStateRef.current.currentSentenceIdx = 0;
    Speech.stop();
  };

  const changeSpeechRate = (newRate: number) => {
    setSpeechRate(newRate);
    speechStateRef.current.rate = newRate;
    
    if (speechStateRef.current.isSpeaking) {
      Speech.stop();
      setTimeout(() => {
        if (speechStateRef.current.isSpeaking) {
          const { currentSentenceIdx: idx, sentences } = speechStateRef.current;
          if (idx < sentences.length) {
            const textToSpeak = sentences[idx];
            Speech.speak(textToSpeak, {
              rate: newRate,
              onDone: () => {
                if (speechStateRef.current.isSpeaking) {
                  const nextIdx = idx + 1;
                  setCurrentSentenceIdx(nextIdx);
                  speechStateRef.current.currentSentenceIdx = nextIdx;
                  speakNext();
                }
              },
              onError: (err) => {
                console.warn("Speech error:", err);
                setIsSpeaking(false);
              }
            });
          }
        }
      }, 100);
    }
  };

  // Reset speech when changing page index or when item changes
  useEffect(() => {
    stopSpeaking();
  }, [currentPageIndex]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);
  
  // Extract heading for TOC and display
  const getPageTitle = (text: string, idx: number) => {
    if (isNewsletter) {
      // Return first line
      const lines = text.split('\n');
      return lines[0].replace(/[📊💡📈🎯]/g, '').trim() || `Section ${idx + 1}`;
    } else {
      // Find chapter header in the first few lines
      const firstLines = text.split('\n').slice(0, 3).join('\n');
      const match = firstLines.match(/^#?\s*(Chapter \d+.*)$/m);
      if (match) {
        return match[1].trim();
      }
      return idx === 0 ? "Table of Contents" : `Chapter ${idx}`;
    }
  };

  const currentTitle = getPageTitle(currentPageContent, currentPageIndex);

  // Compute progress percentage
  const progressPercent = totalPages > 0 ? ((currentPageIndex + 1) / totalPages) * 100 : 0;

  const parseBoldText = (text: string) => {
    if (!text.includes('**')) return text;
    
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={idx} style={{ fontWeight: 'bold', color: Theme.text.primary }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return part;
    });
  };

  const renderContent = (text: string) => {
    if (!text) return null;

    // Split text by markdown image tags: ![alt text](url)
    const parts = text.split(/(!\[.*?\]\(.*?\))/g);
    return parts.map((part, index) => {
      const match = part.match(/!\[(.*?)\]\((.*?)\)/);
      if (match) {
        const altText = match[1];
        const imageUrl = match[2];
        return (
          <View key={index} style={styles.contentImageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.contentImage} resizeMode="cover" />
          </View>
        );
      }

      // Process text part line-by-line for headings and paragraph spacing
      const lines = part.split('\n');
      return (
        <View key={index} style={{ width: '100%' }}>
          {lines.map((line, lineIdx) => {
            const trimmed = line.trim();
            
            // Handle H1: # Heading Title, or exact match for "Table of Contents", or starts with "Chapter \d+"
            const isH1Markdown = trimmed.startsWith('# ');
            const isTOC = trimmed.toLowerCase() === 'table of contents';
            const isChapterTitle = /^chapter \d+/i.test(trimmed);
            
            if (isH1Markdown || isTOC || isChapterTitle) {
              const headingText = isH1Markdown ? trimmed.replace(/^#\s+/, '') : trimmed;
              return (
                <Text key={lineIdx} style={styles.heading1}>
                  {headingText}
                </Text>
              );
            }
            
            // Handle H2: ## Heading Title
            if (trimmed.startsWith('## ')) {
              const headingText = trimmed.replace(/^##\s+/, '');
              return (
                <Text key={lineIdx} style={styles.heading2}>
                  {headingText}
                </Text>
              );
            }
            
            // Handle H3: ### Heading Title
            if (trimmed.startsWith('### ')) {
              const headingText = trimmed.replace(/^###\s+/, '');
              return (
                <Text key={lineIdx} style={styles.heading3}>
                  {headingText}
                </Text>
              );
            }
            
            // Empty line: render a small spacer
            if (line === '') {
              return <View key={lineIdx} style={{ height: 10 }} />;
            }
            
            // Standard text line
            return (
              <Text key={lineIdx} style={[styles.contentText, { fontSize, lineHeight: fontSize * 1.65 }]}>
                {parseBoldText(line)}
              </Text>
            );
          })}
        </View>
      );
    });
  };

  if (!item) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={Theme.background.secondary} barStyle="dark-content" />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          onPress={() => {
            stopSpeaking();
            router.back();
          }} 
          style={styles.backBtn} 
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={Theme.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.topTitleContainer}>
          <Text style={styles.topTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.topSubtitle} numberOfLines={1}>{currentTitle}</Text>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity 
            onPress={() => {
              if (showAudio) {
                stopSpeaking();
                setShowAudio(false);
              } else {
                setShowAudio(true);
                setTimeout(() => {
                  startSpeaking();
                }, 150);
              }
            }} 
            style={styles.actionBtn} 
            activeOpacity={0.7}
          >
            <Ionicons 
              name="headset" 
              size={20} 
              color={showAudio ? Theme.green.primary : Theme.text.primary} 
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleBookmark} style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons 
              name={isBookmarked ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color={isBookmarked ? Theme.green.primary : Theme.text.primary} 
            />
          </TouchableOpacity>

          <View style={styles.fontControls}>
            <TouchableOpacity onPress={() => setFontSize(s => Math.max(12, s - 2))} style={styles.fontBtn} activeOpacity={0.7}>
              <Text style={styles.fontBtnText}>A-</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFontSize(s => Math.min(26, s + 2))} style={styles.fontBtn} activeOpacity={0.7}>
              <Text style={styles.fontBtnText}>A+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Reading Scroll Area ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.reader}
        contentContainerStyle={styles.readerContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent(currentPageContent)}
        
        {/* End of Section indicator */}
        {currentPageIndex === totalPages - 1 && (
          <View style={styles.endCard}>
            <View style={styles.endIconCircle}>
              <Ionicons name="ribbon" size={36} color={Theme.green.primary} />
            </View>
            <Text style={styles.endTitle}>Publication Completed!</Text>
            <Text style={styles.endSub}>Great job investing in your financial literacy.</Text>
            <TouchableOpacity
              style={styles.endBtn}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.endBtnText}>Finish Reading</Text>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── Progress Line Indicator ── */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* ── Audio Player Control Panel ── */}
      {showAudio && (
        <View style={styles.audioPanel}>
          <View style={styles.audioPanelTop}>
            <Ionicons name="headset" size={16} color={Theme.green.primary} />
            <Text style={styles.audioPanelTitle} numberOfLines={1}>
              Speaking Section ({currentSentenceIdx + 1}/{splitIntoSentences(currentPageContent).length})
            </Text>
            <TouchableOpacity 
              onPress={() => {
                stopSpeaking();
                setShowAudio(false);
              }} 
              style={styles.audioCloseBtn}
            >
              <Ionicons name="close" size={18} color={Theme.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.audioPanelControls}>
            {/* Speed Control */}
            <TouchableOpacity 
              onPress={() => {
                const nextRates: { [key: number]: number } = { 1.0: 1.2, 1.2: 1.5, 1.5: 1.0 };
                changeSpeechRate(nextRates[speechRate] || 1.0);
              }}
              style={styles.speedBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.speedBtnText}>{speechRate.toFixed(1)}x</Text>
            </TouchableOpacity>

            {/* Skip Back */}
            <TouchableOpacity 
              onPress={() => {
                if (currentSentenceIdx > 0) {
                  const prevIdx = currentSentenceIdx - 1;
                  setCurrentSentenceIdx(prevIdx);
                  speechStateRef.current.currentSentenceIdx = prevIdx;
                  if (speechStateRef.current.isSpeaking) {
                    Speech.stop();
                    setTimeout(() => speakNext(), 100);
                  }
                }
              }}
              style={styles.skipBtn}
              disabled={currentSentenceIdx === 0}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="play-back" 
                size={20} 
                color={currentSentenceIdx === 0 ? Theme.text.muted : Theme.green.primary} 
              />
            </TouchableOpacity>

            {/* Play/Pause */}
            <TouchableOpacity 
              onPress={isSpeaking ? pauseSpeaking : startSpeaking}
              style={styles.playPauseBtn}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={isSpeaking ? "pause" : "play"} 
                size={24} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>

            {/* Skip Forward */}
            {(() => {
              const totalSentences = splitIntoSentences(currentPageContent).length;
              const isLast = currentSentenceIdx >= totalSentences - 1;
              return (
                <TouchableOpacity 
                  onPress={() => {
                    if (!isLast) {
                      const nextIdx = currentSentenceIdx + 1;
                      setCurrentSentenceIdx(nextIdx);
                      speechStateRef.current.currentSentenceIdx = nextIdx;
                      if (speechStateRef.current.isSpeaking) {
                        Speech.stop();
                        setTimeout(() => speakNext(), 100);
                      }
                    }
                  }}
                  style={styles.skipBtn}
                  disabled={isLast}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="play-forward" 
                    size={20} 
                    color={isLast ? Theme.text.muted : Theme.green.primary} 
                  />
                </TouchableOpacity>
              );
            })()}
          </View>
        </View>
      )}

      {/* ── Bottom Controls ── */}
      <View style={[styles.bottomBar, { paddingBottom: 12 + insets.bottom }]}>
        <TouchableOpacity 
          style={[styles.bottomBtn, currentPageIndex === 0 && styles.disabledBtn]} 
          onPress={() => handlePageChange(currentPageIndex - 1)}
          disabled={currentPageIndex === 0}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={currentPageIndex === 0 ? Theme.text.muted : Theme.text.primary} />
          <Text style={[styles.bottomBtnText, currentPageIndex === 0 && styles.disabledBtnText]}>Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tocBtn} 
          onPress={() => setShowToc(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="list" size={20} color={Theme.green.primary} />
          <Text style={styles.tocText}>Page {currentPageIndex + 1} of {totalPages}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bottomBtn, currentPageIndex === totalPages - 1 && styles.disabledBtn]} 
          onPress={() => handlePageChange(currentPageIndex + 1)}
          disabled={currentPageIndex === totalPages - 1}
          activeOpacity={0.7}
        >
          <Text style={[styles.bottomBtnText, currentPageIndex === totalPages - 1 && styles.disabledBtnText]}>Next</Text>
          <Ionicons name="chevron-forward" size={20} color={currentPageIndex === totalPages - 1 ? Theme.text.muted : Theme.text.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Table of Contents (TOC) Overlay Modal ── */}
      {showToc && (
        <View style={styles.tocOverlay}>
          <TouchableOpacity 
            style={styles.tocOverlayCloseArea} 
            onPress={() => setShowToc(false)} 
            activeOpacity={1}
          />
          <View style={[styles.tocContentSheet, { paddingBottom: 20 + insets.bottom }]}>
            <View style={styles.tocHeader}>
              <Text style={styles.tocTitle}>Table of Contents</Text>
              <TouchableOpacity onPress={() => setShowToc(false)} style={styles.tocCloseBtn} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={24} color={Theme.text.secondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={pages}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.tocList}
              renderItem={({ item: pageContent, index }) => {
                const pageTitle = getPageTitle(pageContent, index);
                const isCurrent = index === currentPageIndex;
                return (
                  <TouchableOpacity
                    style={[
                      styles.tocItem,
                      isCurrent && styles.tocItemActive
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      handlePageChange(index);
                      setShowToc(false);
                    }}
                  >
                    <Text style={[
                      styles.tocItemIndex,
                      isCurrent && styles.tocItemIndexActive
                    ]}>
                      {(index + 1).toString().padStart(2, '0')}
                    </Text>
                    <Text style={[
                      styles.tocItemTitle,
                      isCurrent && styles.tocItemTitleActive
                    ]} numberOfLines={1}>
                      {pageTitle}
                    </Text>
                    {isCurrent && (
                      <Ionicons name="book" size={16} color={Theme.green.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: Theme.background.secondary 
  },
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Theme.background.secondary, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  backBtn: { 
    padding: 6 
  },
  topTitleContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  topTitle: { 
    color: Theme.text.primary, 
    fontSize: 14, 
    fontWeight: '900',
  },
  topSubtitle: {
    color: Theme.green.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Theme.background.secondary,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  fontControls: { 
    flexDirection: 'row', 
    backgroundColor: Theme.background.secondary,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fontBtn: { 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
  },
  fontBtnText: { 
    color: Theme.text.primary, 
    fontWeight: '800', 
    fontSize: 12 
  },
  reader: { 
    flex: 1, 
    backgroundColor: Theme.background.primary 
  },
  readerContent: { 
    padding: 24, 
    paddingBottom: 48 
  },
  contentText: { 
    color: Theme.text.primary, 
    fontFamily: 'normal',
    letterSpacing: 0.2,
  },
  endCard: { 
    backgroundColor: Theme.background.card, 
    borderRadius: 20, 
    padding: 24, 
    alignItems: 'center', 
    marginTop: 40,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  endIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#D0E8DB',
  },
  endTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: Theme.text.primary, 
    marginBottom: 6, 
    textAlign: 'center' 
  },
  endSub: { 
    fontSize: 13, 
    color: Theme.text.secondary, 
    textAlign: 'center', 
    marginBottom: 20 
  },
  endBtn: { 
    flexDirection: 'row',
    backgroundColor: Theme.green.primary, 
    borderRadius: 12, 
    paddingVertical: 12, 
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  endBtnText: { 
    color: '#FFFFFF', 
    fontWeight: '900', 
    fontSize: 13.5 
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Theme.border,
    width: '100%',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Theme.green.primary,
  },
  bottomBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: Theme.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
  bottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Theme.background.secondary,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: 4,
  },
  disabledBtn: {
    opacity: 0.5,
    borderColor: 'transparent',
  },
  bottomBtnText: {
    color: Theme.text.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  disabledBtnText: {
    color: Theme.text.muted,
  },
  tocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tocText: {
    color: Theme.text.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  tocOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  tocOverlayCloseArea: {
    flex: 1,
  },
  tocContentSheet: {
    backgroundColor: Theme.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.65,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
  tocHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  tocTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: Theme.text.primary,
  },
  tocCloseBtn: {
    padding: 2,
  },
  tocList: {
    padding: 16,
  },
  tocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  tocItemActive: {
    backgroundColor: '#EAF5EE',
    borderWidth: 1,
    borderColor: Theme.green.primary,
  },
  tocItemIndex: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.text.muted,
    marginRight: 14,
  },
  tocItemIndexActive: {
    color: Theme.green.primary,
    fontSize: 16,
  },
  tocItemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Theme.text.secondary,
  },
  tocItemTitleActive: {
    color: Theme.text.primary,
    fontWeight: '900',
  },
  audioPanel: {
    backgroundColor: '#EAF5EE',
    borderTopWidth: 1,
    borderTopColor: '#D0E8DB',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  audioPanelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  audioPanelTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Theme.text.secondary,
  },
  audioCloseBtn: {
    padding: 4,
  },
  audioPanelControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    height: 46,
  },
  speedBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D0E8DB',
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    left: 0,
  },
  speedBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.green.primary,
  },
  skipBtn: {
    padding: 6,
  },
  playPauseBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Theme.green.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.green.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  contentImageContainer: {
    width: '100%',
    marginVertical: 16,
    alignItems: 'center',
  },
  contentImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: '#EAF5EE',
  },
  imageCaption: {
    fontSize: 12,
    color: Theme.text.secondary,
    marginTop: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  heading1: {
    fontSize: 22,
    fontWeight: '900',
    color: Theme.green.primary,
    marginTop: 10,
    marginBottom: 20,
    lineHeight: 28,
  },
  heading2: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.green.primary,
    marginTop: 22,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  heading3: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
});