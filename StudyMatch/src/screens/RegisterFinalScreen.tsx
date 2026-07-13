import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { supabase } from '../lib/supabase';
import { registrationToProfileUpdate } from '../data/mappers';

export default function RegisterFinalScreen({ navigation, route }: { navigation: any; route: any }) {
  const incoming = route?.params?.data ?? {};
  const [focusGoal, setFocusGoal] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Random 4-digit StudyMatch id, generated once per mount
  const smId = useRef(Math.floor(1000 + Math.random() * 9000)).current;

  const previewName = incoming.fullName || 'New Scholar';
  const previewDept = incoming.department || 'Undeclared Department';

  async function handleComplete() {
    setError('');
    setSaving(true);
    try {
      // The session was established at Step 1 (signUp). Persist everything collected
      // across the flow into the user's own public.users row. RLS restricts the UPDATE
      // to that row; we filter by the authenticated user's id explicitly.
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) {
        setError('Your session expired. Please restart registration.');
        return;
      }
      const payload = registrationToProfileUpdate({ ...incoming, focusGoal });
      const { error: updateError } = await supabase
        .from('users')
        .update(payload)
        .eq('id', userId);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Step header */}
          <Text style={styles.stepLabel}>STEP 4 OF 4</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>

          {/* Hero */}
          <Text style={styles.heroTitle}>Final Setup</Text>
          <Text style={styles.heroDesc}>
            Complete your academic profile. Set your immediate focus and
            establish your presence in the global lobby.
          </Text>

          {/* ── Today's Focus Goal ── */}
          <Text style={styles.sectionTitle}>Today's Focus Goal</Text>
          <Text style={styles.sectionDesc}>
            What is your primary academic objective for this session?
          </Text>
          <View style={styles.goalInputWrap}>
            <TextInput
              style={styles.goalInput}
              placeholder="e.g., Finalize thesis methodology chapter..."
              placeholderTextColor={Colors.textMuted}
              value={focusGoal}
              onChangeText={setFocusGoal}
              multiline
            />
          </View>

          {/* ── Profile Photo ── */}
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <Text style={styles.sectionDesc}>
            Upload a professional portrait for your academic card.
          </Text>
          <TouchableOpacity style={styles.uploadBox} activeOpacity={0.8}>
            <Ionicons name="cloud-upload-outline" size={44} color={Colors.primaryAlt} />
            <Text style={styles.uploadText}>Drag & drop or click to browse</Text>
          </TouchableOpacity>

          {/* ── Complete CTA ── */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.completeBtn, saving && styles.completeBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleComplete}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.textOnYellow} />
            ) : (
              <Text style={styles.completeBtnText}>Complete Archive</Text>
            )}
          </TouchableOpacity>

          {/* ── Live Preview ── */}
          <Text style={styles.previewLabel}>LIVE PREVIEW</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewIdLabel}>STUDYMATCH ID</Text>
                <Text style={styles.previewIdValue}>#SM-{smId}</Text>
              </View>
              <View style={styles.scholarPill}>
                <Text style={styles.scholarPillText}>SCHOLAR</Text>
              </View>
            </View>

            <View style={styles.previewBody}>
              <View style={styles.previewAvatar}>
                <Ionicons name="person" size={30} color={Colors.textMuted} />
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{previewName}</Text>
                <View style={styles.previewDeptRow}>
                  <Ionicons name="school-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.previewDept}>{previewDept}</Text>
                </View>
              </View>
            </View>

            {focusGoal.trim().length > 0 && (
              <View style={styles.previewGoal}>
                <Text style={styles.previewGoalText} numberOfLines={2}>
                  "{focusGoal.trim()}"
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.previewFooter}>
            This card will represent you in global lobbies and study sessions.
          </Text>

        </ScrollView>
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
  scrollContent: {
    padding: Spacing.base,
    paddingTop: 56,
    paddingBottom: Spacing.xxl,
  },

  // Step header + progress
  stepLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceMid,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },

  // Hero
  heroTitle: {
    fontSize: Typography.size.hero,
    fontWeight: Typography.weight.black,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  heroDesc: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xxl,
  },

  // Sections
  sectionTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  sectionDesc: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },

  // Goal input
  goalInputWrap: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: Radius.sm,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    marginBottom: Spacing.xxl,
  },
  goalInput: {
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    padding: Spacing.md,
    minHeight: 56,
    textAlignVertical: 'top',
  },

  // Upload box
  uploadBox: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  uploadText: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
  },

  // Complete CTA
  errorText: {
    fontSize: Typography.size.sm,
    color: Colors.danger,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  completeBtn: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    marginBottom: Spacing.xxl,
  },
  completeBtnDisabled: {
    opacity: 0.6,
  },
  completeBtnText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textOnYellow,
  },

  // Live preview
  previewLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  previewCard: {
    borderWidth: 1,
    borderColor: Colors.borderGold,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  previewIdLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  previewIdValue: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  scholarPill: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  scholarPillText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textOnYellow,
    letterSpacing: 1.2,
  },
  previewBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  previewAvatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceMid,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  previewName: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  previewDeptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  previewDept: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  previewGoal: {
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  previewGoalText: {
    fontSize: Typography.size.sm,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  previewFooter: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.5,
  },
});
