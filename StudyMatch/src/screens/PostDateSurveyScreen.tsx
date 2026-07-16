import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { supabase } from '../lib/supabase';
import { toFriendlyErrorMessage } from '../lib/errors';

// Q2 options — captured but not scored (PRD §7 only lists point values for the
// meeting-outcome question). Q3 badges — the 4 fixed PRD §7 badge names, plus a
// "Skip" option since awarding a badge is optional even when the meeting happened.
const ENVIRONMENTS = ['Highly Focused', 'Casual', 'Off-topic'] as const;
const BADGES = [
  { key: 'Punctual', icon: 'time' },
  { key: 'Silent & Focused', icon: 'volume-mute' },
  { key: 'Great Explainer', icon: 'bulb' },
  { key: 'Good Break Buddy', icon: 'cafe' },
] as const;

function Chip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {!!icon && (
        <Ionicons
          name={icon as any}
          size={16}
          color={active ? Colors.primary : Colors.textSecondary}
        />
      )}
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function PostDateSurveyScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const studyDateId: string | undefined = route?.params?.studyDateId;
  const partnerName: string =
    route?.params?.partnerName || 'your study partner';

  const [met, setMet] = useState<boolean | null>(null);
  const [environment, setEnvironment] = useState<
    (typeof ENVIRONMENTS)[number] | null
  >(null);
  const [badge, setBadge] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(
    metAnswer: boolean,
    environmentAnswer: string | null,
    badgeAnswer: string | null,
  ) {
    if (!studyDateId || saving) return;
    setSaving(true);
    setError('');
    try {
      const { error: rpcError } = await supabase.rpc(
        'submit_post_date_survey',
        {
          p_study_date_id: studyDateId,
          p_met: metAnswer,
          p_environment: environmentAnswer,
          p_badge: badgeAnswer,
        },
      );
      if (rpcError) {
        setError(
          toFriendlyErrorMessage(rpcError, {
            duplicateMessage: 'You already rated this study date.',
          }),
        );
        return;
      }
      navigation?.goBack?.();
    } catch (e: any) {
      setError(
        toFriendlyErrorMessage(e, {
          fallbackMessage: 'Failed to submit. Please try again.',
        }),
      );
    } finally {
      setSaving(false);
    }
  }

  function handleMetAnswer(answer: boolean) {
    setMet(answer);
    if (!answer) {
      // A meeting that didn't happen has no environment/badge to ask about.
      submit(false, null, null);
    }
  }

  const canSubmit = met === true && environment !== null && !saving;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={() => navigation?.goBack?.()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post-Date Survey</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heroTitle}>How did it go?</Text>
        <Text style={styles.heroDesc}>
          Rate your study date with {partnerName}. This stays private and only
          affects their trust score and badges.
        </Text>

        <Text style={styles.questionLabel}>DID YOU MEET UP?</Text>
        <View style={styles.yesNoRow}>
          <TouchableOpacity
            style={[styles.yesNoBtn, met === true && styles.yesNoBtnActive]}
            activeOpacity={0.85}
            onPress={() => handleMetAnswer(true)}
            disabled={saving}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={met === true ? Colors.textOnYellow : Colors.textPrimary}
            />
            <Text
              style={[styles.yesNoText, met === true && styles.yesNoTextActive]}
            >
              Yes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.yesNoBtn, met === false && styles.yesNoBtnActive]}
            activeOpacity={0.85}
            onPress={() => handleMetAnswer(false)}
            disabled={saving}
          >
            <Ionicons
              name="close-circle-outline"
              size={20}
              color={met === false ? Colors.textOnYellow : Colors.textPrimary}
            />
            <Text
              style={[
                styles.yesNoText,
                met === false && styles.yesNoTextActive,
              ]}
            >
              No
            </Text>
          </TouchableOpacity>
        </View>

        {met === true && (
          <>
            <Text style={styles.questionLabel}>
              WAS THE ENVIRONMENT PRODUCTIVE?
            </Text>
            <View style={styles.chipGrid}>
              {ENVIRONMENTS.map(e => (
                <Chip
                  key={e}
                  label={e}
                  active={environment === e}
                  onPress={() => setEnvironment(e)}
                />
              ))}
            </View>

            <Text style={styles.questionLabel}>AWARD A BADGE (OPTIONAL)</Text>
            <View style={styles.chipGrid}>
              {BADGES.map(b => (
                <Chip
                  key={b.key}
                  label={b.key}
                  icon={b.icon}
                  active={badge === b.key}
                  onPress={() =>
                    setBadge(prev => (prev === b.key ? null : b.key))
                  }
                />
              ))}
            </View>
          </>
        )}

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {met === true && (
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            activeOpacity={canSubmit ? 0.85 : 1}
            onPress={() => submit(true, environment, badge)}
            disabled={!canSubmit}
          >
            {saving ? (
              <ActivityIndicator color={Colors.textOnYellow} />
            ) : (
              <Text style={styles.submitBtnText}>Submit</Text>
            )}
          </TouchableOpacity>
        )}

        {met === false && saving && (
          <View style={styles.savingRow}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMid,
  },
  headerSide: {
    width: 30,
  },
  headerTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  heroTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.black,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  heroDesc: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  questionLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  yesNoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceMid,
    borderWidth: 1.5,
    borderColor: Colors.surfaceMid,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
  },
  yesNoBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  yesNoText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  yesNoTextActive: {
    color: Colors.textOnYellow,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceMid,
    borderWidth: 1,
    borderColor: Colors.surfaceMid,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  chipActive: {
    backgroundColor: Colors.surfaceHigh,
    borderColor: Colors.primary,
  },
  chipLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textSecondary,
  },
  chipLabelActive: {
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },
  errorText: {
    fontSize: Typography.size.sm,
    color: Colors.danger,
    marginTop: Spacing.lg,
    lineHeight: 20,
  },
  submitBtn: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    marginTop: Spacing.xl,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textOnYellow,
  },
  savingRow: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
});
