import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebaseConfig';
import { Theme } from '../../constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('Premium Member');
  const [userEmail, setUserEmail] = useState('Loading account...');
  const [userInitial, setUserInitial] = useState('U');
  const [isGuest, setIsGuest] = useState(false); // Default false, since login is required now

  useEffect(() => {
    // Check if a PIN is set. If pin is created, they are definitely not a guest.
    AsyncStorage.getItem('pinCreated').then(val => {
      if (val === 'true') {
        setIsGuest(false);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsGuest(false);
        const email = user.email || '';
        setUserEmail(email);

        if (user.displayName) {
          setUserName(user.displayName);
          setUserInitial(user.displayName.charAt(0).toUpperCase());
        } else {
          const nameFromEmail = email.split('@')[0];
          const formatted = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
          setUserName(formatted);
          setUserInitial(nameFromEmail.charAt(0).toUpperCase());
        }
      } else {
        // If there is no PIN and no user, they are a guest
        AsyncStorage.getItem('pinCreated').then(val => {
          if (val !== 'true') {
            setIsGuest(true);
            setUserName('Guest User');
            setUserEmail('Not logged in');
            setUserInitial('G');
          } else {
            // Keep email from storage if offline / PIN session
            AsyncStorage.getItem('userEmail').then(email => {
              if (email) {
                setUserEmail(email);
                const nameFromEmail = email.split('@')[0];
                setUserName(nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
                setUserInitial(nameFromEmail.charAt(0).toUpperCase());
              }
            });
          }
        });
      }
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out? You can log back in using your PIN.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'default',
          onPress: () => {
            router.replace('/enter-pin');
          },
        },
      ]
    );
  };

  const SETTINGS = [
    {
      icon: 'notifications-outline',
      color: Theme.green.primary,
      label: 'Notifications',
      sub: 'Manage daily updates & recommendations',
      onPress: () => Alert.alert('Notifications', 'Notification settings coming soon!'),
    },

    {
      icon: 'star-outline',
      color: '#BF5AF2',
      label: 'Rate the App',
      sub: 'Support us with a review on Play Store',
      onPress: () => Linking.openURL('https://play.google.com/store'),
    },
    {
      icon: 'information-circle-outline',
      color: Theme.text.secondary,
      label: 'About Easy Finance',
      sub: 'Learn about our mission and versions',
      onPress: () => Alert.alert(
        'About Easy Finance',
        'Easy Finance is a personal finance education platform helping Indians Learn, Plan & Grow their wealth through eBooks, newsletters, and expert 1-on-1 consultation.\n\nVersion 1.0.0',
        [{ text: 'Close' }]
      ),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={Theme.background.primary} barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ── Header Profile Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
          <View style={styles.memberBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Theme.green.primary} style={{ marginRight: 4 }} />
            <Text style={styles.memberBadgeText}>ACTIVE MEMBER</Text>
          </View>
        </View>

        {/* ── Settings Section ── */}
        <Text style={styles.sectionLabel}>Application Settings</Text>
        <View style={styles.menuCard}>
          {SETTINGS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuRow, i < SETTINGS.length - 1 && styles.menuBorder]}
              activeOpacity={0.7}
              onPress={item.onPress}
            >
              <View style={[styles.menuIconBox, { backgroundColor: Theme.background.secondary }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Theme.text.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Session Locking & Logouts ── */}
        <Text style={styles.sectionLabel}>Account Management</Text>
        <View style={styles.actionCard}>
          {isGuest ? (
            <TouchableOpacity style={styles.loginBtn} onPress={() => router.replace('/login')} activeOpacity={0.8}>
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.loginText}>Go to Login</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.lockBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={20} color={Theme.green.primary} style={{ marginRight: 8 }} />
              <Text style={styles.lockText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.footer}>Easy Finance Ecosystem  •  v1.0.0</Text>
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
  scrollContent: {
    padding: 20,
  },
  profileCard: { 
    backgroundColor: Theme.green.primary, 
    borderRadius: 24, 
    paddingVertical: 30, 
    paddingHorizontal: 20, 
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarContainer: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 14, 
  },
  avatarText: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: Theme.green.primary 
  },
  userName: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: '#FFFFFF', 
    marginBottom: 6 
  },
  userEmail: { 
    fontSize: 13, 
    color: '#E0F2E9', 
    marginBottom: 14 
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  memberBadgeText: {
    color: Theme.green.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionLabel: { 
    fontSize: 13, 
    fontWeight: '800', 
    color: Theme.green.primary, 
    marginLeft: 8, 
    marginBottom: 10, 
    letterSpacing: 0.8, 
    textTransform: 'uppercase' 
  },
  menuCard: { 
    backgroundColor: Theme.background.card, 
    borderRadius: 16, 
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 28,
    overflow: 'hidden',
  },
  menuRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16 
  },
  menuBorder: { 
    borderBottomWidth: 1, 
    borderBottomColor: Theme.border 
  },
  menuIconBox: { 
    width: 38, 
    height: 38, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 14,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  menuInfo: { 
    flex: 1 
  },
  menuLabel: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: Theme.text.primary 
  },
  menuSub: { 
    fontSize: 11, 
    color: Theme.text.secondary, 
    marginTop: 2 
  },
  actionCard: {
    gap: 12,
    marginBottom: 24,
  },
  lockBtn: { 
    flexDirection: 'row',
    backgroundColor: Theme.background.card, 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1, 
    borderColor: Theme.green.primary 
  },
  lockText: { 
    color: Theme.green.primary, 
    fontWeight: '800', 
    fontSize: 16 
  },
  logoutBtn: { 
    flexDirection: 'row',
    backgroundColor: Theme.background.card, 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1, 
    borderColor: '#3A1E1E' 
  },
  logoutText: { 
    color: '#FF4D4D', 
    fontWeight: '800', 
    fontSize: 14 
  },
  loginBtn: { 
    flexDirection: 'row',
    backgroundColor: Theme.green.primary, 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: { 
    color: Theme.background.primary, 
    fontWeight: '800', 
    fontSize: 14 
  },
  footer: { 
    textAlign: 'center', 
    fontSize: 11, 
    color: Theme.text.muted, 
    marginTop: 20 
  },
});