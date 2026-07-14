import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';
import type { DiscoveryFilters, User } from '../types';
import { supabase } from '../lib/supabase';
import { mapUserFromAPI } from '../data/mappers';

const { width, height } = Dimensions.get('window');

const CARD_WIDTH  = width - Spacing.base * 2;
const CARD_HEIGHT = Math.min(Math.round(height * 0.60), 510);
const PHOTO_HEIGHT = Math.round(CARD_HEIGHT * 0.55);

const SWIPE_THRESHOLD = width * 0.45;
const SWIPE_OUT_DISTANCE = width * 1.5;
const SWIPE_OUT_DURATION = 240;

const CANDIDATE_BATCH_SIZE = 20;

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="people-outline" size={52} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No more profiles</Text>
      <Text style={styles.emptySubtitle}>
        Check back later for new study partners.
      </Text>
      <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.8}>
        <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
        <Text style={styles.refreshBtnText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Loading / Error / Locked States ─────────────────────────────────────────────
function LoadingState() {
  return (
    <View style={styles.emptyContainer}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="warning-outline" size={52} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Something went wrong</Text>
      <Text style={styles.emptySubtitle}>{message}</Text>
      <TouchableOpacity style={styles.refreshBtn} onPress={onRetry} activeOpacity={0.8}>
        <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
        <Text style={styles.refreshBtnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

// Lock System (PRD §5): shown instead of the swipe deck whenever this user
// already has an active match — completes the "you're already in a study date"
// UI state that Phase 3 deferred until Discovery had a real candidate pool.
function LockedState({ onGoToChat }: { onGoToChat: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="lock-closed-outline" size={52} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>You're already in a study date</Text>
      <Text style={styles.emptySubtitle}>
        Finish up or end your current match before finding a new partner.
      </Text>
      <TouchableOpacity style={styles.refreshBtn} onPress={onGoToChat} activeOpacity={0.8}>
        <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
        <Text style={styles.refreshBtnText}>Go to Chat</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Card Face (static content) ────────────────────────────────────────────────
function CardFace({ profile }: { profile: User }) {
  return (
    <>
      {/* ── Photo area ── */}
      <View style={styles.photoArea}>

        {/* Placeholder fill — real photos stay blurred until mutual reveal (PRD §5);
            progressive-disclosure photo wiring is a later phase, not this one. */}
        <View style={styles.photoPlaceholder}>
          <Ionicons name="person" size={72} color={Colors.surfaceHigh} />
        </View>

        {/* Verified badge */}
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
        </View>

        {/* Gradient-like overlay: name + academic card fields (PRD §4 — University /
            Department / Year, no photo, no age) */}
        <View style={styles.photoOverlay}>
          <View style={styles.tagsRow}>
            {!!profile.university && (
              <View style={styles.tagDark}>
                <Text style={styles.tagDarkText}>{profile.university.toUpperCase()}</Text>
              </View>
            )}
            {!!profile.year && (
              <View style={styles.tagGold}>
                <Text style={styles.tagGoldText}>{profile.year.toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{profile.name || 'Anonymous Scholar'}</Text>
          <Text style={styles.profileField}>{profile.department || 'Undeclared Department'}</Text>
        </View>

      </View>

      {/* ── Bio section — today's focus goal (PRD §3 "Today's Goal") ── */}
      <View style={styles.bioSection}>
        <View style={styles.bioAccentBar} />
        <Text style={styles.bioText}>
          {profile.currentGoalText
            ? `"${profile.currentGoalText}"`
            : 'No current study goal set.'}
        </Text>
      </View>
    </>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function DiscoveryScreen({ navigation, route }: { navigation: any; route: any }) {
  const [deckIndex, setDeckIndex] = useState(0);
  const [activeFilters, setActiveFilters] = useState<DiscoveryFilters | undefined>(
    route?.params?.filters,
  );
  const [candidates, setCandidates] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const [swipeErrorBanner, setSwipeErrorBanner] = useState<string | null>(null);

  const position = useRef(new Animated.ValueXY()).current;
  const isAnimating = useRef(false);
  const swipeErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Non-blocking toast for recordSwipe() failures — the card has already
  // animated off-screen by the time an insert failure resolves, so a modal
  // Alert would be jarring; this banner self-dismisses instead.
  const showSwipeErrorBanner = useCallback((message: string) => {
    if (swipeErrorTimer.current) clearTimeout(swipeErrorTimer.current);
    setSwipeErrorBanner(message);
    swipeErrorTimer.current = setTimeout(() => setSwipeErrorBanner(null), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (swipeErrorTimer.current) clearTimeout(swipeErrorTimer.current);
    };
  }, []);

  useEffect(() => {
    if (route?.params?.filters) {
      setActiveFilters(route.params.filters);
    }
  }, [route?.params?.filters]);

  // Reset the drag position only *after* the deck has advanced to the next
  // profile — resetting it beforehand briefly flashes the old (already
  // swiped) card back at center for one frame.
  useEffect(() => {
    position.setValue({ x: 0, y: 0 });
    isAnimating.current = false;
  }, [deckIndex]);

  // Loads: (1) whether this user is currently locked (Lock System — if so, skip
  // the deck entirely and show LockedState), (2) the real candidate pool from
  // discoverable_users (shadowban-filtered, Phase 4), excluding self and anyone
  // already locked with someone else.
  const loadDiscovery = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) {
        setError('Not signed in.');
        return;
      }
      setCurrentUserId(userId);

      const { data: ownRow, error: ownError } = await supabase
        .from('users')
        .select('active_match_id')
        .eq('id', userId)
        .single();
      if (ownError) {
        setError(ownError.message);
        return;
      }
      if (ownRow?.active_match_id) {
        setLocked(true);
        return;
      }
      setLocked(false);

      const { data: rows, error: candidatesError } = await supabase
        .from('discoverable_users')
        .select('*')
        .neq('id', userId)
        .is('active_match_id', null)
        .limit(CANDIDATE_BATCH_SIZE);
      if (candidatesError) {
        setError(candidatesError.message);
        return;
      }
      setCandidates((rows ?? []).map(mapUserFromAPI));
      setDeckIndex(0);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load Discovery.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiscovery();
  }, [loadDiscovery]);

  // Refresh every time this tab regains focus — e.g. coming back from Chat after
  // an End Match unlock, so the deck doesn't stay stuck on stale data.
  useFocusEffect(
    useCallback(() => {
      loadDiscovery();
    }, [loadDiscovery]),
  );

  // Lock System, live: subscribe to the matches rows this user participates in.
  // A single handler drives BOTH the initiator (whose own swipe caused the
  // insert) and the target (who did nothing) — deliberately not navigating
  // synchronously after the insert's own REST response, so there is exactly one
  // lock-transition code path for both sides, matching what Realtime is for.
  // (matches_select_participant RLS — auth.uid() IN (user1_id, user2_id) —
  // means this channel only ever receives rows this user is actually part of;
  // Realtime does not bypass RLS.)
  useEffect(() => {
    if (!currentUserId) return;

    function handleMatchChange(payload: any) {
      const row = payload.new;
      if (!row) return;
      if (row.status === 'active') {
        setLocked(true);
        navigation.navigate('MainTabs', { screen: 'Chats' });
      } else {
        setLocked(false);
        loadDiscovery();
      }
    }

    const channel = supabase
      .channel(`discovery-lock-${currentUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `user1_id=eq.${currentUserId}` },
        handleMatchChange,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `user2_id=eq.${currentUserId}` },
        handleMatchChange,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, navigation, loadDiscovery]);

  function onSwipeComplete() {
    setDeckIndex((i) => i + 1);
  }

  function forceSwipe(direction: 'left' | 'right') {
    if (isAnimating.current) return;
    isAnimating.current = true;
    Animated.timing(position, {
      toValue: {
        x: direction === 'right' ? SWIPE_OUT_DISTANCE : -SWIPE_OUT_DISTANCE,
        y: 0,
      },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(onSwipeComplete);
  }

  function springBack() {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: false,
    }).start();
  }

  // Persists a swipe decision so discoverable_users' NOT EXISTS clause (Gap 2
  // hardening) excludes this candidate from future loads for this user. Also
  // the ONLY way a match can now form: the backend's form_match_on_mutual_swipe()
  // trigger on public.swipes creates the matches row itself, exclusively when
  // both users have a 'right' swipe on each other — real double opt-in (PRD §4).
  // Match INSERTs are no longer performed by the client at all; a right swipe
  // just records the swipe, same as a left swipe, and the Realtime subscription
  // above is what tells this screen a match actually formed (which may happen
  // immediately if this swipe completed the pair, or later if the other side
  // swipes right afterward).
  //
  // Postgres unique_violation (23505 — re-swiping an already-decided candidate)
  // stays silent (console.warn only): expected/harmless, since the view already
  // excludes already-swiped candidates from what Discovery ever fetches, so this
  // can only happen from a stale local deck. Any OTHER failure — including a
  // null/stale currentUserId (expired session) — always means something is
  // actually wrong, so it's surfaced via a non-blocking banner instead of being
  // swallowed; a null currentUserId additionally re-runs loadDiscovery() to
  // re-resolve auth state and surface the real "Not signed in" ErrorState.
  async function recordSwipe(candidate: User | undefined, direction: 'left' | 'right') {
    if (!candidate) return;
    if (!currentUserId) {
      console.warn('Failed to record swipe: no signed-in user (stale/expired session).');
      showSwipeErrorBanner("Couldn't save that — please sign in again.");
      loadDiscovery();
      return;
    }
    const { error: swipeError } = await supabase
      .from('swipes')
      .insert({ swiper_id: currentUserId, target_id: candidate.id, direction });
    if (swipeError) {
      if (swipeError.code === '23505') {
        console.warn('Swipe already recorded for this candidate (stale local deck).');
        return;
      }
      console.warn('Failed to record swipe:', swipeError.message);
      showSwipeErrorBanner("Couldn't save that — check your connection.");
    }
  }

  const panGesture = useRef(
    Gesture.Pan()
      .runOnJS(true)
      .onUpdate((e) => {
        if (isAnimating.current) return;
        position.setValue({ x: e.translationX, y: e.translationY });
      })
      .onEnd((e) => {
        if (isAnimating.current) return;
        if (e.translationX > SWIPE_THRESHOLD) {
          const candidate = candidates[deckIndex];
          forceSwipe('right');
          recordSwipe(candidate, 'right');
        } else if (e.translationX < -SWIPE_THRESHOLD) {
          const candidate = candidates[deckIndex];
          forceSwipe('left');
          recordSwipe(candidate, 'left');
        } else {
          springBack();
        }
      }),
  ).current;

  // ── Interpolations ──
  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });
  const connectOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const passOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const nextCardScale = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [1, 0.94, 1],
    extrapolate: 'clamp',
  });

  const topProfile = candidates[deckIndex];
  const nextProfile = candidates[deckIndex + 1];

  function renderContent() {
    if (locked) {
      return (
        <LockedState
          onGoToChat={() => navigation.navigate('MainTabs', { screen: 'Chats' })}
        />
      );
    }
    if (loading) {
      return <LoadingState />;
    }
    if (error) {
      return <ErrorState message={error} onRetry={loadDiscovery} />;
    }
    if (!topProfile) {
      return <EmptyState onRefresh={loadDiscovery} />;
    }

    return (
      <View style={styles.cardContainer}>

        {/* Deck */}
        <View style={styles.deckWrap}>

          {/* Next card (behind) */}
          {nextProfile && (
            <Animated.View
              style={[
                styles.swipeCard,
                styles.deckCard,
                { transform: [{ scale: nextCardScale }] },
              ]}
            >
              <CardFace profile={nextProfile} />
            </Animated.View>
          )}

          {/* Top card (draggable) */}
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.swipeCard,
                styles.deckCard,
                {
                  transform: [
                    { translateX: position.x },
                    { translateY: position.y },
                    { rotate },
                  ],
                },
              ]}
            >
              <CardFace profile={topProfile} />

              {/* CONNECT stamp — fades in on right drag */}
              <Animated.View
                style={[styles.stamp, styles.stampConnect, { opacity: connectOpacity }]}
              >
                <Text style={styles.stampConnectText}>CONNECT ✓</Text>
              </Animated.View>

              {/* PASS stamp — fades in on left drag */}
              <Animated.View
                style={[styles.stamp, styles.stampPass, { opacity: passOpacity }]}
              >
                <Text style={styles.stampPassText}>PASS ✗</Text>
              </Animated.View>
            </Animated.View>
          </GestureDetector>

        </View>

        {/* Action buttons */}
        <View style={styles.actionsRow}>

          {/* Pass — X */}
          <TouchableOpacity
            style={styles.btnPass}
            activeOpacity={0.8}
            onPress={() => {
              const candidate = candidates[deckIndex];
              forceSwipe('left');
              recordSwipe(candidate, 'left');
            }}
          >
            <Ionicons name="close" size={26} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Bookmark */}
          <TouchableOpacity style={styles.btnBookmark} activeOpacity={0.8}>
            <Ionicons name="bookmark-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Like — primary CTA */}
          <TouchableOpacity
            style={styles.btnLike}
            activeOpacity={0.82}
            onPress={() => {
              const candidate = candidates[deckIndex];
              forceSwipe('right');
              recordSwipe(candidate, 'right');
            }}
          >
            <Ionicons name="heart" size={28} color={Colors.textOnYellow} />
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
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Filter', { current: activeFilters })}
          >
            <Ionicons name="options-outline" size={20} color={Colors.primary} />
            {activeFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarCircle} activeOpacity={0.8}>
            <Text style={styles.avatarInitial}>A</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content ── */}
      {renderContent()}

      {/* ── Swipe-save failure toast ── */}
      {swipeErrorBanner && (
        <View style={styles.swipeErrorBanner} pointerEvents="none">
          <Ionicons name="alert-circle-outline" size={16} color={Colors.textOnYellow} />
          <Text style={styles.swipeErrorBannerText}>{swipeErrorBanner}</Text>
        </View>
      )}

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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceHigh,
    borderWidth: 1.5,
    borderColor: Colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },

  // ── Card container ───────────────────────────────────────────────────────────
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
  },

  // ── Deck ─────────────────────────────────────────────────────────────────────
  deckWrap: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  deckCard: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  // ── Swipe Card ───────────────────────────────────────────────────────────────
  swipeCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },

  // ── Swipe stamps ─────────────────────────────────────────────────────────────
  stamp: {
    position: 'absolute',
    top: Spacing.xl,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderWidth: 3,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(0,8,20,0.35)',
  },
  stampConnect: {
    left: Spacing.base,
    borderColor: Colors.primary,
    transform: [{ rotate: '-15deg' }],
  },
  stampConnectText: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.black,
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  stampPass: {
    right: Spacing.base,
    borderColor: Colors.danger,
    transform: [{ rotate: '15deg' }],
  },
  stampPassText: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.black,
    color: Colors.danger,
    letterSpacing: 1.5,
  },

  // Photo area (~55% of card height)
  photoArea: {
    height: PHOTO_HEIGHT,
    backgroundColor: Colors.surfaceMid,
    position: 'relative',
    overflow: 'hidden',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    paddingTop: Spacing.xxl,
    backgroundColor: 'rgba(0,8,20,0.65)',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  tagDark: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  tagDarkText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  tagGold: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  tagGoldText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.textOnYellow,
    letterSpacing: 0.8,
  },
  profileName: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  profileField: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    marginTop: 2,
  },

  // Bio section (remainder of card)
  bioSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.base,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
  },
  bioAccentBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    flexShrink: 0,
  },
  bioText: {
    flex: 1,
    fontSize: Typography.size.md,
    fontStyle: 'italic',
    color: Colors.textPrimary,
    lineHeight: 22,
    opacity: 0.88,
  },

  // ── Action Buttons ───────────────────────────────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginTop: Spacing.xl,
  },
  btnPass: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.surfaceHigh,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBookmark: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.surfaceHigh,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLike: {
    width: 68,
    height: 68,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Empty / Loading / Error / Locked States ─────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
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

  // ── Swipe-save failure toast ─────────────────────────────────────────────────
  swipeErrorBanner: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    bottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.danger,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  swipeErrorBannerText: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textOnYellow,
  },

});
