import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { supabase } from '../lib/supabase';

const MAP_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCKZt0_dZBSxx8Wv0IF1C9jHonv7yU2O-QC0Wcz9IFvmQViUu2XQOvrxmmIoYNnX9i2XaVxpwRB7_8E4vXtSYAv3Cb-13PwrZnSBhUdVkjRKB7zMpBEmzlynqnQw10vQtH8nZ8S4WSDa039NrEoRUrhA85_8y9MN6YE9aasWxw5VOcaC_-FM-wAKN4tNiKB1iANuJY19kRpSZhLYgNyAg5fHM_aASZPigKWrqw_phdu7DA5SGvDqOZ9_esBOV3TxpYMJ7h7nrgSfaw';

const AVATAR_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCnwcqz1oDIILU0Vjri33nUJsDJOMz2magYNB8sqXcSfNiAo_9OP9TLx9baULfJy8S_tWAORRecSYu8apD7HY5vzUTmvGY1OiKrQfhbhgOkjgOQZlnN1w2dH8y3-Rt0NqMm4jvzMVdFi8dx372gH0dOiiA0IPryHIQ3ELXrUyC9-026Uhtm4atjJ6TxBPQZV3aNfxWaX5gy4TLM_OuT8D8r1TiJVHk-aHXcGOo7PkNs0zCq1BmLXeqhihk7d1p37BWQVMmTfh-RrT4';

const SUBJECT_TAGS = ['Computer Science', 'Algorithms', 'Data Structures'];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function clampHour(v: number) {
  if (v < 0) return 23;
  if (v > 23) return 0;
  return v;
}

function clampMinute(v: number) {
  if (v < 0) return 55;
  if (v > 55) return 0;
  return v;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

interface TimeSpinnerProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

function TimeSpinner({ value, onIncrement, onDecrement }: TimeSpinnerProps) {
  return (
    <View style={styles.timeCol}>
      <TouchableOpacity onPress={onIncrement} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Ionicons name="chevron-up" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
      <View style={styles.timeBox}>
        <Text style={styles.timeValue}>{String(value).padStart(2, '0')}</Text>
      </View>
      <TouchableOpacity onPress={onDecrement} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

export default function StudyDatePlannerScreen({
  navigation,
  route,
}: {
  navigation: any;
  route?: any;
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(3);
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedLocation] = useState('Main Library, Floor 3');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Computer Science']);
  const [sessionNotes, setSessionNotes] = useState('');
  const [hours, setHours] = useState(14);
  const [minutes, setMinutes] = useState(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const monthLabel = useMemo(
    () =>
      new Date(viewYear, viewMonth).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [viewYear, viewMonth],
  );

  const calendarCells = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);
    const cells: { day: number; current: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, current: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, current: true });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: cells.length - daysInMonth - firstDay + 1, current: false });
    }
    return cells;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function handleCancel() {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  }

  async function handleCreate() {
    if (saving) return;
    setError('');
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) {
        setError('Not signed in.');
        return;
      }

      // Match comes from the Chat route param when opened as a modal; when opened
      // from the Planner tab, fall back to the user's single active match (Lock
      // System guarantees at most one — PRD §5).
      let matchId: string | null = route?.params?.matchId ?? null;
      if (!matchId) {
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('id')
          .eq('status', 'active')
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .maybeSingle();
        if (matchError) {
          setError(matchError.message);
          return;
        }
        matchId = match?.id ?? null;
      }
      if (!matchId) {
        setError('No active match. Find a study partner in Discovery first.');
        return;
      }

      const scheduled = new Date(viewYear, viewMonth, selectedDay, hours, minutes);
      const focusSubject = [selectedTags.join(', '), sessionNotes.trim()]
        .filter(Boolean)
        .join(' — ');

      const { error: insertError } = await supabase.from('study_dates').insert({
        match_id: matchId,
        proposed_by: userId,
        location: selectedLocation,
        scheduled_time: scheduled.toISOString(),
        focus_subject: focusSubject || null,
      });
      if (insertError) {
        setError(insertError.message);
        return;
      }
      handleCancel();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create the study date.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: AVATAR_IMAGE }} style={styles.avatar} />
          <Text style={styles.brandTitle}>StudyMatch</Text>
        </View>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="settings-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Plan Session</Text>
          <Text style={styles.pageSubtitle}>Set location, time, and objectives.</Text>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationCardHeader}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.sectionSubtitle}>Select a library or cafe.</Text>
          </View>

          <View style={styles.mapWrap}>
            <Image source={{ uri: MAP_IMAGE }} style={styles.mapImage} />
            <View style={styles.mapSearchOverlay}>
              <Ionicons name="search" size={16} color={Colors.textSecondary} />
              <TextInput
                style={styles.mapSearchInput}
                placeholder="Search locations..."
                placeholderTextColor={Colors.textMuted}
                value={locationSearch}
                onChangeText={setLocationSearch}
              />
            </View>
          </View>

          <View style={styles.locationFooter}>
            <View>
              <Text style={styles.locationName}>{selectedLocation}</Text>
              <Text style={styles.locationZone}>Quiet Zone</Text>
            </View>
            <TouchableOpacity style={styles.confirmBtn}>
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.objectivesCard}>
          <Text style={styles.sectionTitle}>Objectives</Text>

          <Text style={styles.fieldLabel}>Subject Tags</Text>
          <View style={styles.tagRow}>
            {SUBJECT_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tag, active && styles.tagActive]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>
                    {tag.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.addTagBtn}>
              <Ionicons name="add" size={14} color={Colors.textPrimary} />
              <Text style={styles.addTagText}>Tag</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>Session Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="What are we focusing on?"
            placeholderTextColor={Colors.textMuted}
            value={sessionNotes}
            onChangeText={setSessionNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.scheduleCard}>
          <Text style={styles.sectionTitle}>Schedule</Text>

          <View style={styles.calendarHeader}>
            <Text style={styles.calendarMonth}>{monthLabel}</Text>
            <View style={styles.calendarNav}>
              <TouchableOpacity onPress={prevMonth} style={styles.calendarNavBtn}>
                <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={nextMonth} style={styles.calendarNavBtn}>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((d, i) => (
              <Text key={`${d}-${i}`} style={styles.weekdayLabel}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarCells.map((cell, i) => {
              const isSelected = cell.current && cell.day === selectedDay;
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.dayCell}
                  disabled={!cell.current}
                  onPress={() => cell.current && setSelectedDay(cell.day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !cell.current && styles.dayTextMuted,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {cell.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.timeSection}>
            <Text style={styles.fieldLabel}>Select Time (24H)</Text>
            <View style={styles.timeRow}>
              <TimeSpinner
                value={hours}
                onIncrement={() => setHours(clampHour(hours + 1))}
                onDecrement={() => setHours(clampHour(hours - 1))}
              />
              <Text style={styles.timeSeparator}>:</Text>
              <TimeSpinner
                value={minutes}
                onIncrement={() => setMinutes(clampMinute(minutes + 5))}
                onDecrement={() => setMinutes(clampMinute(minutes - 5))}
              />
            </View>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createBtn, saving && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.background} size="small" />
            ) : (
              <>
                <Ionicons name="calendar-outline" size={18} color={Colors.background} />
                <Text style={styles.createBtnText}>Create Date</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xxl }} />
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
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
  },
  brandTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.base,
    gap: Spacing.lg,
  },
  pageHeader: {
    marginBottom: Spacing.sm,
  },
  pageTitle: {
    fontSize: Typography.size.hero,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  locationCard: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  locationCardHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  mapWrap: {
    height: 220,
    position: 'relative',
    backgroundColor: Colors.surfaceHigh,
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  mapSearchOverlay: {
    position: 'absolute',
    top: Spacing.base,
    left: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,28,41,0.95)',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  mapSearchInput: {
    flex: 1,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    padding: 0,
  },
  locationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    backgroundColor: Colors.surfaceMid,
  },
  locationName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  locationZone: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  confirmBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.background,
  },
  objectivesCard: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  fieldLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  tagActive: {
    backgroundColor: Colors.primary,
  },
  tagText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tagTextActive: {
    color: Colors.background,
  },
  addTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  addTagText: {
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    padding: Spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  scheduleCard: {
    backgroundColor: Colors.surfaceMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  calendarMonth: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  calendarNav: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  calendarNavBtn: {
    padding: 4,
    borderRadius: Radius.sm,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  dayTextMuted: {
    color: Colors.textSecondary,
    opacity: 0.5,
  },
  dayTextSelected: {
    backgroundColor: Colors.primary,
    color: Colors.background,
    fontWeight: Typography.weight.bold,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
  },
  timeCol: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeBox: {
    width: 64,
    height: 64,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  timeSeparator: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.base,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'transparent',
  },
  cancelBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  createBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.background,
  },
  createBtnDisabled: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: Typography.size.sm,
    color: Colors.danger,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
});
