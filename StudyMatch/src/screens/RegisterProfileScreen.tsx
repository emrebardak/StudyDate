import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';

const ALL_DEPARTMENTS = [
  'Computer Science',
  'Engineering',
  'Mathematics',
  'Physics',
  'Business',
  'Medicine',
  'Law',
];

export default function RegisterProfileScreen({ navigation, route }: { navigation: any; route: any }) {
  const incoming = route?.params?.data ?? {};

  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [department, setDepartment] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const canContinue =
    fullName.trim().length > 0 &&
    institution.trim().length > 0 &&
    department.length > 0;

  function handleContinue() {
    if (!canContinue) return;
    navigation.navigate('RegisterTraits', {
      data: {
        ...incoming,
        fullName: fullName.trim(),
        institution: institution.trim(),
        department,
      },
    });
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>

            {/* Step header + progress */}
            <View style={styles.stepHeader}>
              <Text style={styles.stepLabel}>STEP 2 OF 4</Text>
              <Text style={styles.stepSection}>Profile Setup</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '50%' }]} />
            </View>

            {/* Hero */}
            <View style={styles.heroIconWrap}>
              <Ionicons name="school-outline" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Academic Profile</Text>
            <Text style={styles.heroDesc}>
              Define your academic identity to match with elite study sessions.
            </Text>

            {/* ── Full Legal Name ── */}
            <Text style={styles.fieldLabel}>FULL LEGAL NAME</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={Colors.primary} />
              <TextInput
                style={styles.input}
                placeholder="Jane Doe"
                placeholderTextColor={Colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
                autoCorrect={false}
              />
            </View>

            {/* ── Institution ── */}
            <Text style={styles.fieldLabel}>INSTITUTION / UNIVERSITY</Text>
            <View style={styles.inputRow}>
              <Ionicons name="business-outline" size={18} color={Colors.primary} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Stanford University"
                placeholderTextColor={Colors.textMuted}
                value={institution}
                onChangeText={setInstitution}
                autoCorrect={false}
              />
            </View>

            {/* ── Department dropdown ── */}
            <Text style={styles.fieldLabel}>PRIMARY DEPARTMENT</Text>
            <TouchableOpacity
              style={styles.inputRow}
              activeOpacity={0.75}
              onPress={() => setDropdownOpen((open) => !open)}
            >
              <Ionicons name="flask-outline" size={18} color={Colors.primary} />
              <Text
                style={[
                  styles.dropdownValue,
                  !department && styles.dropdownPlaceholder,
                ]}
              >
                {department || 'Select your department'}
              </Text>
              <Ionicons
                name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={styles.dropdownList}>
                {ALL_DEPARTMENTS.map((dept, idx) => {
                  const selected = dept === department;
                  return (
                    <TouchableOpacity
                      key={dept}
                      style={[
                        styles.dropdownItem,
                        idx < ALL_DEPARTMENTS.length - 1 && styles.dropdownItemBorder,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setDepartment(dept);
                        setDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selected && styles.dropdownItemTextSel,
                        ]}
                      >
                        {dept}
                      </Text>
                      {selected && (
                        <Ionicons name="checkmark" size={16} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Continue */}
            <TouchableOpacity
              style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
              activeOpacity={canContinue ? 0.85 : 1}
              onPress={handleContinue}
              disabled={!canContinue}
            >
              <Text style={styles.continueBtnText}>Continue to Specialization</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.textOnYellow} />
            </TouchableOpacity>

            {/* Back link */}
            <TouchableOpacity
              style={styles.backLink}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={16} color={Colors.textPrimary} />
              <Text style={styles.backLinkText}>Back to Account Setup</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  scrollContent: {
    padding: Spacing.base,
    paddingTop: 56,
    paddingBottom: Spacing.xl,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },

  // Step header + progress
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  stepLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  stepSection: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceMid,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },

  // Hero
  heroIconWrap: {
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.black,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroDesc: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },

  // Fields
  fieldLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceMid,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  dropdownValue: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  dropdownPlaceholder: {
    color: Colors.textMuted,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceMid,
    marginTop: -Spacing.md,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownItemText: {
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },
  dropdownItemTextSel: {
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.lg,
  },

  // Continue
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    marginBottom: Spacing.lg,
  },
  continueBtnDisabled: {
    opacity: 0.45,
  },
  continueBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textOnYellow,
  },

  // Back link
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  backLinkText: {
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.medium,
  },
});
