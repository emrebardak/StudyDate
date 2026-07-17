import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';

const TRAITS = [
  { key: 'Night Owl', icon: 'moon-outline' },
  { key: 'Coffee Fueled', icon: 'cafe-outline' },
  { key: 'Early Bird', icon: 'sunny-outline' },
  { key: 'Library Lover', icon: 'book-outline' },
  { key: 'Group Study', icon: 'people-outline' },
  { key: 'Solo Focus', icon: 'headset-outline' },
  { key: 'Pomodoro', icon: 'timer-outline' },
  { key: 'Vocal Learner', icon: 'megaphone-outline' },
] as const;

export default function RegisterTraitsScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const incoming = route?.params?.data ?? {};
  const [selected, setSelected] = useState<string[]>(incoming.traits ?? []);

  const canContinue = selected.length > 0;

  function toggleTrait(trait: string) {
    setSelected(prev =>
      prev.includes(trait) ? prev.filter(t => t !== trait) : [...prev, trait],
    );
  }

  function handleContinue() {
    if (!canContinue) return;
    navigation.navigate('RegisterFinal', {
      data: { ...incoming, traits: selected },
    });
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Step header + progress */}
          <View style={styles.stepHeader}>
            <Text style={styles.stepLabel}>STEP 3 OF 4</Text>
            <Text style={styles.stepSection}>STUDY TRAITS</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '75%' }]} />
          </View>

          {/* Hero */}
          <Text style={styles.heroTitle}>What's your study style?</Text>
          <Text style={styles.heroDesc}>
            Select the traits that best describe your academic habits. This
            helps us match you with peers who complement your workflow.
          </Text>

          {/* ── Trait grid ── */}
          <View style={styles.grid}>
            {TRAITS.map(trait => {
              const isSelected = selected.includes(trait.key);
              return (
                <TouchableOpacity
                  key={trait.key}
                  style={[styles.traitCard, isSelected && styles.traitCardSel]}
                  activeOpacity={0.8}
                  onPress={() => toggleTrait(trait.key)}
                >
                  <Ionicons
                    name={trait.icon}
                    size={32}
                    color={isSelected ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.traitLabel,
                      isSelected && styles.traitLabelSel,
                    ]}
                  >
                    {trait.key.toUpperCase()}
                  </Text>
                  {isSelected && (
                    <View style={styles.traitCheck}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={Colors.primary}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Continue */}
          <TouchableOpacity
            style={[
              styles.continueBtn,
              !canContinue && styles.continueBtnDisabled,
            ]}
            activeOpacity={canContinue ? 0.85 : 1}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            <Text style={styles.continueBtnText}>Continue to Matches</Text>
          </TouchableOpacity>

          {/* Back */}
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: Spacing.xl,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },

  // Step header + progress
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  stepLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  stepSection: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    letterSpacing: 1.5,
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
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.black,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  heroDesc: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },

  // Trait grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.base,
  },
  traitCard: {
    width: '47%',
    aspectRatio: 1.15,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceMid,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    position: 'relative',
  },
  traitCardSel: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceHigh,
  },
  traitLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
    letterSpacing: 1,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
  traitLabelSel: {
    color: Colors.textPrimary,
  },
  traitCheck: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.xl,
  },

  // Continue
  continueBtn: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    marginBottom: Spacing.md,
  },
  continueBtnDisabled: {
    opacity: 0.45,
  },
  continueBtnText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textOnYellow,
  },

  // Back
  backBtn: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
  },
  backBtnText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
});
