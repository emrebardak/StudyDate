import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { supabase } from '../lib/supabase';

// Light "looks like an email" check only. The real academic-domain rule (.edu/.edu.tr)
// is enforced by the backend `.edu` gate trigger — we surface ITS error rather than
// duplicating the domain list on the client.
function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Must match the backend policy (supabase/config.toml: minimum_password_length = 6) so
// the client-side check never contradicts what Auth would accept.
const MIN_PASSWORD_LENGTH = 6;

export default function RegisterVerificationScreen({
  navigation,
}: {
  navigation: any;
}) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleMode() {
    setMode(m => (m === 'signup' ? 'login' : 'signup'));
    setError('');
  }

  async function handleContinue() {
    const trimmed = email.trim();
    if (!looksLikeEmail(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: trimmed,
            password,
          });
        if (signInError) {
          setError(signInError.message);
          return;
        }
        const userId = signInData.user?.id;
        if (userId) {
          // Mirrors AppNavigator.tsx's cold-start session check: Supabase Auth's own email
          // confirmation is disabled locally (enable_confirmations = false), so
          // email_verified is the app's only verification gate. Without this, switching to
          // "Log In" let an unverified account skip straight to MainTabs.
          const { data: row, error: rowError } = await supabase
            .from('users')
            .select('email_verified')
            .eq('id', userId)
            .single();
          // Fail open on a transient fetch error, matching AppNavigator.tsx's identical
          // precedent — don't block a legitimate sign-in over a network hiccup.
          if (!rowError && !row?.email_verified) {
            // No row data to map here (just gating on a boolean) — email is already known
            // locally, so this is the same literal { email } shape the signup path passes,
            // not a case profileRowToRegistrationData's row-mapping actually fits.
            navigation.navigate('RegisterEmailCode', {
              data: { email: trimmed },
            });
            return;
          }
        }
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        return;
      }
      // Creates the auth.users row → fires the backend `.edu` gate. A non-academic email
      // comes back as an error here; a valid one returns an immediate session (local
      // config has email confirmations disabled) plus an auto-created public.users row.
      // The password is stored by Supabase Auth itself (bcrypt hash on auth.users) —
      // it is NEVER written to public.users or anywhere else in plaintext.
      const { error: signUpError } = await supabase.auth.signUp({
        email: trimmed,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      navigation.navigate('RegisterEmailCode', { data: { email: trimmed } });
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.stepTitle}>
            {mode === 'signup' ? 'Step 1' : 'Welcome Back'}
          </Text>
          <Text style={styles.stepSubtitle}>
            {mode === 'signup' ? 'Academic Verification' : 'Sign In'}
          </Text>
          <Text style={styles.stepDesc}>
            {mode === 'signup'
              ? 'To maintain our academic integrity, please verify your institutional email address.'
              : 'Sign in with your institutional email and password to continue.'}
          </Text>

          {/* ── Form card ── */}
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>
              UNIVERSITY EMAIL (.EDU, .EDU.TR, ETC.)
            </Text>

            <View style={[styles.inputRow, !!error && styles.inputRowError]}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={Colors.textSecondary}
              />
              <TextInput
                style={styles.input}
                placeholder="student@university.edu"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={v => {
                  setEmail(v);
                  if (error) setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>
              PASSWORD
            </Text>

            <View style={[styles.inputRow, !!error && styles.inputRowError]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={Colors.textSecondary}
              />
              <TextInput
                style={styles.input}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={v => {
                  setPassword(v);
                  if (error) setError('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(s => !s)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              mode === 'signup' && (
                <Text style={styles.helperText}>
                  Your password is stored securely. You'll use it to sign back
                  in.
                </Text>
              )
            )}

            <TouchableOpacity
              style={[
                styles.continueBtn,
                loading && styles.continueBtnDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleContinue}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textOnYellow} />
              ) : (
                <>
                  <Text style={styles.continueBtnText}>
                    {mode === 'signup' ? 'Continue' : 'Log In'}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={Colors.textOnYellow}
                  />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleModeBtn}
              activeOpacity={0.7}
              onPress={toggleMode}
            >
              <Text style={styles.toggleModeText}>
                {mode === 'signup'
                  ? 'Already have an account? '
                  : 'New to StudyMatch? '}
                <Text style={styles.toggleModeLink}>
                  {mode === 'signup' ? 'Log In' : 'Create Account'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Support footer */}
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.supportText}>
              Having trouble?{' '}
              <Text style={styles.supportLink}>Contact Support</Text>
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
  fieldLabelSpaced: {
    marginTop: Spacing.lg,
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
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueBtnText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textOnYellow,
  },

  // Mode toggle (sign up ↔ log in)
  toggleModeBtn: {
    marginTop: Spacing.md,
  },
  toggleModeText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  toggleModeLink: {
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
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
