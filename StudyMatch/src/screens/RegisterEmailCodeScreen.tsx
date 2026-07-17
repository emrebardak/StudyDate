import React, { useEffect, useState } from 'react';
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
import { toFriendlyErrorMessage } from '../lib/errors';
import { EMAIL_VERIFICATION_MODE } from '../lib/config';
import { mapEmailVerificationStatusFromAPI } from '../data/mappers';

const CODE_LENGTH = 6;

export default function RegisterEmailCodeScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const incoming = route?.params?.data ?? {};

  const [displayedCode, setDisplayedCode] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [loadingCode, setLoadingCode] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  // Own-row SELECT is RLS-permitted (users_select_own) — this is the offline stand-in for
  // "the email arrives": we read the code the backend already generated at signup instead
  // of it being delivered anywhere.
  async function loadOwnCode() {
    setLoadingCode(true);
    setError('');
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) {
        setError('Your session expired. Please restart registration.');
        return;
      }
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('verification_code')
        .eq('id', userId)
        .single();
      if (fetchError) {
        setError(toFriendlyErrorMessage(fetchError));
        return;
      }
      setDisplayedCode(
        mapEmailVerificationStatusFromAPI(data).verificationCode || null,
      );
    } catch (e: any) {
      setError(
        toFriendlyErrorMessage(e, {
          fallbackMessage: 'Could not load your verification code.',
        }),
      );
    } finally {
      setLoadingCode(false);
    }
  }

  useEffect(() => {
    if (EMAIL_VERIFICATION_MODE === 'offline') {
      loadOwnCode();
    } else {
      setLoadingCode(false);
    }
  }, []);

  async function handleVerify() {
    if (codeInput.trim().length !== CODE_LENGTH || verifying) return;
    setVerifying(true);
    setError('');
    try {
      const { error: rpcError } = await supabase.rpc('verify_email_code', {
        p_code: codeInput.trim(),
      });
      // ST013 (already verified) reaching here means the goal state is already true —
      // e.g. a resumed session or a double-tap racing an earlier successful call.
      // Treat it as success rather than an error.
      if (rpcError && rpcError.code !== 'ST013') {
        setError(
          toFriendlyErrorMessage(rpcError, {
            codeMessages: {
              ST012: 'Your session expired. Please restart registration.',
              ST014:
                'This code has expired. Tap "Regenerate code" for a new one.',
              ST015: 'That code is incorrect. Please try again.',
            },
          }),
        );
        return;
      }
      navigation.navigate('RegisterProfile', { data: incoming });
    } catch (e: any) {
      setError(
        toFriendlyErrorMessage(e, {
          fallbackMessage: 'Something went wrong. Please try again.',
        }),
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (resending) return;
    setResending(true);
    setError('');
    try {
      const { error: rpcError } = await supabase.rpc(
        'regenerate_verification_code',
      );
      if (rpcError) {
        setError(
          toFriendlyErrorMessage(rpcError, {
            codeMessages: {
              ST012: 'Your session expired. Please restart registration.',
              ST013: 'Your email is already verified.',
            },
          }),
        );
        return;
      }
      // regenerate_verification_code() returns void (writes the new code server-side) —
      // re-fetch the row rather than trust a client-visible return value, same as the
      // initial load.
      setCodeInput('');
      await loadOwnCode();
    } catch (e: any) {
      setError(
        toFriendlyErrorMessage(e, {
          fallbackMessage: 'Could not regenerate a code. Please try again.',
        }),
      );
    } finally {
      setResending(false);
    }
  }

  const canVerify = codeInput.trim().length === CODE_LENGTH && !verifying;

  return (
    <View style={styles.root}>
      {/* Top progress sliver — same step-1 slice as RegisterVerificationScreen */}
      <View style={styles.topBarTrack}>
        <View style={styles.topBarFill} />
      </View>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="school" size={24} color={Colors.primary} />
          <Text style={styles.headerTitle}>StudyMatch</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.stepTitle}>Step 1</Text>
          <Text style={styles.stepSubtitle}>Verify Your Email</Text>
          <Text style={styles.stepDesc}>
            Enter the 6-digit code to confirm your institutional email address.
          </Text>

          <View style={styles.card}>
            {EMAIL_VERIFICATION_MODE === 'offline' && (
              <View style={styles.devBanner}>
                <Ionicons
                  name="construct-outline"
                  size={16}
                  color={Colors.primaryAlt}
                />
                <Text style={styles.devBannerText}>
                  DEV/OFFLINE MODE — no email was actually sent. This code is
                  shown here only as a temporary stand-in.
                </Text>
              </View>
            )}

            {EMAIL_VERIFICATION_MODE === 'offline' && (
              <View style={styles.codeDisplayBox}>
                {loadingCode ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.codeDisplayText}>
                    {displayedCode ?? '——————'}
                  </Text>
                )}
              </View>
            )}

            <Text style={styles.fieldLabel}>ENTER THE 6-DIGIT CODE</Text>
            <View style={[styles.inputRow, !!error && styles.inputRowError]}>
              <Ionicons
                name="keypad-outline"
                size={18}
                color={Colors.textSecondary}
              />
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={Colors.textMuted}
                value={codeInput}
                onChangeText={v => {
                  setCodeInput(v.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH));
                  if (error) setError('');
                }}
                keyboardType="number-pad"
                maxLength={CODE_LENGTH}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                styles.continueBtn,
                !canVerify && styles.continueBtnDisabled,
              ]}
              activeOpacity={canVerify ? 0.85 : 1}
              onPress={handleVerify}
              disabled={!canVerify}
            >
              {verifying ? (
                <ActivityIndicator color={Colors.textOnYellow} />
              ) : (
                <>
                  <Text style={styles.continueBtnText}>Verify</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={Colors.textOnYellow}
                  />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendBtn}
              activeOpacity={0.7}
              onPress={handleResend}
              disabled={resending}
            >
              {resending ? (
                <ActivityIndicator color={Colors.primary} size="small" />
              ) : (
                <Text style={styles.resendText}>Regenerate code</Text>
              )}
            </TouchableOpacity>
          </View>
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

  topBarTrack: {
    height: 4,
    backgroundColor: Colors.surface,
  },
  topBarFill: {
    width: '25%',
    height: 4,
    backgroundColor: Colors.primary,
  },

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

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },

  devBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceMid,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  devBannerText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.primaryAlt,
    lineHeight: 18,
  },

  codeDisplayBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceMid,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  codeDisplayText: {
    fontSize: Typography.size.hero,
    fontWeight: Typography.weight.black,
    color: Colors.primary,
    letterSpacing: 6,
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
    fontSize: Typography.size.lg,
    letterSpacing: 4,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
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
    marginTop: Spacing.lg,
  },
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueBtnText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textOnYellow,
  },

  resendBtn: {
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  resendText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
  },
});
