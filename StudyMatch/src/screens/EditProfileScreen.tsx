import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';

const AVATAR_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAfRtCEqvKjIKG2VLK99NasCZa2LkEUJlnwuAHa7TPIr3lv_Oz6pqoqyCMrCdm4Y8QKkJya7EKioOdPBV2wVRORXXGpFJeCqNvewmX3tu2Q6EFlEY7hUIV0Pmzbjy0ErMfJez0nLsxVXQ9WN5IT1zBGhtx_6Zb-76B6yxgfvIMA8fG7KxPCzF2xp3sk11521UG0IXPnsBl7oWSSrpUqNDMr2IYt5a8ELD4cVKVtPJD04-jU2S6ODESaL4OeLCjnai2kMucQDAbkvYs';

const ACADEMIC_YEARS = [
  'Freshman / Year 1',
  'Sophomore / Year 2',
  'Junior / Year 3',
  'Senior / Year 4',
  'Graduate / Masters',
  'PhD Candidate',
];

const STUDY_TRAITS = [
  { id: 'night-owl', label: 'Night Owl', icon: 'moon-outline' },
  { id: 'pomodoro', label: 'Pomodoro', icon: 'timer-outline' },
  { id: 'textbook', label: 'Textbook Heavy', icon: 'book-outline' },
  { id: 'discussion', label: 'Discussion Based', icon: 'people-outline' },
  { id: 'visual', label: 'Visual Learner', icon: 'grid-outline' },
];

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

export default function EditProfileScreen({ navigation }: { navigation: any }) {
  const [university, setUniversity] = useState('Stanford University');
  const [department, setDepartment] = useState('Computer Science');
  const [academicYear, setAcademicYear] = useState('Junior / Year 3');
  const [bio, setBio] = useState(
    'Currently researching distributed systems and consensus algorithms. Looking for study partners aiming for deep-work sessions late into the evening.',
  );
  const [selectedTraits, setSelectedTraits] = useState<string[]>(['night-owl', 'pomodoro']);
  const [customTrait, setCustomTrait] = useState('');
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [gallerySlots] = useState(3);

  function toggleTrait(id: string) {
    setSelectedTraits((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
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
          style={styles.saveBtn}
          onPress={() => navigation?.goBack?.()}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionHeader title="Visual Presence" />

        <View style={styles.visualRow}>
          <TouchableOpacity style={styles.avatarWrap} activeOpacity={0.85}>
            <Image source={{ uri: AVATAR_IMAGE }} style={styles.avatar} />
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera-outline" size={28} color={Colors.primary} />
              <Text style={styles.avatarOverlayText}>Change</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.gallerySection}>
            <Text style={styles.galleryHint}>
              Add photos of your typical study environment or past projects to give
              matches a better sense of your style.
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryRow}
            >
              {Array.from({ length: gallerySlots }).map((_, i) => (
                <TouchableOpacity key={i} style={styles.gallerySlot}>
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
              onPress={() => setYearPickerOpen((v) => !v)}
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
                {ACADEMIC_YEARS.map((year) => (
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
            Select tags that best describe how you operate intellectually. This helps
            the matching algorithm find compatible partners.
          </Text>

          <View style={styles.traitsGrid}>
            {STUDY_TRAITS.map((trait) => {
              const active = selectedTraits.includes(trait.id);
              return (
                <TouchableOpacity
                  key={trait.id}
                  style={[styles.traitChip, active && styles.traitChipActive]}
                  onPress={() => toggleTrait(trait.id)}
                >
                  <Ionicons
                    name={trait.icon as any}
                    size={16}
                    color={active ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[styles.traitLabel, active && styles.traitLabelActive]}
                  >
                    {trait.label.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.customTraitRow}>
              <Ionicons name="add" size={16} color={Colors.textSecondary} />
              <TextInput
                style={styles.customTraitInput}
                placeholder="Add custom trait..."
                placeholderTextColor={Colors.textMuted}
                value={customTrait}
                onChangeText={setCustomTrait}
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
    ...{
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
      elevation: 4,
    },
  },
  saveBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textOnYellow,
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
