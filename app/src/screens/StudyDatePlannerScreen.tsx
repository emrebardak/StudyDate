import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../theme';

const { width, height } = Dimensions.get('window');

const LOCATIONS = [
  'Main Library, 3rd Floor',
  'Engineering Café',
  'Café Nova, East Campus',
  'Science Building Lounge',
  'Student Union Study Hall',
];

// ── Sub-components ─────────────────────────────────────────────────────────────
function TicketHeader({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.ticketHeader}>
      <Text style={styles.admitOne}>ADMIT ONE</Text>
      <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

function TicketPerforation() {
  return (
    <View style={styles.perforation}>
      {/* Left notch */}
      <View style={styles.notchLeft} />
      {/* Dashes */}
      <View style={styles.perforationDashes}>
        {Array.from({ length: 18 }).map((_, i) => (
          <View key={i} style={styles.perforationDash} />
        ))}
      </View>
      {/* Right notch */}
      <View style={styles.notchRight} />
    </View>
  );
}

function LocationDropdown({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (loc: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setOpen((v) => !v)}
      >
        <Text
          style={[
            styles.dropdownText,
            !selected && styles.dropdownPlaceholder,
          ]}
        >
          {selected || 'Select Campus Location...'}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.textMuted}
        />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownList}>
          {LOCATIONS.map((loc) => (
            <TouchableOpacity
              key={loc}
              style={styles.dropdownItem}
              onPress={() => {
                onSelect(loc);
                setOpen(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  selected === loc && styles.dropdownItemSelected,
                ]}
              >
                {loc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function MapPlaceholder() {
  return (
    <View style={styles.mapPlaceholder}>
      <View style={styles.mapPin}>
        <Ionicons name="location" size={20} color={Colors.primary} />
      </View>
      <View style={styles.mapGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.mapGridLine} />
        ))}
      </View>
      <Text style={styles.mapLabel}>Campus Map</Text>
    </View>
  );
}

function TimeSpinner({
  value,
  onIncrement,
  onDecrement,
}: {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <View style={styles.timeSpinner}>
      <TouchableOpacity style={styles.spinBtn} onPress={onDecrement}>
        <Ionicons name="remove" size={16} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.spinValue}>{String(value).padStart(2, '0')}</Text>
      <TouchableOpacity style={styles.spinBtn} onPress={onIncrement}>
        <Ionicons name="add" size={16} color={Colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function StudyDatePlannerScreen({
  navigation,
}: {
  navigation: any;
}) {
  const [location, setLocation] = useState('');
  const [hours, setHours] = useState(10);
  const [minutes, setMinutes] = useState(30);
  const [dateText] = useState('');

  function clampHours(v: number) {
    if (v < 0) return 23;
    if (v > 23) return 0;
    return v;
  }
  function clampMinutes(v: number) {
    if (v < 0) return 55;
    if (v > 55) return 0;
    return v;
  }

  return (
    // Dim background overlay
    <View style={styles.overlay}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Ticket Card ── */}
        <View style={styles.ticketCard}>
          {/* Ticket top (golden header) */}
          <View style={styles.ticketTop}>
            <TicketHeader onClose={() => navigation?.goBack?.()} />
            <Text style={styles.ticketTitle}>Study Session</Text>
            <Text style={styles.ticketSubtitle}>Propose a time and place.</Text>
          </View>

          {/* Perforation */}
          <TicketPerforation />

          {/* Ticket body */}
          <View style={styles.ticketBody}>
            {/* Location */}
            <Text style={styles.fieldLabel}>LOCATION</Text>
            <LocationDropdown selected={location} onSelect={setLocation} />

            {/* Map preview */}
            <MapPlaceholder />

            {/* Date */}
            <Text style={[styles.fieldLabel, { marginTop: Spacing.base }]}>DATE</Text>
            <View style={styles.dateField}>
              <Text style={styles.datePlaceholder}>MM / DD / YYYY</Text>
              <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />
            </View>

            {/* Time */}
            <Text style={[styles.fieldLabel, { marginTop: Spacing.base }]}>TIME</Text>
            <View style={styles.timeRow}>
              <TimeSpinner
                value={hours}
                onIncrement={() => setHours(clampHours(hours + 1))}
                onDecrement={() => setHours(clampHours(hours - 1))}
              />
              <Text style={styles.timeSeparator}>:</Text>
              <TimeSpinner
                value={minutes}
                onIncrement={() => setMinutes(clampMinutes(minutes + 5))}
                onDecrement={() => setMinutes(clampMinutes(minutes - 5))}
              />
            </View>

            {/* Propose button */}
            <TouchableOpacity style={styles.proposeBtn}>
              <Text style={styles.proposeBtnText}>PROPOSE DATE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 26, 14, 0.45)',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xl,
  },

  // Ticket card
  ticketCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    ...Shadow.strong,
  },

  // Ticket top (golden)
  ticketTop: {
    backgroundColor: Colors.accentBg,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  admitOne: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  ticketTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  ticketSubtitle: {
    fontSize: Typography.size.md,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Perforation
  perforation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  notchLeft: {
    width: 16,
    height: 16,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(44, 26, 14, 0.45)',
    marginLeft: -8,
  },
  notchRight: {
    width: 16,
    height: 16,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(44, 26, 14, 0.45)',
    marginRight: -8,
  },
  perforationDashes: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: Spacing.sm,
  },
  perforationDash: {
    width: 6,
    height: 1.5,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
  },

  // Ticket body
  ticketBody: {
    padding: Spacing.base,
  },
  fieldLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },

  // Location dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  dropdownText: {
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: Colors.textLight,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    marginTop: 4,
    backgroundColor: Colors.surface,
    ...Shadow.card,
    zIndex: 10,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownItemText: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  dropdownItemSelected: {
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },

  // Map placeholder
  mapPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#C8C4B8',
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mapGrid: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mapGridLine: {
    width: '33%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 15,
  },
  mapPin: {
    zIndex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    padding: 4,
    ...Shadow.card,
  },
  mapLabel: {
    position: 'absolute',
    bottom: Spacing.sm,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  // Date field
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceWarm,
  },
  datePlaceholder: {
    fontSize: Typography.size.md,
    color: Colors.textLight,
  },

  // Time
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timeSpinner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  spinBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  spinValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  timeSeparator: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textMuted,
  },

  // Propose button
  proposeBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.surfaceWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  proposeBtnText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 1,
  },
});
