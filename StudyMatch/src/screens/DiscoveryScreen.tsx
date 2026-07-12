import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';
import ProfileCard from '../components/ProfileCard';

const { width } = Dimensions.get('window');

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
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
  const [hasCards, setHasCards] = useState(true);

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Ionicons name="book-outline" size={22} color={Colors.textPrimary} />
        <Text style={styles.headerTitle}>StudyMatch</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Filter')}>
          <Ionicons name="options-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {hasCards ? (
        <ScrollView
          contentContainerStyle={styles.swipeContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Scrapbook card ── */}
          <ProfileCard />

          {/* ── Action buttons ── */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.btnPass}>
              <Ionicons name="close" size={28} color={Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnLike}>
              <Ionicons name="checkmark" size={28} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <EmptyState />
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
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
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },

  // Swipe
  swipeContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
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
    shadowColor: '#2C1A0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  btnLike: {
    width: 68,
    height: 68,
    borderRadius: Radius.full,
    backgroundColor: '#5C4A2A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2C1A0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
});
