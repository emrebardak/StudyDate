import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../theme';

const { width } = Dimensions.get('window');

// ── Mock Data ────────────────────────────────────────────────────────────────
const UPCOMING_SESSIONS = [
  {
    id: '1',
    timeLabel: 'TODAY',
    timeRange: '14:00 - 16:00',
    subject: 'Advanced Calculus',
    location: 'Main Library, 3rd Floor',
    partnerName: 'Elena R.',
    hasPhoto: true,
  },
  {
    id: '2',
    timeLabel: 'TOMORROW',
    timeRange: '09:30 - 11:00',
    subject: 'Organic Chemistry',
    location: 'Café Nova, East Campus',
    partnerName: 'Marcus T.',
    hasPhoto: false,
  },
];

const LIKED_PROFILES = [
  { id: '1', name: 'Elena R.', department: 'Mathematics' },
  { id: '2', name: 'James L.', department: 'Physics' },
  { id: '3', name: 'Mia W.', department: 'Literature' },
  { id: '4', name: 'Omar S.', department: 'Engineering' },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function SessionCard({ session }: { session: typeof UPCOMING_SESSIONS[0] }) {
  return (
    <View style={styles.sessionCard}>
      {/* left accent bar */}
      <View style={styles.sessionAccentBar} />

      <View style={styles.sessionContent}>
        {/* time row */}
        <View style={styles.sessionTimeRow}>
          <Text style={styles.sessionTimeLabel}>
            {session.timeLabel} • {session.timeRange}
          </Text>
          <Ionicons name="bookmark-outline" size={16} color={Colors.textMuted} />
        </View>

        {/* subject */}
        <Text style={styles.sessionSubject}>{session.subject}</Text>

        {/* location */}
        <View style={styles.sessionLocationRow}>
          <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.sessionLocation}>{session.location}</Text>
        </View>

        {/* partner */}
        <View style={styles.sessionPartnerRow}>
          {session.hasPhoto ? (
            <View style={styles.partnerAvatarFilled}>
              <Ionicons name="person" size={14} color={Colors.white} />
            </View>
          ) : (
            <View style={styles.partnerAvatarOutline}>
              <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
            </View>
          )}
          <Text style={styles.partnerName}>with {session.partnerName}</Text>
        </View>
      </View>
    </View>
  );
}

function LikedProfileCard({ profile }: { profile: typeof LIKED_PROFILES[0] }) {
  return (
    <TouchableOpacity style={styles.likedCard} activeOpacity={0.85}>
      {/* photo placeholder */}
      <View style={styles.likedPhotoPlaceholder}>
        <Ionicons name="person" size={30} color={Colors.textLight} />
      </View>
      <Text style={styles.likedName}>{profile.name}</Text>
      <Text style={styles.likedDept}>{profile.department.toUpperCase()}</Text>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function DashboardScreen({ navigation }: { navigation: any }) {
  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="menu" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>StudyMatch</Text>

        <TouchableOpacity style={styles.avatarCircle}>
          <Ionicons name="person" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* ── Scrollable Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Upcoming Sessions ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        {UPCOMING_SESSIONS.map((s) => (
          <SessionCard key={s.id} session={s} />
        ))}

        {/* ── Liked Profiles ── */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <Text style={styles.sectionTitle}>Liked Profiles</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.likedRow}
        >
          {LIKED_PROFILES.map((p) => (
            <LikedProfileCard key={p.id} profile={p} />
          ))}
        </ScrollView>
      </ScrollView>

      {/* ── Bottom Tab Bar ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItemActive}>
          <Ionicons name="grid" size={22} color={Colors.primary} />
          <Text style={styles.tabLabelActive}>Dashboard</Text>
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
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
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
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  viewAll: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.accent,
    letterSpacing: 0.5,
  },

  // Session card
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceWarm,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadow.card,
  },
  sessionAccentBar: {
    width: 4,
    backgroundColor: Colors.primary,
  },
  sessionContent: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  sessionTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTimeLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  sessionSubject: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  sessionLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  sessionLocation: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
  },
  sessionPartnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  partnerAvatarFilled: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerAvatarOutline: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerName: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },

  // Liked profiles
  likedRow: {
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  likedCard: {
    width: 120,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    ...Shadow.card,
  },
  likedPhotoPlaceholder: {
    width: 120,
    height: 110,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likedName: {
    marginTop: Spacing.sm,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  likedDept: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
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
