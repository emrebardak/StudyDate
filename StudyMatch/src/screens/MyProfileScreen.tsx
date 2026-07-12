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
import { Colors, Spacing, Radius, Shadow, Typography } from '../theme';
import FilmRoll from '../components/FilmRoll';
import VintageStamp from '../components/VintageStamp';
import { AUDIO_STAMPS, PACING_STAMPS, FUEL_STAMPS } from '../types';

const { width } = Dimensions.get('window');

// ── Mock Data ─────────────────────────────────────────────────────────────────
const FILM_PHOTOS = [
  { id: '1', caption: "Eleanor V. — Oct '23" },
  { id: '2', caption: 'Library Mornings' },
  { id: '3', caption: 'Study Spot #3' },
];

const PROFILE = {
  name: 'Eleanor Vance',
  year: 'Junior',
  department: 'Computer Science',
  major: 'Computer Science',
  trustScore: 4.8,
  currentFocus: 'Mastering Data Structures',
  archivedNote:
    '"Always looking for a quiet spot near a window. I prefer long, uninterrupted blocks of study time, ideally with a steady supply of caffeine. Let\'s tackle these algorithms together."',
  achievements: [
    { icon: '⏱️', label: 'Punctual' },
    { icon: '🤫', label: 'Silent & Focused' },
    { icon: '☕', label: 'Coffee Provider' },
  ],
  audio: 'Headphones On / Ignored World' as const,
  pacing: 'Strict Pomodoro (25/5)' as const,
  fuel: 'Black Filter Coffee' as const,
};



// ── Achievement Badge ─────────────────────────────────────────────────────────
function AchievementBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.achievementBadge}>
      <Text style={styles.achievementIcon}>{icon}</Text>
      <Text style={styles.achievementLabel}>{label}</Text>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function MyProfileScreen({ navigation }: { navigation: any }) {
  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
          <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Film Roll ── */}
        <FilmRoll photos={FILM_PHOTOS} />

        {/* ── Name ── */}
        <Text style={styles.profileName}>{PROFILE.name}</Text>
        <Text style={styles.profileMeta}>
          {PROFILE.year.toUpperCase()} • {PROFILE.department.toUpperCase()}
        </Text>

        {/* ── Academic Stats ── */}
        <View style={styles.card}>
          <View style={styles.statsLabelRow}>
            <View style={styles.redDot} />
            <Text style={styles.cardSectionLabel}>ACADEMIC STATS</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsGrid}>
            <View style={styles.statsCell}>
              <Text style={styles.statsCellLabel}>MAJOR</Text>
              <Text style={styles.statsCellValue}>{PROFILE.major}</Text>
            </View>
            <View style={styles.statsVertDivider} />
            <View style={styles.statsCell}>
              <Text style={styles.statsCellLabel}>TRUST SCORE</Text>
              <View style={styles.trustRow}>
                <Ionicons name="star" size={14} color={Colors.primary} />
                <Text style={styles.trustValue}>{PROFILE.trustScore}</Text>
                <Text style={styles.trustMax}> / 5.0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Current Study Focus ── */}
        <Text style={styles.focusLabel}>CURRENT STUDY FOCUS</Text>
        <View style={styles.focusBox}>
          <Text style={styles.focusText}>{PROFILE.currentFocus}</Text>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="pencil-outline" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Achievements ── */}
        <View style={styles.achievementsCard}>
          <Text style={styles.achievementsLabel}>ACHIEVEMENTS</Text>
          <View style={styles.achievementsGrid}>
            {PROFILE.achievements.map((a) => (
              <AchievementBadge key={a.label} icon={a.icon} label={a.label} />
            ))}
          </View>
        </View>

        {/* ── Study Vibe Stamps ── */}
        <View style={styles.vibeSection}>
          <Text style={styles.vibeLabel}>STUDY VIBE</Text>
          <View style={styles.stampsRow}>
            <View style={{ marginTop: 6 }}>
              <VintageStamp stamp={AUDIO_STAMPS[PROFILE.audio]} size="lg" />
            </View>
            <View style={{ marginTop: -4 }}>
              <VintageStamp stamp={PACING_STAMPS[PROFILE.pacing]} size="lg" />
            </View>
            <View style={{ marginTop: 10 }}>
              <VintageStamp stamp={FUEL_STAMPS[PROFILE.fuel]} size="lg" />
            </View>
          </View>
        </View>

        {/* ── Archived Notes ── */}
        <View style={styles.archivedSection}>
          <Text style={styles.archivedLabel}>ARCHIVED NOTES</Text>
          <View style={styles.archivedBorder} />
          <Text style={styles.archivedText}>{PROFILE.archivedNote}</Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>


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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: 56,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xl },

  // Vibe stamps
  vibeSection: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
  },
  vibeLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    fontFamily: 'monospace',
  },
  stampsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },

  // Name
  profileName: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: Spacing.base,
  },
  profileMeta: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.base,
  },

  // Academic stats card
  card: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadow.card,
  },
  statsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.danger,
  },
  cardSectionLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  statsDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsCell: {
    flex: 1,
    gap: Spacing.xs,
  },
  statsVertDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.base,
  },
  statsCellLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  statsCellValue: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  trustValue: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  trustMax: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
  },

  // Focus
  focusLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  focusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.base,
  },
  focusText: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },

  // Achievements
  achievementsCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.accentBg,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  achievementsLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.badgeBorder,
  },
  achievementIcon: {
    fontSize: 16,
  },
  achievementLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textPrimary,
  },

  // Archived notes
  archivedSection: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    paddingTop: Spacing.sm,
  },
  archivedLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.sm,
  },
  archivedBorder: {
    width: 3,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: Spacing.xxl,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  archivedText: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    paddingLeft: Spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },


});
