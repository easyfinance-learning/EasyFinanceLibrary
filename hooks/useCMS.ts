import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { EBOOKS, NEWSLETTERS, CMS_BASE_URL } from '../constants/data';

export interface EBook {
  id: string;
  title: string;
  pages: number;
  tag: string;
  level: 'Beginner' | 'Advanced';
  bg: string;
  accent: string;
  emoji: string;
  description: string;
  author: string;
  readTime: string;
  content: string;
  coverUrl?: string;   // Optional cover image URL
  contentUrl?: string; // Optional markdown/text content URL
}

export interface Newsletter {
  id: string;
  title: string;
  issue: string;
  date: string;
  topic: string;
  bg: string;
  accent: string;
  emoji: string;
  hot: boolean;
  description: string;
  content: string;
  coverUrl?: string;   // Optional thumbnail image URL
  contentUrl?: string; // Optional raw text content URL
}

export function useCMS() {
  const [ebooks, setEbooks] = useState<EBook[]>([...EBOOKS].reverse() as EBook[]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([...NEWSLETTERS].reverse() as any[]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      const cachedEbooks = await AsyncStorage.getItem('cached_ebooks');
      const cachedNewsletters = await AsyncStorage.getItem('cached_newsletters');

      if (cachedEbooks) {
        setEbooks(JSON.parse(cachedEbooks));
      }
      if (cachedNewsletters) {
        setNewsletters(JSON.parse(cachedNewsletters));
      }
    } catch (error) {
      console.error('Failed to load cached CMS data:', error);
    } finally {
      setLoading(false);
      // Fetch fresh data in the background
      fetchFreshData();
    }
  };

  const fetchFreshData = async () => {
    setRefreshing(true);
    try {
      // Fetch books
      const ebooksRes = await fetch(`${CMS_BASE_URL}ebooks.json?t=${Date.now()}`);
      if (ebooksRes.ok) {
        const ebooksData = await ebooksRes.json();
        if (Array.isArray(ebooksData)) {
          const sortedEbooks = [...ebooksData].reverse();
          setEbooks(sortedEbooks);
          await AsyncStorage.setItem('cached_ebooks', JSON.stringify(sortedEbooks));
        }
      }

      // Fetch newsletters
      const newslettersRes = await fetch(`${CMS_BASE_URL}newsletters.json?t=${Date.now()}`);
      if (newslettersRes.ok) {
        const newslettersData = await newslettersRes.json();
        if (Array.isArray(newslettersData)) {
          const sortedNewsletters = [...newslettersData].reverse();
          setNewsletters(sortedNewsletters);
          await AsyncStorage.setItem('cached_newsletters', JSON.stringify(sortedNewsletters));
        }
      }
    } catch (error) {
      console.warn('Network request failed. Offline or incorrect CMS URL. Using cached/local data.');
    } finally {
      setRefreshing(false);
    }
  };

  return {
    ebooks,
    newsletters,
    loading,
    refreshing,
    refetch: fetchFreshData,
  };
}
