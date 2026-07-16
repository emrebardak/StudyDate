import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme';
import { supabase } from '../lib/supabase';
import { mapUserFromAPI } from '../data/mappers';
import { toFriendlyErrorMessage } from '../lib/errors';
import type { User } from '../types';

// Badge keys per PRD §7 ("Post-Date: Trust Score & Gamification") — awarded via
// post-date surveys, a later phase not built yet, so `badges` is normally empty
// for every real user today. Unknown keys still render (generic icon fallback)
// rather than being silently dropped, so this doesn't have to be kept in sync
// with that phase's exact naming later.
const BADGE_META: Record<string, { icon: string; label: string }> = {
  Punctual: { icon: 'time', label: 'Punctual' },
  'Silent & Focused': { icon: 'volume-mute', label: 'Silent & Focused' },
  'Great Explainer': { icon: 'bulb', label: 'Great Explainer' },
  'Good Break Buddy': { icon: 'cafe', label: 'Good Break Buddy' },
};

function badgeMeta(key: string): { icon: string; label: string } {
  return BADGE_META[key] ?? { icon: 'ribbon', label: key };
}

// ── Badge Item ─────────────────────────────────────────────────────────────────
function BadgeItem({
  icon,
  label,
  count,
}: {
  icon: string;
  label: string;
  count: number;
}) {
  return (
    <View style={styles.badgeItem}>
      <View style={styles.badgeCircle}>
        <Ionicons name={icon as any} size={22} color={Colors.primary} />
      </View>
      <Text style={styles.badgeLabel} numberOfLines={1}>
        {count > 1 ? `${label} ×${count}` : label}
      </Text>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function MyProfileScreen({ navigation }: { navigation: any }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) {
        setError('Not signed in.');
        return;
      }
      const { data: row, error: rowError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (rowError) {
        setError(toFriendlyErrorMessage(rowError));
        return;
      }
      setUser(mapUserFromAPI(row));
    } catch (e: any) {
      setError(
        toFriendlyErrorMessage(e, {
          fallbackMessage: 'Failed to load profile.',
        }),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Refresh whenever this tab regains focus, e.g. coming back from Edit Profile.
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  function handleLogOut() {
    Alert.alert(
      'Log out?',
      'You will need to sign in again to access your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'RegisterVerification' }],
            });
          },
        },
      ],
    );
  }

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
            onPress={loadProfile}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
            <Text style={styles.refreshBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const academicRows = [
    { label: 'UNIVERSITY', value: user?.university || '—' },
    { label: 'DEPARTMENT', value: user?.department || '—' },
    { label: 'YEAR', value: user?.year || '—' },
  ];

  const badgeEntries = Object.entries(user?.badges ?? {});

  const photos = user?.photos ?? [];
  const mainPhoto = user?.photoUrl || photos[0];
  const secondaryPhotos = photos.filter(p => p !== mainPhoto).slice(0, 2);
  const morePhotoCount = Math.max(
    photos.length - (mainPhoto ? 1 : 0) - secondaryPhotos.length,
    0,
  );

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        {/* spacer to balance the back button and keep title truly centered */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Photo Grid (no horizontal padding) ── */}
        <View style={styles.photoGrid}>
          {/* Large top placeholder — real photo once uploaded */}
          <View style={styles.photoLarge}>
            {mainPhoto ? (
              <Image source={{ uri: mainPhoto }} style={styles.photoImage} />
            ) : (
              <Ionicons name="person" size={48} color={Colors.textMuted} />
            )}
          </View>
          {/* Two smaller placeholders side by side */}
          <View style={styles.photoRow}>
            <View style={styles.photoSmall}>
              {!!secondaryPhotos[0] && (
                <Image
                  source={{ uri: secondaryPhotos[0] }}
                  style={styles.photoImage}
                />
              )}
            </View>
            <View style={styles.photoSmallRight}>
              {!!secondaryPhotos[1] && (
                <Image
                  source={{ uri: secondaryPhotos[1] }}
                  style={styles.photoImage}
                />
              )}
              {/* +N MORE overlay on the second photo, only when there are more */}
              {morePhotoCount > 0 && (
                <View style={styles.moreOverlay}>
                  <Text style={styles.moreText}>+{morePhotoCount} MORE</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* ── Academic Details ── */}
          <Text style={styles.sectionLabel}>Academic Details</Text>
          <View style={styles.academicCard}>
            {academicRows.map((row, i) => (
              <View key={row.label}>
                <View style={styles.academicRow}>
                  <Text style={styles.academicKey}>{row.label}</Text>
                  <Text style={styles.academicValue}>{row.value}</Text>
                </View>
                {i < academicRows.length - 1 && (
                  <View style={styles.academicDivider} />
                )}
              </View>
            ))}
          </View>

          {/* ── Earned Badges ── */}
          <View style={styles.badgesHeader}>
            <Text style={styles.badgesTitle}>Earned Badges</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {badgeEntries.length === 0 ? (
            <Text style={styles.emptyBadgesText}>
              No badges yet — complete a study date to start earning them.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.badgesScrollView}
              contentContainerStyle={styles.badgesScrollContent}
            >
              {badgeEntries.map(([key, count]) => {
                const meta = badgeMeta(key);
                return (
                  <BadgeItem
                    key={key}
                    icon={meta.icon}
                    label={meta.label}
                    count={count}
                  />
                );
              })}
            </ScrollView>
          )}

          {/* ── Edit Profile ── */}
          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="pencil" size={16} color={Colors.textOnYellow} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>

          {/* ── Log Out ── */}
          <TouchableOpacity
            style={styles.logOutBtn}
            activeOpacity={0.85}
            onPress={handleLogOut}
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            <Text style={styles.logOutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
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

  // Loading / Error state
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  headerBack: {
    padding: Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  // Mirrors the back button width so the title stays truly centered
  headerSpacer: {
    width: 30,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xl },

  // Photo grid — full width, no horizontal padding
  photoGrid: {
    width: '100%',
  },
  photoLarge: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoRow: {
    flexDirection: 'row',
  },
  photoSmall: {
    flex: 1,
    height: 130,
    backgroundColor: Colors.surfaceMid,
    overflow: 'hidden',
  },
  photoSmallRight: {
    flex: 1,
    height: 130,
    backgroundColor: Colors.surfaceMid,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  moreOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 8, 20, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 1,
  },

  // Content area with padding
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
  },

  // Section label
  sectionLabel: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },

  // Academic details card
  academicCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  academicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  academicKey: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
    fontWeight: Typography.weight.semibold,
  },
  academicValue: {
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.medium,
  },
  academicDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.base,
  },

  // Badges section
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  badgesTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  viewAll: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
  },
  emptyBadgesText: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  badgesScrollView: {
    marginBottom: Spacing.lg,
  },
  badgesScrollContent: {
    gap: Spacing.base,
    paddingRight: Spacing.base,
  },
  badgeItem: {
    alignItems: 'center',
    gap: Spacing.sm,
    width: 72,
  },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Edit profile button
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    ...Shadow.glow,
  },
  editBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textOnYellow,
    letterSpacing: 0.3,
  },

  // Log out button
  logOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  logOutBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.danger,
    letterSpacing: 0.3,
  },
});
