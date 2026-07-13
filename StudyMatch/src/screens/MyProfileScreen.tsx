import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme';

// ── Mock Data ──────────────────────────────────────────────────────────────────
const ACADEMIC_ROWS = [
  { label: 'UNIVERSITY', value: 'Stanford University' },
  { label: 'DEPARTMENT', value: 'Computer Science' },
  { label: 'YEAR', value: 'Senior' },
];

const BADGES = [
  { icon: 'star', label: 'Top 1%' },
  { icon: 'trophy', label: 'Hackathon' },
  { icon: 'bulb', label: 'Innovator' },
  { icon: 'flame', label: 'Streak' },
];

// ── Badge Item ─────────────────────────────────────────────────────────────────
function BadgeItem({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.badgeItem}>
      <View style={styles.badgeCircle}>
        <Ionicons name={icon} size={22} color={Colors.primary} />
      </View>
      <Text style={styles.badgeLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function MyProfileScreen({ navigation }: { navigation: any }) {
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
          {/* Large top placeholder */}
          <View style={styles.photoLarge}>
            <Ionicons name="person" size={48} color={Colors.textMuted} />
          </View>
          {/* Two smaller placeholders side by side */}
          <View style={styles.photoRow}>
            <View style={styles.photoSmall} />
            <View style={styles.photoSmallRight}>
              {/* +3 MORE overlay on the second photo */}
              <View style={styles.moreOverlay}>
                <Text style={styles.moreText}>+3 MORE</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* ── Academic Details ── */}
          <Text style={styles.sectionLabel}>Academic Details</Text>
          <View style={styles.academicCard}>
            {ACADEMIC_ROWS.map((row, i) => (
              <View key={row.label}>
                <View style={styles.academicRow}>
                  <Text style={styles.academicKey}>{row.label}</Text>
                  <Text style={styles.academicValue}>{row.value}</Text>
                </View>
                {i < ACADEMIC_ROWS.length - 1 && (
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.badgesScrollView}
            contentContainerStyle={styles.badgesScrollContent}
          >
            {BADGES.map((b) => (
              <BadgeItem key={b.label} icon={b.icon} label={b.label} />
            ))}
          </ScrollView>

          {/* ── Edit Profile ── */}
          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="pencil" size={16} color={Colors.textOnYellow} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
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
  },
  photoRow: {
    flexDirection: 'row',
  },
  photoSmall: {
    flex: 1,
    height: 130,
    backgroundColor: Colors.surfaceMid,
  },
  photoSmallRight: {
    flex: 1,
    height: 130,
    backgroundColor: Colors.surfaceMid,
    overflow: 'hidden',
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
});
