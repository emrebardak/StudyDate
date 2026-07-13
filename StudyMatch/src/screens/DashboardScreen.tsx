import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';



// ── Mock Data ─────────────────────────────────────────────────────────────────
const UPCOMING_SESSIONS = [
  {
    id: '1',
    day: '14',
    month: 'OCT',
    subject: 'Advanced Calculus',
    timeRange: '14:00 – 16:00',
    location: 'Main Library, 3rd Floor',
    partnerInitial: 'E',
  },
  {
    id: '2',
    day: '15',
    month: 'OCT',
    subject: 'Organic Chemistry',
    timeRange: '09:30 – 11:00',
    location: 'Café Nova, East Campus',
    partnerInitial: 'M',
  },
];

const RECENT_MATCHES = [
  {
    id: '1',
    name: 'Elena Rostova',
    dept: 'Biomedical Engineering',
    role: 'Research Fellow',
    match: 98,
    initial: 'E',
  },
  {
    id: '2',
    name: 'Marcus Torres',
    dept: 'Theoretical Physics',
    role: 'PhD Candidate',
    match: 94,
    initial: 'M',
  },
];

// ── Session Row ───────────────────────────────────────────────────────────────
function SessionRow({ session }: { session: typeof UPCOMING_SESSIONS[0] }) {
  return (
    <View style={styles.sessionRow}>
      {/* Date badge */}
      <View style={styles.dateBadge}>
        <Text style={styles.dateBadgeDay}>{session.day}</Text>
        <Text style={styles.dateBadgeMonth}>{session.month}</Text>
      </View>

      {/* Info */}
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionSubject} numberOfLines={1}>
          {session.subject}
        </Text>
        <View style={styles.sessionMeta}>
          <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.sessionMetaText}>{session.timeRange}</Text>
        </View>
        <View style={styles.sessionMeta}>
          <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.sessionMetaText} numberOfLines={1}>
            {session.location}
          </Text>
        </View>
      </View>

      {/* Partner avatar */}
      <View style={styles.partnerAvatar}>
        <Text style={styles.partnerInitial}>{session.partnerInitial}</Text>
      </View>
    </View>
  );
}

// ── Match Row ─────────────────────────────────────────────────────────────────
function MatchRow({ match }: { match: typeof RECENT_MATCHES[0] }) {
  return (
    <View style={styles.matchRow}>
      <View style={styles.matchAvatar}>
        <Text style={styles.matchInitial}>{match.initial}</Text>
      </View>

      <View style={styles.matchInfo}>
        <Text style={styles.matchName}>{match.name}</Text>
        <Text style={styles.matchSub} numberOfLines={1}>
          {match.dept} · {match.role}
        </Text>
      </View>

      <View style={styles.matchBadge}>
        <Text style={styles.matchBadgeText}>{match.match}%</Text>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function DashboardScreen({ navigation: _navigation }: { navigation: any }) {
  return (
    <View style={styles.root}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="school" size={22} color={Colors.primary} />
          <Text style={styles.headerTitle}>StudyMatch</Text>
        </View>
        <TouchableOpacity style={styles.avatarCircle} activeOpacity={0.8}>
          <Text style={styles.avatarInitial}>A</Text>
        </TouchableOpacity>
      </View>

      {/* ── Scrollable Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Hero */}
        <Text style={styles.heroTitle}>Welcome back, Scholar.</Text>
        <Text style={styles.heroSubtitle}>
          Here is your academic overview for the week.
        </Text>

        {/* ── Upcoming Sessions Card ── */}
        <View style={styles.upcomingCard}>

          {/* Card header row */}
          <View style={styles.upcomingCardHeader}>
            <Text style={styles.cardTitle}>Upcoming Sessions</Text>
            <View style={styles.next7Pill}>
              <Text style={styles.next7PillText}>NEXT 7 DAYS</Text>
            </View>
          </View>

          {/* Session rows */}
          {UPCOMING_SESSIONS.map((s, idx) => (
            <React.Fragment key={s.id}>
              {idx > 0 && <View style={styles.sessionGap} />}
              <SessionRow session={s} />
            </React.Fragment>
          ))}

          {/* View schedule link */}
          <TouchableOpacity style={styles.viewScheduleBtn} activeOpacity={0.7}>
            <Text style={styles.viewScheduleText}>View Full Schedule</Text>
          </TouchableOpacity>

        </View>

        {/* ── Recent Matches ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Matches</Text>
          <Ionicons name="person-add" size={20} color={Colors.primary} />
        </View>

        <View style={styles.matchesCard}>
          {RECENT_MATCHES.map((m, idx) => (
            <React.Fragment key={m.id}>
              {idx > 0 && <View style={styles.matchDivider} />}
              <MatchRow match={m} />
            </React.Fragment>
          ))}
        </View>

        {/* ── Find a Partner CTA ── */}
        <TouchableOpacity style={styles.ctaCard} activeOpacity={0.88}>
          <View style={styles.ctaIconWrap}>
            <Ionicons name="compass" size={26} color={Colors.textOnYellow} />
          </View>
          <View style={styles.ctaTextBlock}>
            <Text style={styles.ctaTitle}>Find a Partner</Text>
            <Text style={styles.ctaSubtitle}>
              Start matching for your upcoming finals.
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={Colors.textOnYellow} />
        </TouchableOpacity>

      </ScrollView>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceHigh,
    borderWidth: 2,
    borderColor: Colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },

  // ── Hero ────────────────────────────────────────────────────────────────────
  heroTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.black,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },

  // ── Upcoming Sessions Card ───────────────────────────────────────────────────
  upcomingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  upcomingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  next7Pill: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  next7PillText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    letterSpacing: 0.8,
  },

  // Session row (inside card)
  sessionGap: {
    height: Spacing.sm,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceMid,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    gap: Spacing.md,
  },

  // Date badge
  dateBadge: {
    width: 44,
    height: 52,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.borderGold,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateBadgeDay: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.black,
    color: Colors.primary,
    lineHeight: 24,
  },
  dateBadgeMonth: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    letterSpacing: 0.5,
    lineHeight: 14,
  },

  // Session info
  sessionInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  sessionSubject: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sessionMetaText: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    flexShrink: 1,
  },

  // Partner avatar
  partnerAvatar: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceHigh,
    borderWidth: 1.5,
    borderColor: Colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  partnerInitial: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },

  // View schedule
  viewScheduleBtn: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  viewScheduleText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textSecondary,
  },

  // ── Section Header ───────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },

  // ── Recent Matches ───────────────────────────────────────────────────────────
  matchesCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  matchDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
  },
  matchAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  matchInitial: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  matchInfo: {
    flex: 1,
    gap: 2,
  },
  matchName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  matchSub: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  matchBadge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    flexShrink: 0,
  },
  matchBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textOnYellow,
  },

  // ── CTA Card ─────────────────────────────────────────────────────────────────
  ctaCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  ctaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(0,8,20,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ctaTextBlock: {
    flex: 1,
    gap: 2,
  },
  ctaTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textOnYellow,
  },
  ctaSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textOnYellow,
    opacity: 0.72,
  },

});
