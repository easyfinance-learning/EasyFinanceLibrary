import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image, KeyboardAvoidingView,
  Platform, ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../firebaseConfig';
import { Theme } from '../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Save email for PIN screen display
      await AsyncStorage.setItem('userEmail', email.trim());
      // Check if PIN already created
      const pinCreated = await AsyncStorage.getItem('pinCreated');
      if (pinCreated === 'true') {
        router.replace('/enter-pin');
      } else {
        router.replace('/create-pin');
      }
    } catch (error: any) {
      setLoading(false);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert('Too Many Attempts', 'Account temporarily locked. Please try again later.');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Enter Email', 'Please enter your email address first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Email Sent', 'Password reset email sent! Please check your inbox.');
    } catch {
      Alert.alert('Error', 'Could not send reset email. Please check the email address.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={Theme.background.primary} barStyle="dark-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 40}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>

          {/* ── Top Section ── */}
          <View style={styles.topSection}>
            <Image
              source={require('../assets/images/easy-finance-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>LEARN • PLAN • GROW</Text>
            <Text style={styles.welcomeText}>Welcome Back! 👋</Text>
            <Text style={styles.subText}>
              Login with your credentials to continue your learning journey
            </Text>
          </View>

          {/* ── Form Card ── */}
          <View style={styles.formCard}>

            <Text style={styles.formTitle}>Login to Your Account</Text>

            {/* Email */}
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={Theme.text.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor={Theme.text.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(s => !s)}
                style={styles.eyeBtn}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginBtnText}>🔐  Login</Text>
              }
            </TouchableOpacity>

            {/* Help Card */}
            <View style={styles.helpCard}>
              <Text style={styles.helpEmoji}>💡</Text>
              <Text style={styles.helpText}>
                Your login credentials are provided by Easy Finance. Please contact us if you need access.
              </Text>
            </View>

            {/* Contact Button */}
            <TouchableOpacity style={styles.contactBtn} activeOpacity={0.85}>
              <Text style={styles.contactText}>📞  Contact Easy Finance for Access</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Theme.background.primary },
  topSection:      { backgroundColor: Theme.background.primary, alignItems: 'center', paddingTop: 40, paddingBottom: 32, paddingHorizontal: 24 },
  logo:            { width: 270, height: 90, marginBottom: 8 },
  tagline:         { color: Theme.green.primary, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 20 },
  welcomeText:     { fontSize: 26, fontWeight: '900', color: Theme.text.primary, marginBottom: 6, textAlign: 'center' },
  subText:         { fontSize: 13, color: Theme.text.secondary, textAlign: 'center', lineHeight: 20 },
  formCard:        { backgroundColor: Theme.background.secondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, flex: 1, minHeight: 500, borderTopWidth: 1, borderTopColor: Theme.border },
  formTitle:       { fontSize: 20, fontWeight: '900', color: Theme.text.primary, marginBottom: 24 },
  label:           { fontSize: 13, fontWeight: '700', color: Theme.text.secondary, marginBottom: 6 },
  input:           { backgroundColor: Theme.background.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: Theme.text.primary, marginBottom: 16, borderWidth: 1, borderColor: Theme.border },
  passwordRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.background.card, borderRadius: 12, borderWidth: 1, borderColor: Theme.border, marginBottom: 8 },
  passwordInput:   { flex: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: Theme.text.primary },
  eyeBtn:          { paddingHorizontal: 14 },
  eyeText:         { fontSize: 18 },
  forgotBtn:       { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText:      { color: Theme.green.primary, fontSize: 15, fontWeight: '600' },
  loginBtn:        { backgroundColor: Theme.green.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 20 },
  loginBtnDisabled:{ backgroundColor: Theme.green.dark },
  loginBtnText:    { color: '#fff', fontSize: 16, fontWeight: '800' },
  helpCard:        { flexDirection: 'row', backgroundColor: '#EAF5EE', borderRadius: 12, padding: 14, marginBottom: 16, gap: 10, alignItems: 'flex-start', borderWidth: 1, borderColor: '#D0E8DB' },
  helpEmoji:       { fontSize: 18 },
  helpText:        { flex: 1, fontSize: 12, color: Theme.text.secondary, lineHeight: 18 },
  contactBtn:      { backgroundColor: Theme.background.card, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: Theme.border },
  contactText:     { color: Theme.text.secondary, fontSize: 13, fontWeight: '700' },
});