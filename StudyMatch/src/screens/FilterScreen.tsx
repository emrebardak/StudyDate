import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  LayoutChangeEvent,
  GestureResponderEvent,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';
import type { DiscoveryFilters } from '../types';

const DEFAULT_FILTERS: DiscoveryFilters = {
  institution: '',
  selectedUni: '',
  distance: 25,
  minAge: 21,
  maxAge: 28,
  departments: ['Computer Science', 'Engineering'],
};

const QUICK_UNIS = ['Harvard Univ.', 'MIT', 'Stanford'];

const ALL_DEPARTMENTS = [
  'Computer Science',
  'Engineering',
  'Mathematics',
  'Physics',
  'Business',
  'Medicine',
  'Law',
];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

interface SliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

function Slider({ value, min, max, onChange }: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  function handlePress(e: GestureResponderEvent) {
    if (!trackWidth) return;
    const x = e.nativeEvent.locationX;
    const ratio = clamp(x / trackWidth, 0, 1);
    onChange(Math.round(min + ratio * (max - min)));
  }

  const pct = clamp((value - min) / (max - min), 0.001, 0.999);

  return (
    <Pressable
      style={s.trackWrap}
      onPress={handlePress}
      onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <View style={s.trackRow}>
        <View style={[s.trackFill, { flex: pct }]} />
        <View style={s.distThumb} />
        <View style={[s.trackEmpty, { flex: 1 - pct }]} />
      </View>
    </Pressable>
  );
}

interface RangeSliderProps {
  minValue: number;
  maxValue: number;
  min: number;
  max: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
}

function RangeSlider({
  minValue,
  maxValue,
  min,
  max,
  onChangeMin,
  onChangeMax,
}: RangeSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const range = max - min;
  const minPct = clamp((minValue - min) / range, 0.001, 0.999);
  const maxPct = clamp((maxValue - min) / range, 0.001, 0.999);
  const fillPct = clamp(maxPct - minPct, 0.001, 0.999);

  function handlePress(e: GestureResponderEvent) {
    if (!trackWidth) return;
    const x = e.nativeEvent.locationX;
    const ratio = clamp(x / trackWidth, 0, 1);
    const tapped = Math.round(min + ratio * range);
    const distToMin = Math.abs(tapped - minValue);
    const distToMax = Math.abs(tapped - maxValue);
    if (distToMin <= distToMax) {
      onChangeMin(clamp(tapped, min, maxValue - 1));
    } else {
      onChangeMax(clamp(tapped, minValue + 1, max));
    }
  }

  return (
    <Pressable
      style={s.trackWrap}
      onPress={handlePress}
      onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <View style={s.trackRow}>
        <View style={[s.trackEmpty, { flex: minPct }]} />
        <View style={s.ageThumb} />
        <View style={[s.trackFill, { flex: fillPct }]} />
        <View style={s.ageThumb} />
        <View style={[s.trackEmpty, { flex: 1 - maxPct }]} />
      </View>
    </Pressable>
  );
}

interface DeptChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function DeptChip({ label, selected, onPress }: DeptChipProps) {
  return (
    <TouchableOpacity
      style={[s.deptChip, selected && s.deptChipSel]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[s.deptChipText, selected && s.deptChipTextSel]}>
        {label.toUpperCase()}
      </Text>
      {selected && (
        <Ionicons name="checkmark" size={14} color={Colors.textOnYellow} />
      )}
    </TouchableOpacity>
  );
}

export default function FilterScreen({ navigation, route }: { navigation: any; route: any }) {
  const initial: DiscoveryFilters = route?.params?.current ?? DEFAULT_FILTERS;

  const [institution, setInstitution] = useState(initial.institution);
  const [selectedUni, setSelectedUni] = useState(initial.selectedUni);
  const [distance, setDistance] = useState(initial.distance);
  const [minAge, setMinAge] = useState(initial.minAge);
  const [maxAge, setMaxAge] = useState(initial.maxAge);
  const [departments, setDepartments] = useState<string[]>(initial.departments);

  function toggleDept(dept: string) {
    setDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept],
    );
  }

  function resetFilters() {
    setInstitution(DEFAULT_FILTERS.institution);
    setSelectedUni(DEFAULT_FILTERS.selectedUni);
    setDistance(DEFAULT_FILTERS.distance);
    setMinAge(DEFAULT_FILTERS.minAge);
    setMaxAge(DEFAULT_FILTERS.maxAge);
    setDepartments(DEFAULT_FILTERS.departments);
  }

  function applyFilters() {
    const filters: DiscoveryFilters = {
      institution,
      selectedUni,
      distance,
      minAge,
      maxAge,
      departments,
    };
    navigation.navigate('MainTabs', { screen: 'Match', params: { filters } });
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.headerBtn}
          onPress={() => navigation?.goBack?.()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={s.headerTitle}>Filters</Text>

        <TouchableOpacity style={s.headerBtn} onPress={resetFilters}>
          <Text style={s.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.card}>
          <Text style={s.cardTitle}>Institution</Text>

          <View style={s.searchBox}>
            <Ionicons name="search" size={16} color={Colors.primary} />
            <TextInput
              style={s.searchInput}
              placeholder="Search universities..."
              placeholderTextColor={Colors.textSecondary}
              value={institution}
              onChangeText={setInstitution}
            />
          </View>

          <View style={s.pillRow}>
            {QUICK_UNIS.map((uni) => {
              const active = selectedUni === uni;
              return (
                <TouchableOpacity
                  key={uni}
                  style={[s.pill, active && s.pillSel]}
                  onPress={() => setSelectedUni(active ? '' : uni)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.pillText, active && s.pillTextSel]}>{uni}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardTitle}>Max Distance</Text>
            <View style={s.badge}>
              <Text style={s.badgeText}>{distance} Miles</Text>
            </View>
          </View>

          <Slider
            value={distance}
            min={1}
            max={100}
            onChange={setDistance}
          />
          <View style={s.trackEdges}>
            <Text style={s.trackEdgeLabel}>1 mi</Text>
            <Text style={s.trackEdgeLabel}>100+ mi</Text>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardTitle}>Age Range</Text>
            <View style={s.badge}>
              <Text style={s.badgeText}>
                {minAge} - {maxAge}
              </Text>
            </View>
          </View>

          <RangeSlider
            minValue={minAge}
            maxValue={maxAge}
            min={18}
            max={50}
            onChangeMin={setMinAge}
            onChangeMax={setMaxAge}
          />
          <View style={s.trackEdges}>
            <Text style={s.trackEdgeLabel}>18</Text>
            <Text style={s.trackEdgeLabel}>50+</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Department Focus</Text>
          <View style={s.deptGrid}>
            {ALL_DEPARTMENTS.map((dept) => (
              <DeptChip
                key={dept}
                label={dept}
                selected={departments.includes(dept)}
                onPress={() => toggleDept(dept)}
              />
            ))}
          </View>
        </View>

        <View style={s.scrollBottom} />
      </ScrollView>

      <View style={s.bottomBar}>
        <TouchableOpacity
          style={s.applyBtn}
          activeOpacity={0.85}
          onPress={applyFilters}
        >
          <Text style={s.applyBtnText}>Apply Filters</Text>
          <Ionicons name="options-outline" size={18} color={Colors.textOnYellow} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceHigh,
  },
  headerBtn: {
    width: 52,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  resetText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.primary,
    letterSpacing: 0.5,
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.base,
    gap: Spacing.lg,
  },
  scrollBottom: { height: 100 },
  card: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    padding: 0,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pill: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
  },
  pillSel: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  pillTextSel: {
    color: Colors.textOnYellow,
  },
  trackWrap: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  trackEmpty: {
    height: 4,
    backgroundColor: Colors.surfaceMid,
    borderRadius: 4,
  },
  distThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    ...{
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 4,
    },
  },
  ageThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    ...{
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 4,
    },
  },
  trackEdges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  trackEdgeLabel: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  deptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  deptChipSel: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  deptChipText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  deptChipTextSel: {
    color: Colors.textOnYellow,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceHigh,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...{
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 14,
      elevation: 6,
    },
  },
  applyBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textOnYellow,
  },
});
