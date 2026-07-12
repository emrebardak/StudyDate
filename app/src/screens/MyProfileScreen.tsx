import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../theme';

const { width } = Dimensions.get('window');

// ── Mock Data ─────────────────────────────────────────────────────────────────
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
  photos: [
    { id: '1', caption: "Eleanor V. - Oct '93" },
    { id: '2', caption: "Study spot" },
    { id: '3', caption: "Library days" },
  ],
};

// ── Polaroid Carousel ─────────────────────────────────────────────────────────
function PolaroidCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const CARD_WIDTH = width - Spacing.base * 4;

  function onScroll(e: any) {
    const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    setActiveIndex(index);
  }

  return (
    <View style={styles.carouselWrapper}>
      {/* Prev arrow */}
      {activeIndex > 0 && (
        <TouchableOpacity
          style={styles.arrowLeft}
          onPress={() => {
            flatRef.current?.scrollToIndex({ index: activeIndex - 1, animated: true });
            setActiveIndex(activeIndex - 1);
          }}
        >
          <Ionicons name="chevron-back" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatRef}
        data={PROFILE.photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.polaroidCard, { width: CARD_WIDTH }]}>
            {/* Photo area */}
            <View style={styles.polaroidPhoto}>
              <Ionicons name="image-outline" size={40} color={Colors.textLight} />
            </View>
            {/* Caption */}
            <Text style={styles.polaroidCaption}>{item.caption}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: Spacing.base * 2 }}
        style={{ width: width }}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
      />

      {/* Next arrow */}
      {activeIndex < PROFILE.photos.length - 1 && (
        <TouchableOpacity
          style={styles.arrowRight}
          onPress={() => {
            flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
            setActiveIndex(activeIndex + 1);
          }}
        >
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {PROFILE.photos.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

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
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Photo Carousel ── */}
        <PolaroidCarousel />

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

        {/* ── Archived Notes ── */}
        <View style={styles.archivedSection}>
          <Text style={styles.archivedLabel}>ARCHIVED NOTES</Text>
          <View style={styles.archivedBorder} />
          <Text style={styles.archivedText}>{PROFILE.archivedNote}</Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── Bottom Tab Bar ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="grid-outline" size={22} color={Colors.tabInactive} />
          <Text style={styles.tabLabel}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="aperture-outline" size={22} color={Colors.tabInactive} />
          <Text style={styles.tabLabel}>Match</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="chatbubble-outline" size={22} color={Colors.tabInactive} />
          <Text style={styles.tabLabel}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="calendar-outline" size={22} color={Colors.tabInactive} />
          <Text style={styles.tabLabel}>Planner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItemActive}>
          <Ionicons name="person" size={22} color={Colors.primary} />
          <Text style={styles.tabLabelActive}>Profile</Text>
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

  // Polaroid carousel
  carouselWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  polaroidCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    paddingBottom: Spacing.xl,
    ...Shadow.card,
    marginHorizontal: Spacing.xs,
  },
  polaroidPhoto: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  polaroidCaption: {
    fontSize: Typography.size.base,
    fontStyle: 'italic',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  arrowLeft: {
    position: 'absolute',
    left: Spacing.sm,
    top: '40%',
    zIndex: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    padding: Spacing.xs,
    ...Shadow.card,
  },
  arrowRight: {
    position: 'absolute',
    right: Spacing.sm,
    top: '40%',
    zIndex: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    padding: Spacing.xs,
    ...Shadow.card,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
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

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.tabBg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingBottom: 24,
    paddingTop: Spacing.sm,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 },
  tabItemActive: { flex: 1, alignItems: 'center', gap: 2 },
  tabLabel: { fontSize: Typography.size.xs, color: Colors.tabInactive },
  tabLabelActive: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },
});
