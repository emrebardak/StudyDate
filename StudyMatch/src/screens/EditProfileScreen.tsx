import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../theme';

const { width } = Dimensions.get('window');

// ── Mock initial data ─────────────────────────────────────────────────────────
const INITIAL_TRAITS = ['Punctual', 'Silent & Focused'];

// ── Sub-components ─────────────────────────────────────────────────────────────
function PhotoSlot({
  isPrimary,
  hasPhoto,
  onRemove,
  onAdd,
}: {
  isPrimary?: boolean;
  hasPhoto?: boolean;
  onRemove?: () => void;
  onAdd?: () => void;
}) {
  if (isPrimary) {
    return (
      <View style={styles.primaryPhotoWrapper}>
        <View style={styles.primaryPhoto}>
          <Ionicons name="person" size={48} color={Colors.textLight} />
        </View>
        <TouchableOpacity style={styles.editPhotoBtn}>
          <Ionicons name="pencil" size={12} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.primaryLabel}>Primary Photo</Text>
      </View>
    );
  }

  if (hasPhoto) {
    return (
      <View style={styles.secondaryPhoto}>
        <View style={styles.secondaryPhotoInner}>
          <Ionicons name="image-outline" size={24} color={Colors.textLight} />
        </View>
        <TouchableOpacity style={styles.removePhotoBtn} onPress={onRemove}>
          <Ionicons name="close" size={12} color={Colors.white} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.addPhotoSlot} onPress={onAdd}>
      <Ionicons name="add" size={24} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  icon,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  icon?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={16}
            color={Colors.textMuted}
            style={styles.fieldIcon}
          />
        )}
        <TextInput
          style={[styles.input, icon && styles.inputWithIcon, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={Colors.textLight}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
        />
      </View>
    </View>
  );
}

function TraitChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <View style={styles.traitChip}>
      <Text style={styles.traitLabel}>{label}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
        <Ionicons name="close-circle" size={14} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function EditProfileScreen({ navigation }: { navigation: any }) {
  const [name, setName] = useState('Elif Yılmaz');
  const [university, setUniversity] = useState('Istanbul Technical University');
  const [department, setDepartment] = useState('Computer Science');
  const [city, setCity] = useState('Istanbul');
  const [status, setStatus] = useState(
    'Mastering Data Structures - Focusing on Big O notation today. Looking for someone to review binary trees with.'
  );
  const [traits, setTraits] = useState<string[]>(INITIAL_TRAITS);
  const [secondaryPhotos, setSecondaryPhotos] = useState([true, true]);

  function removeTrait(label: string) {
    setTraits((prev) => prev.filter((t) => t !== label));
  }

  function removeSecondaryPhoto(index: number) {
    setSecondaryPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function addSecondaryPhoto() {
    if (secondaryPhotos.length < 4) {
      setSecondaryPhotos((prev) => [...prev, true]);
    }
  }

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={() => navigation?.goBack?.()}>
          <Text style={styles.saveBtnText}>SAVE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Photos Section ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.redDot} />
          <Text style={styles.sectionLabel}>PHOTOS</Text>
        </View>

        {/* Primary photo */}
        <PhotoSlot isPrimary />

        {/* Secondary photos */}
        <View style={styles.secondaryPhotosRow}>
          {secondaryPhotos.map((_, i) => (
            <PhotoSlot
              key={i}
              hasPhoto
              onRemove={() => removeSecondaryPhoto(i)}
            />
          ))}
          {secondaryPhotos.length < 4 && (
            <PhotoSlot onAdd={addSecondaryPhoto} />
          )}
        </View>

        <View style={styles.divider} />

        {/* ── Academic Details ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.redDot} />
          <Text style={styles.sectionLabel}>ACADEMIC DETAILS</Text>
        </View>

        <FormField label="FULL NAME" value={name} onChangeText={setName} />
        <FormField label="UNIVERSITY" value={university} onChangeText={setUniversity} />
        <FormField label="DEPARTMENT" value={department} onChangeText={setDepartment} />
        <FormField
          label="CITY"
          value={city}
          onChangeText={setCity}
          icon="location-outline"
        />

        <View style={styles.divider} />

        {/* ── Current Status ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.redDot} />
          <Text style={styles.sectionLabel}>CURRENT STATUS</Text>
          <View style={styles.focusModeTag}>
            <Text style={styles.focusModeText}>FOCUS MODE</Text>
          </View>
        </View>

        <View style={styles.statusBox}>
          <TextInput
            style={styles.statusInput}
            value={status}
            onChangeText={setStatus}
            multiline
            numberOfLines={4}
            placeholderTextColor={Colors.textLight}
          />
        </View>

        <View style={styles.divider} />

        {/* ── Active Traits ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.redDot} />
          <Text style={styles.sectionLabel}>ACTIVE TRAITS</Text>
        </View>

        <View style={styles.traitsContainer}>
          {traits.map((t) => (
            <TraitChip key={t} label={t} onRemove={() => removeTrait(t)} />
          ))}
          <TouchableOpacity style={styles.addTraitBtn}>
            <Ionicons name="add" size={14} color={Colors.textMuted} />
            <Text style={styles.addTraitText}>Add Trait</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  saveBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },

  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.base,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginTop: Spacing.base,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.danger,
  },
  sectionLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    letterSpacing: 1,
    flex: 1,
  },
  focusModeTag: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  focusModeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.base,
    marginHorizontal: -Spacing.base,
  },

  // Primary photo
  primaryPhotoWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  primaryPhoto: {
    width: width - Spacing.base * 2,
    height: 220,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPhotoBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    marginTop: Spacing.sm,
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
  },

  // Secondary photos
  secondaryPhotosRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  secondaryPhoto: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  secondaryPhotoInner: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  addPhotoSlot: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },

  // Form fields
  fieldWrapper: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  fieldIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  inputWithIcon: {},
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },

  // Status box
  statusBox: {
    backgroundColor: Colors.surfaceWarm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  statusInput: {
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Traits
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  traitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accentBg,
    borderWidth: 1,
    borderColor: Colors.accentLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  traitLabel: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
  },
  addTraitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  addTraitText: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
  },


});
