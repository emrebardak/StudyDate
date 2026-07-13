import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';

const ACADEMIC_DOMAINS = ['.edu', '.edu.tr', '.ac.uk'];

function isAcademicEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
  return ACADEMIC_DOMAINS.some((domain) => trimmed.endsWith(domain));
}

export default function RegisterVerificationScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  function handleContinue() {
    if (!isAcademicEmail(email)) {
      setError('Please use a valid university email (.edu, .edu.tr, .ac.uk).');
      return;
    }
    setError('');
    navigation.navigate('RegisterProfile', { data: { email: email.trim() } });
  }

  return (
    <View style={styles.root}>

      {/* Top progress sliver */}
      <View style={styles.topBarTrack}>
        <View style={styles.topBarFill} />
      </View>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="school" size={24} color={Colors.primary} />
          <Text style={styles.headerTitle}>StudyMatch</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>

          {/* Hero */}
          <Text style={styles.stepTitle}>Step 1</Text>
          <Text style={styles.stepSubtitle}>Academic Verification</Text>
          <Text style={styles.stepDesc}>
            To maintain our academic integrity, please verify your institutional
            email address.
          </Text>

          {/* ── Form card ── */}
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>
              UNIVERSITY EMAIL (.EDU, .EDU.TR, ETC.)
            </Text>

            <View style={[styles.inputRow, !!error && styles.inputRowError]}>
              <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="student@university.edu"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (error) setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <Text style={styles.helperText}>
                We'll send a verification link to this address.
              </Text>
            )}

            <TouchableOpacity
              style={styles.continueBtn}
              activeOpacity={0.85}
              onPress={handleContinue}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.textOnYellow} />
            </TouchableOpacity>
          </View>

          {/* Support footer */}
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.supportText}>
              Having trouble? <Text style={styles.supportLink}>Contact Support</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },

  // Top progress sliver (step 1 of 4 = 25%)
  topBarTrack: {
    height: 4,
    backgroundColor: Colors.surface,
  },
  topBarFill: {
    width: '25%',
    height: 4,
    backgroundColor: Colors.primary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: 48,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.black,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: Spacing.xs,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    justifyContent: 'center',
  },

  stepTitle: {
    fontSize: Typography.size.hero,
    fontWeight: Typography.weight.black,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semibold,
    color: Colors.primaryAlt,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  stepDesc: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },

  // Form card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  fieldLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    letterSpacing: 1.2,
    marginBottom: Spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceMid,
    borderRadius: Radius.sm,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingHorizontal: Spacing.md,
  },
  inputRowError: {
    borderBottomColor: Colors.danger,
  },
  input: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  helperText: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  errorText: {
    fontSize: Typography.size.sm,
    color: Colors.danger,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
  },
  continueBtnText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textOnYellow,
  },

  // Support footer
  supportText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  supportLink: {
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },
});
