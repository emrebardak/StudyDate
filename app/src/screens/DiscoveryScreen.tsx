import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../theme';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - Spacing.base * 2;

// ── Mock card data ─────────────────────────────────────────────────────────────
const MOCK_CARD = {
  name: 'Eleanor',
  age: 21,
  department: 'Computer Science',
  year: 'Junior',
  rating: '4.8',
  goalText: '"Mastering Data Structures - Focusing on Big O notation today."',
  badges: ['Punctual', 'Silent & Focused'],
};

// ── Badge chip ─────────────────────────────────────────────────────────────────
function BadgeChip({ label, dotColor }: { label: string; dotColor: string }) {
  return (
    <View style={styles.badgeChip}>
      <View style={[styles.badgeDot, { backgroundColor: dotColor }]} />
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

// ── Swipe Card ─────────────────────────────────────────────────────────────────
function SwipeCard() {
  return (
    <View style={styles.card}>
      {/* Blurred photo simulation */}
      <View style={styles.photoArea}>
        <View style={styles.photoBlurOverlay} />
        <Ionicons
          name="eye-off-outline"
          size={40}
          color="rgba(255,255,255,0.8)"
          style={styles.eyeIcon}
        />
      </View>

      {/* Card info */}
      <View style={styles.cardInfo}>
        {/* Name row */}
        <View style={styles.nameRow}>
          <Text style={styles.nameText}>
            {MOCK_CARD.name}, {MOCK_CARD.age}
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star-outline" size={13} color={Colors.accent} />
            <Text style={styles.ratingText}>
              {MOCK_CARD.rating}/5.0
            </Text>
          </View>
        </View>

        {/* Department */}
        <Text style={styles.deptText}>
          {MOCK_CARD.department.toUpperCase()}, {MOCK_CARD.year.toUpperCase()}
        </Text>

        {/* Goal */}
        <Text style={styles.goalLabel}>CURRENT GOAL</Text>
        <View style={styles.goalBox}>
          <Text style={styles.goalText}>{MOCK_CARD.goalText}</Text>
        </View>

        {/* Badges */}
        <View style={styles.badgesRow}>
          <BadgeChip label="Punctual" dotColor={Colors.textPrimary} />
          <BadgeChip label="Silent & Focused" dotColor={Colors.danger} />
        </View>
      </View>
    </View>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      {/* Illustration placeholder */}
      <View style={styles.emptyIllustration}>
        <Ionicons name="book-outline" size={64} color={Colors.primaryMuted} />
      </View>

      <Text style={styles.emptyTitle}>The Archive is Quiet</Text>
      <Text style={styles.emptySubtitle}>
        Check back later for new study partners.
      </Text>

      <TouchableOpacity style={styles.expandBtn}>
        <Ionicons name="refresh-outline" size={14} color={Colors.primary} />
        <Text style={styles.expandBtnText}>EXPAND SEARCH</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function DiscoveryScreen({ navigation }: { navigation: any }) {
  // Toggle to false to preview the empty state
  const [hasCards, setHasCards] = useState(true);

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Ionicons name="book-outline" size={22} color={Colors.textPrimary} />
        <Text style={styles.headerTitle}>StudyMatch</Text>
        <TouchableOpacity onPress={() => setHasCards((v) => !v)}>
          <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {hasCards ? (
        /* ── Swipe State ── */
        <View style={styles.swipeContainer}>
          <SwipeCard />

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.btnPass}>
              <Ionicons name="close" size={28} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnLike}>
              <Ionicons name="checkmark" size={28} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <EmptyState />
      )}

      {/* ── Bottom Tab Bar ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="grid-outline" size={22} color={Colors.tabInactive} />
          <Text style={styles.tabLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItemActive}>
          <View style={styles.tabActivePill}>
            <Ionicons name="hand-left-outline" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.tabLabelActive}>Match</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="chatbubble-outline" size={22} color={Colors.tabInactive} />
          <Text style={styles.tabLabel}>Chats</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="person-outline" size={22} color={Colors.tabInactive} />
          <Text style={styles.tabLabel}>Profile</Text>
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
    letterSpacing: 0.5,
  },

  // Swipe layout
  swipeContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },

  // Card
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadow.card,
  },
  photoArea: {
    width: '100%',
    height: height * 0.28,
    backgroundColor: '#B0A090',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBlurOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(140,110,90,0.55)',
  },
  eyeIcon: {
    position: 'absolute',
  },
  cardInfo: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: Typography.size.sm,
    color: Colors.accent,
    fontWeight: Typography.weight.semibold,
  },
  deptText: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    fontWeight: Typography.weight.medium,
  },
  goalLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    fontWeight: Typography.weight.semibold,
    marginTop: Spacing.xs,
  },
  goalBox: {
    backgroundColor: Colors.surfaceWarm,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  goalText: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    backgroundColor: Colors.surface,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  badgeLabel: {
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },

  // Action buttons
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl * 2,
    marginTop: Spacing.xl,
  },
  btnPass: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  btnLike: {
    width: 68,
    height: 68,
    borderRadius: Radius.full,
    backgroundColor: '#5C4A2A',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyIllustration: {
    width: width * 0.8,
    height: 180,
    backgroundColor: '#DDD4C8',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.size.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceWarm,
  },
  expandBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    letterSpacing: 0.8,
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
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tabItemActive: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tabActivePill: {
    backgroundColor: Colors.accentBg,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: Typography.size.xs,
    color: Colors.tabInactive,
  },
  tabLabelActive: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },
});
