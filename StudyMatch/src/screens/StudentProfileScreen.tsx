import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme';

const { width } = Dimensions.get('window');

// ── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_PROFILE = {
  name: 'Eleanor Vance',
  age: 21,
  department: 'Comp. Sci.',
  year: 'Junior',
  trustScore: 4.8,
  sessionCount: 12,
  bio: '"Looking for someone to silently suffer through Data Structures with. I bring excellent coffee and quiet desperation. Usually at the main library 3rd floor."',
  availability: [
    { label: 'Tue Eves', active: true },
    { label: 'Thu Eves', active: true },
    { label: 'Weekends', active: false },
  ],
  badges: [
    { icon: '⏱️', label: 'Punctual' },
    { icon: '🤫', label: 'Silent & Focused' },
    { icon: '☕', label: 'Coffee Provider' },
    { icon: '🍅', label: 'Pomodoro User' },
  ],
};

// ── Star Rating ────────────────────────────────────────────────────────────────
function StarRating({ score }: { score: number }) {
  const full = Math.floor(score);
  const half = score - full >= 0.5;
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }).map((_, i) => {
        let icon = 'star-outline';
        if (i < full) icon = 'star';
        else if (i === full && half) icon = 'star-half';
        return (
          <Ionicons key={i} name={icon} size={18} color={Colors.primary} />
        );
      })}
    </View>
  );
}

// ── Availability Chip ──────────────────────────────────────────────────────────
function AvailabilityChip({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={[styles.chip, active && styles.chipActive]}>
      {active && <View style={styles.chipDot} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </View>
  );
}

// ── Badge Chip (2×2 grid) ──────────────────────────────────────────────────────
function BadgeChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.badgeChip}>
      <Text style={styles.badgeIcon}>{icon}</Text>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function StudentProfileScreen({
  navigation,
}: {
  navigation: any;
}) {
  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {/* "← BACK TO MATCHES" row */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="arrow-back" size={14} color={Colors.textMuted} />
          <Text style={styles.backText}>BACK TO MATCHES</Text>
        </TouchableOpacity>

        {/* "StudyMatch" + avatar row */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>StudyMatch</Text>
          <TouchableOpacity style={styles.avatarCircle}>
            <Ionicons name="person" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Photo with name overlaid ── */}
        <View style={styles.heroContainer}>
          <View style={styles.heroPhoto}>
            <Ionicons name="person" size={80} color={Colors.textMuted} />
          </View>
          {/* Gradient-style overlay at bottom of photo */}
          <View style={styles.heroOverlay}>
            <Text style={styles.heroName}>
              {MOCK_PROFILE.name}, {MOCK_PROFILE.age}
            </Text>
            <Text style={styles.heroDept}>
              {MOCK_PROFILE.department.toUpperCase()} · {MOCK_PROFILE.year.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* ── Study Bio ── */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>STUDY BIO</Text>
            <Text style={styles.bioText}>{MOCK_PROFILE.bio}</Text>
          </View>

          {/* ── Trust Score ── */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>TRUST SCORE</Text>
            <View style={styles.trustRow}>
              <View>
                <StarRating score={MOCK_PROFILE.trustScore} />
              </View>
              <View style={styles.trustRight}>
                <Text style={styles.trustScore}>{MOCK_PROFILE.trustScore}</Text>
                <Text style={styles.sessionCount}>
                  {MOCK_PROFILE.sessionCount} sessions
                </Text>
              </View>
            </View>
          </View>

          {/* ── Availability ── */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>AVAILABILITY</Text>
            <View style={styles.chipsRow}>
              {MOCK_PROFILE.availability.map((a) => (
                <AvailabilityChip key={a.label} label={a.label} active={a.active} />
              ))}
            </View>
          </View>

          {/* ── Study Style Badges (2×2 grid) ── */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>STUDY STYLE BADGES</Text>
            <View style={styles.badgeDivider} />
            <View style={styles.badgesGrid}>
              {MOCK_PROFILE.badges.map((b) => (
                <BadgeChip key={b.label} icon={b.icon} label={b.label} />
              ))}
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom Action Buttons ── */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.passBtn}>
          <Text style={styles.passBtnText}>PASS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.connectBtn}>
          <Text style={styles.connectBtnText}>CONNECT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    paddingTop: 52,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  backText: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    fontWeight: Typography.weight.medium,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xl },

  // Hero photo
  heroContainer: {
    width: '100%',
    height: 320,
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Dark scrim + name text, absolutely positioned at photo bottom
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.base,
    backgroundColor: 'rgba(0, 8, 20, 0.6)',
  },
  heroName: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    fontStyle: 'italic',
    color: Colors.textPrimary,
  },
  heroDept: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    letterSpacing: 1,
    fontWeight: Typography.weight.medium,
    marginTop: 4,
  },

  // Content padding
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },

  // Cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadow.card,
  },
  cardLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },

  // Bio
  bioText: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },

  // Trust score
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: Spacing.xs,
  },
  trustRight: {
    alignItems: 'flex-end',
  },
  trustScore: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  sessionCount: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Availability chips
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: Colors.surfaceHigh,
    backgroundColor: Colors.surfaceMid,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.weight.medium,
  },

  // Badges
  badgeDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    // Two columns: total width minus card padding (×2) minus one gap, divided by 2
    width: (width - Spacing.base * 4 - Spacing.sm) / 2,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  badgeIcon: {
    fontSize: 16,
  },
  badgeLabel: {
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.medium,
    flexShrink: 1,
  },

  // Bottom action buttons
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    paddingBottom: 32,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  passBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.surfaceHigh,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceHigh,
  },
  passBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  connectBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    ...Shadow.glow,
  },
  connectBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textOnYellow,
    letterSpacing: 1,
  },
});
