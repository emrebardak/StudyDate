import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:          '#F5EFE6',
  cardBg:      '#FAF5EE',
  surface:     '#FFFFFF',
  border:      '#D8CDB8',
  borderLight: '#EDE4D4',
  burgundy:    '#662222',
  maroon:      '#7B3F2E',
  amber:       '#D4A843',
  amberBg:     '#F5DAA7',
  amberLight:  '#FFF3D0',
  textPrimary: '#2C1A0E',
  textMuted:   '#8A7060',
  textLight:   '#B8A090',
  ink:         '#4A3020',
  white:       '#FFFFFF',
  sliderFill:  '#C4A060',
  sliderTrack: '#D8CDB8',
};

// ── Departments available ──────────────────────────────────────────────────────
const ALL_DEPARTMENTS = [
  'Computer Science',
  'Literature',
  'Physics',
  'Art History',
  'Mathematics',
  'Biology',
  'Engineering',
  'Philosophy',
];

const CITIES = [
  'Istanbul',
  'Ankara',
  'İzmir',
  'Bursa',
  'Antalya',
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function DashedDivider() {
  return (
    <View style={styles.dashedDivider}>
      {Array.from({ length: 30 }).map((_, i) => (
        <View key={i} style={styles.dash} />
      ))}
    </View>
  );
}

function LocationDropdown({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={[styles.dropdownText, !selected && styles.placeholder]}>
          {selected || 'Select City / Region...'}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={C.textMuted}
        />
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownList}>
          {CITIES.map((city) => (
            <TouchableOpacity
              key={city}
              style={styles.dropdownItem}
              onPress={() => { onSelect(city); setOpen(false); }}
            >
              <Text style={[
                styles.dropdownItemText,
                selected === city && styles.dropdownItemActive,
              ]}>
                {city}
              </Text>
              {selected === city && (
                <Ionicons name="checkmark" size={14} color={C.amber} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// Custom range slider using +/- controls
function AgeRangeSlider({
  minAge,
  maxAge,
  onChangeMin,
  onChangeMax,
}: {
  minAge: number;
  maxAge: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
}) {
  const TOTAL_MIN = 18;
  const TOTAL_MAX = 40;
  const range = TOTAL_MAX - TOTAL_MIN;
  const leftPct  = (minAge - TOTAL_MIN) / range;
  const rightPct = (maxAge - TOTAL_MIN) / range;

  const trackWidth = width - 32 - 32 - 32; // card padding + section padding

  return (
    <View>
      {/* Age display badge */}
      <View style={styles.ageRow}>
        <SectionLabel text="AGE RANGE" />
        <View style={styles.ageBadge}>
          <Text style={styles.ageBadgeText}>{minAge} — {maxAge}</Text>
        </View>
      </View>

      {/* Visual track */}
      <View style={styles.sliderTrackWrapper}>
        {/* Full track */}
        <View style={styles.sliderTrackBg} />
        {/* Filled range */}
        <View
          style={[
            styles.sliderFill,
            {
              left: leftPct * trackWidth,
              width: (rightPct - leftPct) * trackWidth,
            },
          ]}
        />
        {/* Min thumb */}
        <View style={[styles.sliderThumb, { left: leftPct * trackWidth - 10 }]} />
        {/* Max thumb */}
        <View style={[styles.sliderThumb, { left: rightPct * trackWidth - 10 }]} />
      </View>

      {/* +/- controls */}
      <View style={styles.sliderControls}>
        <View style={styles.sliderControl}>
          <Text style={styles.sliderControlLabel}>MIN</Text>
          <View style={styles.spinRow}>
            <TouchableOpacity
              style={styles.spinBtn}
              onPress={() => onChangeMin(Math.max(TOTAL_MIN, minAge - 1))}
            >
              <Ionicons name="remove" size={12} color={C.ink} />
            </TouchableOpacity>
            <Text style={styles.spinValue}>{minAge}</Text>
            <TouchableOpacity
              style={styles.spinBtn}
              onPress={() => onChangeMin(Math.min(maxAge - 1, minAge + 1))}
            >
              <Ionicons name="add" size={12} color={C.ink} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sliderControl}>
          <Text style={styles.sliderControlLabel}>MAX</Text>
          <View style={styles.spinRow}>
            <TouchableOpacity
              style={styles.spinBtn}
              onPress={() => onChangeMax(Math.max(minAge + 1, maxAge - 1))}
            >
              <Ionicons name="remove" size={12} color={C.ink} />
            </TouchableOpacity>
            <Text style={styles.spinValue}>{maxAge}</Text>
            <TouchableOpacity
              style={styles.spinBtn}
              onPress={() => onChangeMax(Math.min(TOTAL_MAX, maxAge + 1))}
            >
              <Ionicons name="add" size={12} color={C.ink} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function DepartmentChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.deptChip, selected && styles.deptChipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.deptChipText, selected && styles.deptChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// The vintage "STRICT.01" stamp
function StrictStamp() {
  return (
    <View style={styles.strictStamp}>
      <View style={styles.strictInner}>
        <Text style={styles.strictText}>STRICT.01</Text>
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function FilterScreen({ navigation }: { navigation: any }) {
  const [institution, setInstitution] = useState('');
  const [city, setCity] = useState('');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(30);
  const [departments, setDepartments] = useState<string[]>(['Literature']);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showAddDept, setShowAddDept] = useState(false);

  function toggleDept(dept: string) {
    setDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  }

  // Departments shown in the grid (selected ones + a few defaults)
  const visibleDepts = ['Computer Science', 'Literature', 'Physics', 'Art History'];

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="folder-open-outline" size={20} color={C.amber} />
          <Text style={styles.headerTitle}>PARTNER_ARCHIVE</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="options-outline" size={20} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Filter Card ── */}
        <View style={styles.filterCard}>
          {/* Card header */}
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.recordLabel}>RECORD.04</Text>
              <Text style={styles.cardTitle}>Filter Archive</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => navigation?.goBack?.()}
            >
              <Ionicons name="close" size={20} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          <DashedDivider />

          {/* ── INSTITUTION ── */}
          <View style={styles.fieldSection}>
            <SectionLabel text="INSTITUTION" />
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search University Database..."
                placeholderTextColor={C.textLight}
                value={institution}
                onChangeText={setInstitution}
              />
              <Ionicons name="search" size={18} color={C.textMuted} />
            </View>
          </View>

          {/* ── LOCATION RADIUS ── */}
          <View style={styles.fieldSection}>
            <SectionLabel text="LOCATION RADIUS" />
            <LocationDropdown selected={city} onSelect={setCity} />
          </View>

          {/* ── AGE RANGE ── */}
          <View style={styles.fieldSection}>
            <AgeRangeSlider
              minAge={minAge}
              maxAge={maxAge}
              onChangeMin={setMinAge}
              onChangeMax={setMaxAge}
            />
          </View>

          {/* ── DEPARTMENT FOCUS ── */}
          <View style={styles.fieldSection}>
            <SectionLabel text="DEPARTMENT FOCUS" />
            <View style={styles.deptGrid}>
              {visibleDepts.map((dept) => (
                <DepartmentChip
                  key={dept}
                  label={dept}
                  selected={departments.includes(dept)}
                  onPress={() => toggleDept(dept)}
                />
              ))}
              {/* + Add chip */}
              <TouchableOpacity
                style={styles.addDeptChip}
                onPress={() => setShowAddDept((v) => !v)}
              >
                <Ionicons name="add" size={14} color={C.textMuted} />
                <Text style={styles.addDeptText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Expanded department picker */}
            {showAddDept && (
              <View style={styles.deptPicker}>
                {ALL_DEPARTMENTS.filter((d) => !visibleDepts.includes(d)).map((dept) => (
                  <TouchableOpacity
                    key={dept}
                    style={[
                      styles.deptPickerItem,
                      departments.includes(dept) && styles.deptPickerItemActive,
                    ]}
                    onPress={() => toggleDept(dept)}
                  >
                    <Text style={styles.deptPickerText}>{dept}</Text>
                    {departments.includes(dept) && (
                      <Ionicons name="checkmark" size={14} color={C.amber} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── VERIFIED .edu TOGGLE ── */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={styles.verifiedIcon}>
                <Ionicons name="shield-checkmark-outline" size={18} color={C.amber} />
              </View>
              <Text style={styles.toggleLabel}>
                Show Only Verified .edu{'\n'}Users
              </Text>
            </View>
            <Switch
              value={verifiedOnly}
              onValueChange={setVerifiedOnly}
              trackColor={{ false: C.amberBg, true: C.amber }}
              thumbColor={C.white}
              ios_backgroundColor={C.amberBg}
            />
          </View>

          {/* STRICT.01 stamp */}
          <View style={styles.stampRow}>
            <StrictStamp />
          </View>
        </View>
      </ScrollView>

      {/* ── APPLY FILTERS button ── */}
      <TouchableOpacity
        style={styles.applyBtn}
        activeOpacity={0.85}
        onPress={() => navigation?.goBack?.()}
      >
        <Ionicons name="filter" size={16} color={C.white} />
        <Text style={styles.applyBtnText}>APPLY FILTERS</Text>
      </TouchableOpacity>

      {/* ── Bottom Tab Bar ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="albums-outline" size={20} color={C.textMuted} />
          <Text style={styles.tabLabel}>COLLECTION</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItemActive}>
          <View style={styles.tabActivePill}>
            <Ionicons name="options" size={20} color={C.burgundy} />
          </View>
          <Text style={styles.tabLabelActive}>FILTERS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="chatbubble-outline" size={20} color={C.textMuted} />
          <Text style={styles.tabLabel}>MESSAGES</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="book-outline" size={20} color={C.textMuted} />
          <Text style={styles.tabLabel}>JOURNAL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  headerDivider: {
    height: 1,
    backgroundColor: C.borderLight,
    marginHorizontal: 0,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },

  // Filter card
  filterCard: {
    backgroundColor: C.cardBg,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#2C1A0E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },

  // Card header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  recordLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dashed divider
  dashedDivider: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  dash: {
    width: 6,
    height: 1.5,
    backgroundColor: C.border,
    borderRadius: 999,
  },

  // Field sections
  fieldSection: {
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.ink,
    letterSpacing: 2,
    marginBottom: 10,
  },

  // Institution search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.textPrimary,
  },

  // Location dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: 14,
    color: C.textPrimary,
    flex: 1,
  },
  placeholder: {
    color: C.textLight,
  },
  dropdownList: {
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#2C1A0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  dropdownItemText: {
    fontSize: 14,
    color: C.textPrimary,
  },
  dropdownItemActive: {
    color: C.amber,
    fontWeight: '700',
  },

  // Age range
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ageBadge: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  ageBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
    fontFamily: 'monospace',
  },

  // Range slider track
  sliderTrackWrapper: {
    height: 20,
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sliderTrackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: C.sliderTrack,
    borderRadius: 999,
  },
  sliderFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: C.amber,
    borderRadius: 999,
    top: 8,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.amber,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    top: 0,
  },

  // Slider controls
  sliderControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderControl: {
    alignItems: 'center',
    gap: 4,
  },
  sliderControlLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1,
  },
  spinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spinBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinValue: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },

  // Department chips
  deptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deptChip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: C.surface,
  },
  deptChipActive: {
    backgroundColor: C.amberBg,
    borderColor: C.amber,
  },
  deptChipText: {
    fontSize: 13,
    color: C.textPrimary,
    fontWeight: '500',
  },
  deptChipTextActive: {
    color: C.burgundy,
    fontWeight: '700',
  },
  addDeptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'transparent',
  },
  addDeptText: {
    fontSize: 13,
    color: C.textMuted,
  },
  deptPicker: {
    marginTop: 10,
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.borderLight,
    overflow: 'hidden',
  },
  deptPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  deptPickerItemActive: {
    backgroundColor: C.amberLight,
  },
  deptPickerText: {
    fontSize: 13,
    color: C.textPrimary,
  },

  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  verifiedIcon: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: C.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    color: C.textPrimary,
    fontWeight: '500',
    lineHeight: 20,
    flex: 1,
  },

  // STRICT.01 stamp
  stampRow: {
    alignItems: 'flex-end',
  },
  strictStamp: {
    borderWidth: 2,
    borderColor: C.burgundy,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    transform: [{ rotate: '-1.5deg' }],
    backgroundColor: 'rgba(102,34,34,0.06)',
  },
  strictInner: {
    borderWidth: 1,
    borderColor: C.burgundy,
    borderStyle: 'dashed',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    opacity: 0.85,
  },
  strictText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.burgundy,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },

  // Apply button
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.burgundy,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingVertical: 16,
    shadowColor: C.burgundy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 2.5,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    paddingBottom: 24,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabItemActive: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabActivePill: {
    backgroundColor: C.amberBg,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.8,
  },
  tabLabelActive: {
    fontSize: 8,
    fontWeight: '800',
    color: C.burgundy,
    letterSpacing: 0.8,
  },
});
