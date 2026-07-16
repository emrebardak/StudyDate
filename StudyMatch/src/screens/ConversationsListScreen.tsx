import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { supabase } from '../lib/supabase';
import { toFriendlyErrorMessage } from '../lib/errors';

interface ConversationRow {
  id: string;
  partnerName: string;
  partnerInitial: string;
  isActive: boolean;
}

// ── Loading / Error / Empty States ──────────────────────────────────────────────
function LoadingState() {
  return (
    <View style={styles.stateContainer}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.stateContainer}>
      <Ionicons name="warning-outline" size={52} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>Something went wrong</Text>
      <Text style={styles.emptySubtitle}>{message}</Text>
      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={onRetry}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
        <Text style={styles.refreshBtnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.stateContainer}>
      <Ionicons name="chatbubbles-outline" size={52} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Once you match with someone in Discovery, your conversation shows up
        here.
      </Text>
    </View>
  );
}

// ── Conversation Row ─────────────────────────────────────────────────────────────
function ConversationRowItem({
  item,
  onPress,
}: {
  item: ConversationRow;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarInitial}>{item.partnerInitial}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.partnerName}
        </Text>
        <Text style={styles.rowStatus}>
          {item.isActive ? 'Active' : 'Ended'}
        </Text>
      </View>
      {item.isActive ? (
        <Ionicons name="lock-closed" size={16} color={Colors.primary} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ConversationsListScreen({
  navigation,
}: {
  navigation: any;
}) {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [myInitial, setMyInitial] = useState('?');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lists EVERY match the caller is part of (active or ended), not just the
  // single current active one — this is what makes an ended match's chat (and
  // its post-date survey banner) reachable again after handleEndMatch or the
  // Phase 5 cron sweep. matches_select_participant RLS already allows reading
  // your own past matches; this was purely a missing frontend entry point.
  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) {
        setError('Not signed in.');
        return;
      }

      const { data: ownRow } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();
      setMyInitial(ownRow?.name ? ownRow.name[0].toUpperCase() : '?');

      const { data: matchRows, error: matchError } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id, status, updated_at')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('updated_at', { ascending: false });
      if (matchError) {
        setError(toFriendlyErrorMessage(matchError));
        return;
      }

      if (!matchRows?.length) {
        setConversations([]);
        return;
      }

      const partnerIds = matchRows.map(m =>
        m.user1_id === userId ? m.user2_id : m.user1_id,
      );
      const { data: partners } = await supabase
        .from('users')
        .select('id, name')
        .in('id', partnerIds);
      const nameById = new Map(
        (partners ?? []).map(p => [p.id, p.name as string]),
      );

      setConversations(
        matchRows.map(m => {
          const partnerId = m.user1_id === userId ? m.user2_id : m.user1_id;
          const name = nameById.get(partnerId) || 'Anonymous Match';
          return {
            id: m.id,
            partnerName: name,
            partnerInitial: name ? name[0].toUpperCase() : '?',
            isActive: m.status === 'active',
          };
        }),
      );
    } catch (e: any) {
      setError(
        toFriendlyErrorMessage(e, {
          fallbackMessage: 'Failed to load conversations.',
        }),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations]),
  );

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="school" size={22} color={Colors.primary} />
          <Text style={styles.headerTitle}>StudyMatch</Text>
        </View>
        <View style={styles.avatarCircleHeader}>
          <Text style={styles.avatarInitialHeader}>{myInitial}</Text>
        </View>
      </View>

      {loading && <LoadingState />}
      {!loading && !!error && (
        <ErrorState message={error} onRetry={loadConversations} />
      )}
      {!loading && !error && conversations.length === 0 && <EmptyState />}

      {!loading && !error && conversations.length > 0 && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {conversations.map((item, idx) => (
              <React.Fragment key={item.id}>
                {idx > 0 && <View style={styles.divider} />}
                <ConversationRowItem
                  item={item}
                  onPress={() =>
                    navigation.navigate('Chat', { matchId: item.id })
                  }
                />
              </React.Fragment>
            ))}
          </View>
        </ScrollView>
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
  avatarCircleHeader: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceHigh,
    borderWidth: 2,
    borderColor: Colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialHeader: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitial: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  rowStatus: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  // ── States ────────────────────────────────────────────────────────────────
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
});
