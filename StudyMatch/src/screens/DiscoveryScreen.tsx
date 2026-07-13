import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';
import type { DiscoveryFilters } from '../types';

const { width, height } = Dimensions.get('window');

const CARD_WIDTH  = width - Spacing.base * 2;
const CARD_HEIGHT = Math.min(Math.round(height * 0.60), 510);
const PHOTO_HEIGHT = Math.round(CARD_HEIGHT * 0.55);

const SWIPE_THRESHOLD = width * 0.45;
const SWIPE_OUT_DISTANCE = width * 1.5;
const SWIPE_OUT_DURATION = 240;

// ── Mock Deck ─────────────────────────────────────────────────────────────────
interface Profile {
  name: string;
  age: number;
  field: string;
  tags: { label: string; variant: 'dark' | 'gold' }[];
  bio: string;
}

const PROFILES: Profile[] = [
  {
    name: 'Elena Rostova',
    age: 23,
    field: 'Biomedical Engineering',
    tags: [
      { label: 'MIT',             variant: 'dark' },
      { label: 'RESEARCH FELLOW', variant: 'gold' },
    ],
    bio: '"Chasing answers at the intersection of biology and technology. Looking for a focused partner for research methodology and thesis prep."',
  },
  {
    name: 'Marcus Torres',
    age: 26,
    field: 'Theoretical Physics',
    tags: [
      { label: 'STANFORD',      variant: 'dark' },
      { label: 'PHD CANDIDATE', variant: 'gold' },
    ],
    bio: '"Quantum field theory by day, espresso by night. Need a partner who can survive a 3-hour problem-set marathon without checking their phone."',
  },
  {
    name: 'Aisha Khan',
    age: 22,
    field: 'Computer Science',
    tags: [
      { label: 'HARVARD',  variant: 'dark' },
      { label: 'SENIOR',   variant: 'gold' },
    ],
    bio: '"Grinding LeetCode and compiler theory before finals. Silent library sessions preferred — headphones on, world off."',
  },
  {
    name: 'Leo Fischer',
    age: 24,
    field: 'Organic Chemistry',
    tags: [
      { label: 'BERKELEY',    variant: 'dark' },
      { label: 'LAB ASSISTANT', variant: 'gold' },
    ],
    bio: '"Reaction mechanisms are my love language. Looking for a study buddy for the midterm gauntlet — flashcards and coffee provided."',
  },
];

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

// ── Card Face (static content) ────────────────────────────────────────────────
function CardFace({ profile }: { profile: Profile }) {
  return (
    <>
      {/* ── Photo area ── */}
      <View style={styles.photoArea}>

        {/* Placeholder fill */}
        <View style={styles.photoPlaceholder}>
          <Ionicons name="person" size={72} color={Colors.surfaceHigh} />
        </View>

        {/* Verified badge */}
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
        </View>

        {/* Gradient-like overlay: name + field + tags */}
        <View style={styles.photoOverlay}>
          <View style={styles.tagsRow}>
            {profile.tags.map((tag) =>
              tag.variant === 'dark' ? (
                <View key={tag.label} style={styles.tagDark}>
                  <Text style={styles.tagDarkText}>{tag.label}</Text>
                </View>
              ) : (
                <View key={tag.label} style={styles.tagGold}>
                  <Text style={styles.tagGoldText}>{tag.label}</Text>
                </View>
              ),
            )}
          </View>
          <Text style={styles.profileName}>
            {profile.name}, {profile.age}
          </Text>
          <Text style={styles.profileField}>{profile.field}</Text>
        </View>

      </View>

      {/* ── Bio section ── */}
      <View style={styles.bioSection}>
        <View style={styles.bioAccentBar} />
        <Text style={styles.bioText}>{profile.bio}</Text>
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

  const position = useRef(new Animated.ValueXY()).current;
  const isAnimating = useRef(false);

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
          forceSwipe('right');
        } else if (e.translationX < -SWIPE_THRESHOLD) {
          forceSwipe('left');
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

  const topProfile = PROFILES[deckIndex];
  const nextProfile = PROFILES[deckIndex + 1];

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
      {topProfile ? (
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
              onPress={() => forceSwipe('left')}
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
              onPress={() => forceSwipe('right')}
            >
              <Ionicons name="heart" size={28} color={Colors.textOnYellow} />
            </TouchableOpacity>

          </View>
        </View>
      ) : (
        <EmptyState onRefresh={() => setDeckIndex(0)} />
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

  // ── Empty State ──────────────────────────────────────────────────────────────
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

});
