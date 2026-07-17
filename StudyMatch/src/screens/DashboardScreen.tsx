import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { supabase } from '../lib/supabase';
import { mapUserFromAPI } from '../data/mappers';
import { toFriendlyErrorMessage } from '../lib/errors';
import type { User } from '../types';

const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

interface UpcomingSession {
  id: string;
  day: string;
  month: string;
  subject: string;
  timeLabel: string;
  location: string;
  partnerInitial: string;
}

interface LikedProfile {
  id: string;
  name: string;
  dept: string;
  university: string;
  initial: string;
}

function formatSessionTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Session Row ───────────────────────────────────────────────────────────────
function SessionRow({
  session,
  onCancel,
}: {
  session: UpcomingSession;
  onCancel: () => void;
}) {
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
          <Text style={styles.sessionMetaText}>{session.timeLabel}</Text>
        </View>
        <View style={styles.sessionMeta}>
          <Ionicons
            name="location-outline"
            size={12}
            color={Colors.textMuted}
          />
          <Text style={styles.sessionMetaText} numberOfLines={1}>
            {session.location}
          </Text>
        </View>
      </View>

      {/* Partner avatar */}
      <View style={styles.partnerAvatar}>
        <Text style={styles.partnerInitial}>{session.partnerInitial}</Text>
      </View>

      {/* Cancel */}
      <TouchableOpacity
        style={styles.cancelSessionBtn}
        activeOpacity={0.7}
        onPress={onCancel}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name="close-circle-outline"
          size={20}
          color={Colors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

// ── Liked Row ─────────────────────────────────────────────────────────────────
function LikedRow({ profile }: { profile: LikedProfile }) {
  const subtitle = [profile.dept, profile.university]
    .filter(Boolean)
    .join(' · ');
  return (
    <View style={styles.matchRow}>
      <View style={styles.matchAvatar}>
        <Text style={styles.matchInitial}>{profile.initial}</Text>
      </View>

      <View style={styles.matchInfo}>
        <Text style={styles.matchName}>{profile.name}</Text>
        {!!subtitle && (
          <Text style={styles.matchSub} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.matchBadge}>
        <Ionicons name="heart" size={14} color={Colors.textOnYellow} />
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function DashboardScreen({ navigation }: { navigation: any }) {
  const [user, setUser] = useState<User | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>(
    [],
  );
  const [likedProfiles, setLikedProfiles] = useState<LikedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Loads: (1) the caller's own profile (hero greeting, avatar initial), (2)
  // upcoming study_dates for their active match, if any, and (3) a "Recently
  // Liked" list of people they've swiped right on (public.swipes) — replaces
  // the old mock "Recent Matches % badge" section, which had no backing
  // compatibility-score data anywhere in the schema.
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) {
        setError('Not signed in.');
        return;
      }

      const { data: ownRow, error: ownError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (ownError) {
        setError(toFriendlyErrorMessage(ownError));
        return;
      }
      const me = mapUserFromAPI(ownRow);
      setUser(me);

      if (me.activeMatchId) {
        const { data: matchRow } = await supabase
          .from('matches')
          .select('user1_id, user2_id')
          .eq('id', me.activeMatchId)
          .single();

        const partnerId = matchRow
          ? matchRow.user1_id === userId
            ? matchRow.user2_id
            : matchRow.user1_id
          : null;

        let partnerName = '';
        if (partnerId) {
          const { data: partnerRow } = await supabase
            .from('matched_users')
            .select('name')
            .eq('id', partnerId)
            .single();
          partnerName = partnerRow?.name ?? '';
        }

        const { data: dateRows } = await supabase
          .from('study_dates')
          .select('*')
          .eq('match_id', me.activeMatchId)
          .neq('status', 'cancelled')
          .gt('scheduled_time', new Date().toISOString())
          .order('scheduled_time', { ascending: true })
          .limit(5);

        setUpcomingSessions(
          (dateRows ?? []).map(row => {
            const d = new Date(row.scheduled_time);
            return {
              id: row.id,
              day: String(d.getDate()),
              month: MONTHS[d.getMonth()],
              subject: row.focus_subject || 'Study Session',
              timeLabel: formatSessionTime(row.scheduled_time),
              location: row.location || 'Location TBD',
              partnerInitial: partnerName ? partnerName[0].toUpperCase() : '?',
            };
          }),
        );
      } else {
        setUpcomingSessions([]);
      }

      const { data: likedRows } = await supabase
        .from('swipes')
        .select('target_id, created_at')
        .eq('swiper_id', userId)
        .eq('direction', 'right')
        .order('created_at', { ascending: false })
        .limit(5);

      if (likedRows?.length) {
        const targetIds = likedRows.map(r => r.target_id);
        const { data: likedUsers } = await supabase
          .from('swiped_right_users')
          .select('id, name, department, university')
          .in('id', targetIds);
        const byId = new Map((likedUsers ?? []).map(u => [u.id, u]));
        setLikedProfiles(
          likedRows
            .map(r => byId.get(r.target_id))
            .filter(
              (
                u,
              ): u is {
                id: string;
                name: string;
                department: string;
                university: string;
              } => !!u,
            )
            .map(u => ({
              id: u.id,
              name: u.name || 'Anonymous Scholar',
              dept: u.department || '',
              university: u.university || '',
              initial: (u.name || '?')[0].toUpperCase(),
            })),
        );
      } else {
        setLikedProfiles([]);
      }
    } catch (e: any) {
      setError(
        toFriendlyErrorMessage(e, {
          fallbackMessage: 'Failed to load dashboard.',
        }),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Refresh on tab focus — e.g. coming back from Match after swiping, or from
  // Planner after proposing a study date, so this doesn't show stale data.
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  // Mirrors ChatScreen.tsx's handleEndMatch confirmation pattern. cancel_study_date
  // is server-authoritative on everything: cancelled_by is always auth.uid(),
  // never client-supplied, and the -10 trust-score penalty only actually applies
  // if the RPC finds this within 2h of scheduled_time AND the match is still
  // active — the frontend doesn't need to compute or gate on that threshold.
  function handleCancelSession(studyDateId: string) {
    Alert.alert(
      'Cancel this study date?',
      'Cancelling within 2 hours of the scheduled time may affect your trust score.',
      [
        { text: 'Keep It', style: 'cancel' },
        {
          text: 'Cancel Date',
          style: 'destructive',
          onPress: async () => {
            const { error: rpcError } = await supabase.rpc(
              'cancel_study_date',
              {
                p_study_date_id: studyDateId,
              },
            );
            if (rpcError) {
              Alert.alert(
                'Could not cancel',
                toFriendlyErrorMessage(rpcError, {
                  codeMessages: {
                    ST007: "You're not a participant in this study date.",
                    ST008: 'This date was already cancelled or completed.',
                    ST009: 'This date has already happened — rate it instead.',
                  },
                }),
              );
              return;
            }
            loadDashboard();
          },
        },
      ],
    );
  }

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Scholar';

  if (loading && !user) {
    return (
      <View style={styles.root}>
        <View style={styles.stateContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.root}>
        <View style={styles.stateContainer}>
          <Ionicons name="warning-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={loadDashboard}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
            <Text style={styles.refreshBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="school" size={22} color={Colors.primary} />
          <Text style={styles.headerTitle}>StudyMatch</Text>
        </View>
      </View>

      {/* ── Scrollable Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Text style={styles.heroTitle}>Welcome back, {firstName}.</Text>
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
          {upcomingSessions.length === 0 ? (
            <Text style={styles.emptySectionText}>
              No upcoming sessions planned yet.
            </Text>
          ) : (
            upcomingSessions.map((s, idx) => (
              <React.Fragment key={s.id}>
                {idx > 0 && <View style={styles.sessionGap} />}
                <SessionRow
                  session={s}
                  onCancel={() => handleCancelSession(s.id)}
                />
              </React.Fragment>
            ))
          )}

          {/* View schedule link */}
          <TouchableOpacity
            style={styles.viewScheduleBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Planner')}
          >
            <Text style={styles.viewScheduleText}>View Full Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* ── Recently Liked ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Liked</Text>
          <Ionicons name="heart-outline" size={20} color={Colors.primary} />
        </View>

        <View style={styles.matchesCard}>
          {likedProfiles.length === 0 ? (
            <Text
              style={[styles.emptySectionText, styles.emptySectionTextPadded]}
            >
              You haven't liked anyone yet — head to Match to find a study
              partner.
            </Text>
          ) : (
            likedProfiles.map((p, idx) => (
              <React.Fragment key={p.id}>
                {idx > 0 && <View style={styles.matchDivider} />}
                <LikedRow profile={p} />
              </React.Fragment>
            ))
          )}
        </View>

        {/* ── Find a Partner CTA ── */}
        <TouchableOpacity
          style={styles.ctaCard}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Match')}
        >
          <View style={styles.ctaIconWrap}>
            <Ionicons name="compass" size={26} color={Colors.textOnYellow} />
          </View>
          <View style={styles.ctaTextBlock}>
            <Text style={styles.ctaTitle}>Find a Partner</Text>
            <Text style={styles.ctaSubtitle}>
              Start matching for your upcoming finals.
            </Text>
          </View>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={Colors.textOnYellow}
          />
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
  // ── Scroll ──────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },

  // ── Loading / Error state ────────────────────────────────────────────────────
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
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

  // Empty section placeholder text (Upcoming Sessions / Recently Liked)
  emptySectionText: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  emptySectionTextPadded: {
    padding: Spacing.md,
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

  // Cancel session
  cancelSessionBtn: {
    flexShrink: 0,
    marginLeft: Spacing.xs,
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

  // ── Recently Liked ───────────────────────────────────────────────────────────
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
    paddingVertical: Spacing.sm,
    flexShrink: 0,
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

  // ── Empty / Error state text (loading/error full-screen states) ────────────
  emptyTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.base,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderGold,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  refreshBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
});
