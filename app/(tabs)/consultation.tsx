import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';

const WHATSAPP_NUMBER = '918010924901';
const CALL_NUMBER = '+918010924901';

export default function ConsultationScreen() {
  const [name, setName]       = useState('');
  const [mobile, setMobile]   = useState('');
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  
  // Track input focus states for focus-glow style
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const openWhatsApp = () => {
    const msg = `Hi Easy Finance! I'd like to know more about mutual fund investments.`;
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`);
  };

  const makeCall = () => {
    Linking.openURL(`tel:${CALL_NUMBER}`);
  };

  const submitForm = () => {
    if (!name || !mobile) {
      Alert.alert('Required Fields', 'Please enter your name and mobile number.');
      return;
    }
    Alert.alert('✅ Submitted!', "We'll get back to you within 24 hours.", [{ text: 'OK' }]);
    setName(''); setMobile(''); setEmail(''); setMessage('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={Theme.background.primary} barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expert Consultation</Text>
        <Text style={styles.headerSub}>Talk to our certified wealth advisors</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Consultation Hero Card Removed ── */}

        {/* ── Quick Contact ── */}
        <Text style={styles.sectionTitle}>Quick Contact</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.whatsappBtn} onPress={openWhatsApp} activeOpacity={0.8}>
            <View style={styles.quickIconCircle}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </View>
            <Text style={styles.quickBtnTitle}>WhatsApp</Text>
            <Text style={styles.quickBtnSub}>Chat instantly</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.callBtn} onPress={makeCall} activeOpacity={0.8}>
            <View style={styles.quickIconCircle}>
              <Ionicons name="call" size={22} color="#0084FF" />
            </View>
            <Text style={styles.quickBtnTitle}>Direct Call</Text>
            <Text style={styles.quickBtnSub}>Speak with us</Text>
          </TouchableOpacity>
        </View>

        {/* ── Why Choose Easy Finance Section Removed ── */}

        {/* ── Enquiry Form ── */}
        <Text style={styles.sectionTitle}>Send an Enquiry</Text>
        <View style={styles.formCard}>
          <Text style={styles.label}>FULL NAME *</Text>
          <TextInput
            style={[
              styles.input,
              focusedInput === 'name' && styles.inputFocused
            ]}
            placeholder="Enter your name"
            placeholderTextColor={Theme.text.muted}
            value={name}
            onChangeText={setName}
            onFocus={() => setFocusedInput('name')}
            onBlur={() => setFocusedInput(null)}
          />

          <Text style={styles.label}>MOBILE NUMBER *</Text>
          <TextInput
            style={[
              styles.input,
              focusedInput === 'mobile' && styles.inputFocused
            ]}
            placeholder="Enter your mobile number"
            placeholderTextColor={Theme.text.muted}
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={setMobile}
            onFocus={() => setFocusedInput('mobile')}
            onBlur={() => setFocusedInput(null)}
          />

          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={[
              styles.input,
              focusedInput === 'email' && styles.inputFocused
            ]}
            placeholder="Enter your email"
            placeholderTextColor={Theme.text.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput(null)}
          />

          <Text style={styles.label}>MESSAGE</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              focusedInput === 'message' && styles.inputFocused
            ]}
            placeholder="Describe your current investment query or goals..."
            placeholderTextColor={Theme.text.muted}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
            onFocus={() => setFocusedInput('message')}
            onBlur={() => setFocusedInput(null)}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={submitForm} activeOpacity={0.85}>
            <Text style={styles.submitText}>Submit Request</Text>
            <Ionicons name="paper-plane" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

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
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
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
  content: { 
    padding: 20 
  },
  heroCard: { 
    backgroundColor: '#EAF5EE', 
    borderRadius: 20, 
    padding: 24, 
    alignItems: 'center', 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#D0E8DB',
  },
  heroBadgeContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2A1F10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#4A3215',
  },
  heroTitle: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: Theme.text.primary, 
    textAlign: 'center', 
    lineHeight: 28, 
    marginBottom: 10 
  },
  heroSub: { 
    fontSize: 12.5, 
    color: Theme.text.secondary, 
    textAlign: 'center', 
    lineHeight: 18 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: Theme.text.primary, 
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  quickRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 24 
  },
  whatsappBtn: { 
    flex: 1, 
    backgroundColor: Theme.background.card, 
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1C3D24',
  },
  callBtn: { 
    flex: 1, 
    backgroundColor: Theme.background.card, 
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1C2C3D',
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  quickBtnTitle: { 
    fontSize: 13.5, 
    fontWeight: '800', 
    color: Theme.text.primary 
  },
  quickBtnSub: { 
    fontSize: 11, 
    color: Theme.text.secondary, 
    marginTop: 2 
  },
  whyCard: { 
    backgroundColor: Theme.background.card, 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  whyRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16,
  },
  whyIcon: { 
    marginRight: 14,
  },
  whyText: { 
    fontSize: 13, 
    color: Theme.text.secondary, 
    fontWeight: '600', 
    flex: 1,
    lineHeight: 18,
  },
  formCard: { 
    backgroundColor: Theme.background.card, 
    borderRadius: 16, 
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  label: { 
    fontSize: 12.5, 
    fontWeight: '800', 
    color: Theme.green.primary, 
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: { 
    backgroundColor: Theme.background.secondary, 
    borderRadius: 10, 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    fontSize: 14, 
    color: Theme.text.primary, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: Theme.border 
  },
  inputFocused: {
    borderColor: Theme.green.primary,
    backgroundColor: Theme.background.card,
  },
  textArea: { 
    height: 100, 
    textAlignVertical: 'top' 
  },
  submitBtn: { 
    flexDirection: 'row',
    backgroundColor: Theme.green.primary, 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4 
  },
  submitText: { 
    color: '#FFFFFF', 
    fontSize: 14.5, 
    fontWeight: '800' 
  },
});