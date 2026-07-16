import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { supabase } from '../lib/supabase';
import { mapUserFromAPI } from '../data/mappers';
import { toFriendlyErrorMessage } from '../lib/errors';
import type { User } from '../types';

// Real users.year is DB-constrained to exactly these four (CHECK constraint) —
// the values ARE the display labels now, unlike the old 6-option mock list
// (which included 'Graduate / Masters' / 'PhD Candidate', neither a valid
// column value, and used a "Freshman / Year 1" display format that didn't
// match the stored value at all).
const ACADEMIC_YEARS: NonNullable<User['year']>[] = [
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
];

// Same trait vocabulary as RegisterTraitsScreen (Step 3 of signup) — both
// screens write into the same free-text `current_tags` column, so using two
// different label sets for overlapping concepts (e.g. "Night Owl" vs.
// "night-owl" / "Pomodoro" in both) would make a tag picked at signup show as
// unselected here. Kept as its own local list (screens are self-contained,
// per this codebase's convention) but the key strings must stay in sync.
const STUDY_TRAITS = [
  { key: 'Night Owl', icon: 'moon-outline' },
  { key: 'Coffee Fueled', icon: 'cafe-outline' },
  { key: 'Early Bird', icon: 'sunny-outline' },
  { key: 'Library Lover', icon: 'book-outline' },
  { key: 'Group Study', icon: 'people-outline' },
  { key: 'Solo Focus', icon: 'headset-outline' },
  { key: 'Pomodoro', icon: 'timer-outline' },
  { key: 'Vocal Learner', icon: 'megaphone-outline' },
] as const;

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{title}</Text>
    </View>
  );
}

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  icon: string;
  multiline?: boolean;
  placeholder?: string;
}

function FormInput({
  label,
  value,
  onChangeText,
  icon,
  multiline,
  placeholder,
}: FormInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputRow, multiline && styles.inputRowMultiline]}>
        {!multiline && (
          <Ionicons
            name={icon as any}
            size={18}
            color={Colors.textSecondary}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
        />
      </View>
    </View>
  );
}

function photoComingSoon() {
  Alert.alert('Coming soon', "Photo uploads aren't available yet.");
}

export default function EditProfileScreen({ navigation }: { navigation: any }) {
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [academicYear, setAcademicYear] =
    useState<NonNullable<User['year']>>('Freshman');
  const [bio, setBio] = useState('');
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [customTrait, setCustomTrait] = useState('');
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [gallerySlots] = useState(3);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) {
        setLoadError('Not signed in.');
        return;
      }
      const { data: row, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        setLoadError(toFriendlyErrorMessage(error));
        return;
      }
      const user = mapUserFromAPI(row);
      setPhotoUrl(user.photoUrl);
      setUniversity(user.university);
      setDepartment(user.department);
      setAcademicYear(
        (ACADEMIC_YEARS as string[]).includes(user.year)
          ? user.year
          : 'Freshman',
      );
      setBio(user.bio ?? '');
      setSelectedTraits(user.currentTags ?? []);
    } catch (e: any) {
      setLoadError(
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

  function toggleTrait(key: string) {
    setSelectedTraits(prev =>
      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key],
    );
  }

  function addCustomTrait() {
    const trait = customTrait.trim();
    if (!trait) return;
    setSelectedTraits(prev => (prev.includes(trait) ? prev : [...prev, trait]));
    setCustomTrait('');
  }

  async function handleSave() {
    setSaveError('');
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) {
        setSaveError('Your session expired. Please sign in again.');
        return;
      }
      const { error } = await supabase
        .from('users')
        .update({
          university: university.trim(),
          department: department.trim(),
          year: academicYear,
          bio: bio.trim(),
          current_tags: selectedTraits,
        })
        .eq('id', userId);
      if (error) {
        setSaveError(toFriendlyErrorMessage(error));
        return;
      }
      navigation?.goBack?.();
    } catch (e: any) {
      setSaveError(
        toFriendlyErrorMessage(e, {
          fallbackMessage: 'Failed to save. Please try again.',
        }),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.stateContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.root}>
        <View style={styles.stateContainer}>
          <Ionicons name="warning-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>{loadError}</Text>
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

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerSide}
          onPress={() => navigation?.goBack?.()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Profile</Text>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.textOnYellow} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {!!saveError && <Text style={styles.saveErrorText}>{saveError}</Text>}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionHeader title="Visual Presence" />

        <View style={styles.visualRow}>
          <TouchableOpacity
            style={styles.avatarWrap}
            activeOpacity={0.85}
            onPress={photoComingSoon}
          >
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color={Colors.textMuted} />
              </View>
            )}
            <View style={styles.avatarOverlay}>
              <Ionicons
                name="camera-outline"
                size={28}
                color={Colors.primary}
              />
              <Text style={styles.avatarOverlayText}>Change</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.gallerySection}>
            <Text style={styles.galleryHint}>
              Add photos of your typical study environment or past projects to
              give matches a better sense of your style.
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryRow}
            >
              {Array.from({ length: gallerySlots }).map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.gallerySlot}
                  onPress={photoComingSoon}
                >
                  <Ionicons name="add" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <SectionHeader title="Institutional Details" />

        <View style={styles.formCard}>
          <FormInput
            label="University"
            value={university}
            onChangeText={setUniversity}
            icon="business-outline"
          />
          <FormInput
            label="Department / Major"
            value={department}
            onChangeText={setDepartment}
            icon="flask-outline"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Academic Year</Text>
            <TouchableOpacity
              style={styles.inputRow}
              onPress={() => setYearPickerOpen(v => !v)}
            >
              <Ionicons
                name="school-outline"
                size={18}
                color={Colors.textSecondary}
                style={styles.inputIcon}
              />
              <Text style={styles.selectValue}>{academicYear}</Text>
              <Ionicons
                name={yearPickerOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
            {yearPickerOpen && (
              <View style={styles.yearList}>
                {ACADEMIC_YEARS.map(year => (
                  <TouchableOpacity
                    key={year}
                    style={styles.yearItem}
                    onPress={() => {
                      setAcademicYear(year);
                      setYearPickerOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.yearItemText,
                        academicYear === year && styles.yearItemTextActive,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <FormInput
            label="Research Focus / Bio"
            value={bio}
            onChangeText={setBio}
            icon="document-text-outline"
            multiline
            placeholder="Describe your current academic focus..."
          />
        </View>

        <SectionHeader title="Study Methodologies" />

        <View style={styles.traitsCard}>
          <Text style={styles.traitsHint}>
            Select tags that best describe how you operate intellectually. This
            helps the matching algorithm find compatible partners.
          </Text>

          <View style={styles.traitsGrid}>
            {STUDY_TRAITS.map(trait => {
              const active = selectedTraits.includes(trait.key);
              return (
                <TouchableOpacity
                  key={trait.key}
                  style={[styles.traitChip, active && styles.traitChipActive]}
                  onPress={() => toggleTrait(trait.key)}
                >
                  <Ionicons
                    name={trait.icon as any}
                    size={16}
                    color={active ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.traitLabel,
                      active && styles.traitLabelActive,
                    ]}
                  >
                    {trait.key.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {selectedTraits
              .filter(t => !STUDY_TRAITS.some(st => st.key === t))
              .map(custom => (
                <TouchableOpacity
                  key={custom}
                  style={[styles.traitChip, styles.traitChipActive]}
                  onPress={() => toggleTrait(custom)}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={[styles.traitLabel, styles.traitLabelActive]}>
                    {custom.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}

            <View style={styles.customTraitRow}>
              <TouchableOpacity
                onPress={addCustomTrait}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="add" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TextInput
                style={styles.customTraitInput}
                placeholder="Add custom trait..."
                placeholderTextColor={Colors.textMuted}
                value={customTrait}
                onChangeText={setCustomTrait}
                onSubmitEditing={addCustomTrait}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMid,
  },
  headerSide: {
    width: 72,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    minWidth: 56,
    alignItems: 'center',
    ...{
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
      elevation: 4,
    },
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textOnYellow,
  },
  saveErrorText: {
    fontSize: Typography.size.sm,
    color: Colors.danger,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.base,
    gap: Spacing.lg,
  },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMid,
    paddingBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  visualRow: {
    gap: Spacing.lg,
  },
  avatarWrap: {
    alignSelf: 'flex-start',
    width: 128,
    height: 128,
    borderRadius: Radius.full,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.surfaceMid,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: Colors.surfaceMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,8,20,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
  },
  avatarOverlayText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  gallerySection: {
    flex: 1,
  },
  galleryHint: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.base,
  },
  galleryRow: {
    gap: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  gallerySlot: {
    width: 96,
    height: 96,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.surfaceMid,
    backgroundColor: Colors.surfaceMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceMid,
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderBottomWidth: 2,
    borderBottomColor: Colors.surfaceMid,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  inputRowMultiline: {
    alignItems: 'flex-start',
    borderWidth: 2,
    borderColor: Colors.surfaceMid,
    borderRadius: Radius.sm,
    borderBottomWidth: 2,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    padding: 0,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: Spacing.xs,
  },
  selectValue: {
    flex: 1,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  yearList: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    marginTop: 4,
    overflow: 'hidden',
  },
  yearItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  yearItemText: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  yearItemTextActive: {
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },
  traitsCard: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceMid,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  traitsHint: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  traitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.surfaceMid,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  traitChipActive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primary,
  },
  traitLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  traitLabelActive: {
    color: Colors.primary,
  },
  customTraitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderBottomWidth: 2,
    borderBottomColor: Colors.surfaceMid,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  customTraitInput: {
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    minWidth: 120,
    padding: 0,
  },
});
