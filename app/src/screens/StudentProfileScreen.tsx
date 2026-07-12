import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../theme';

const { width } = Dimensions.get('window');

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_PROFILE = {
  name: 'Eleanor Vance',
  age: 21,
  department: 'Comp. Sci.',
  year: 'Junior',
  trustScore: 4.8,
  sessionCount: 12,
  bio: '"Looking for someone to silently suffer through Data Structures with. I bring excellent coffee and quiet desperation. Usually at the main library 3rd floor."',
  availability: ['Tue Eves', 'Thu Eves', 'Weekends'],
  badges: [
    { icon: '⏱️', label: 'Punctual' },
    { icon: '🤫', label: 'Silent & Focused' },
    { icon: '☕', label: 'Coffee Provider' },
    { icon: '🍅', label: 'Pomodoro User' },
  ],
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function StarRating({ score }: { score: number }) {
  const full = Math.floor(score);
  const half = score - full >= 0.5;
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }).map((_, i) => {
        let icon: 'star' | 'star-half' | 'star-outline' = 'star-outline';
        if (i < full) icon = 'star';
        else if (i === full && half) icon = 'star-half';
        return (
          <Ionicons key={i} name={icon} size={18} color={Colors.primary} />
        );
      })}
    </View>
  );
}

function AvailabilityChip({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <View
      style={[
        styles.availChip,
        active && styles.availChipActive,
      ]}
    >
      {active && <View style={styles.availDot} />}
      <Text style={[styles.availText, active && styles.availTextActive]}>
        {label}
      </Text>
    </View>
  );
}

function BadgeChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.badgeChip}>
      <Text style={styles.badgeIcon}>{icon}</Text>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function StudentProfileScreen({ navigation }: { navigation: any }) {
  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="arrow-back" size={16} color={Colors.textMuted} />
          <Text style={styles.backText}>BACK TO MATCHES</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <Text style={styles.headerTitle}>StudyMatch</Text>
          <TouchableOpacity style={styles.avatarCircle}>
            <Ionicons name="person" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Photo ── */}
        <View style={styles.heroPhoto}>
          <Ionicons name="person" size={64} color={Colors.textLight} />
          <Text style={styles.photoPlaceholderText}>Photo</Text>
        </View>

        {/* ── Name ── */}
        <View style={styles.nameBanner}>
          <Text style={styles.deptYearText}>
            {MOCK_PROFILE.department.toUpperCase()} • {MOCK_PROFILE.year.toUpperCase()}
          </Text>
          <Text style={styles.nameText}>
            {MOCK_PROFILE.name}, {MOCK_PROFILE.age}
          </Text>
        </View>

        {/* ── Study Bio ── */}
        <View style={styles.section}>
          <View style={styles.bioLabelRow}>
            <Ionicons name="document-text-outline" size={14} color={Colors.primary} />
            <Text style={styles.sectionLabel}>STUDY BIO</Text>
          </View>
          <Text style={styles.bioText}>{MOCK_PROFILE.bio}</Text>
        </View>

        {/* ── Trust Score ── */}
        <View style={styles.section}>
          <View style={styles.trustRow}>
            <View>
              <Text style={styles.sectionLabel}>TRUST SCORE</Text>
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
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AVAILABILITY</Text>
          <View style={styles.chipsRow}>
            {MOCK_PROFILE.availability.map((a, i) => (
              <AvailabilityChip key={a} label={a} active={i < 2} />
            ))}
          </View>
        </View>

        {/* ── Badges ── */}
        <View style={styles.section}>
          <View style={styles.badgeLabelRow}>
            <Text style={styles.badgeSectionIcon}>🎓</Text>
            <Text style={styles.sectionLabel}>STUDY STYLE BADGES</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.badgesGrid}>
            {MOCK_PROFILE.badges.map((b) => (
              <BadgeChip key={b.label} icon={b.icon} label={b.label} />
            ))}
          </View>
        </View>

        <View style={{ height: Spacing.xxxl + 20 }} />
      </ScrollView>

      {/* ── Bottom Actions ── */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.passBtn}>
          <Ionicons name="close" size={16} color={Colors.textMuted} />
          <Text style={styles.passBtnText}>PASS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.connectBtn}>
          <Ionicons name="chatbubble" size={16} color={Colors.white} />
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
    paddingTop: 56,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
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
    letterSpacing: 0.5,
    fontWeight: Typography.weight.medium,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxl },

  // Hero photo
  heroPhoto: {
    width: '100%',
    height: width * 0.85,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  photoPlaceholderText: {
    fontSize: Typography.size.md,
    color: Colors.textLight,
  },

  // Name banner
  nameBanner: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.background,
  },
  deptYearText: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
    fontWeight: Typography.weight.medium,
  },
  nameText: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },

  // Sections
  section: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.base,
    ...Shadow.card,
  },
  sectionLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },

  // Bio
  bioLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  bioText: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },

  // Trust
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
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  sessionCount: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Availability
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  availChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
  },
  availChipActive: {
    borderColor: Colors.primaryMuted,
    backgroundColor: Colors.surfaceWarm,
  },
  availDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  availText: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
  },
  availTextActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.weight.medium,
  },

  // Badges
  badgeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  badgeSectionIcon: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
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
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  badgeIcon: {
    fontSize: 16,
  },
  badgeLabel: {
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.medium,
  },

  // Bottom actions
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    paddingBottom: 32,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.md,
  },
  passBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  passBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  connectBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    ...Shadow.card,
  },
  connectBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
});
