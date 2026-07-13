import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import VintageStamp from './VintageStamp';
import { AUDIO_STAMPS, PACING_STAMPS, FUEL_STAMPS } from '../types';

// ── Colors ────────────────────────────────────────────────────────────────────
const SURFACE      = '#001d3d'; // Prussian Blue
const SURFACE_HIGH = '#003566'; // Regal Navy
const SURFACE_MID  = '#00214a';
const PRIMARY      = '#ffc300'; // School Bus Yellow
const GOLD         = '#ffd60a';
const TEXT         = '#FFFFFF';
const TEXT_MUTED   = '#8899AA';
const TEXT_DIM     = '#4A6080';
const ON_PRIMARY   = '#000814';

export const CARD_WIDTH = Dimensions.get('window').width - 32;

// ── Mock data ─────────────────────────────────────────────────────────────────
export const MOCK_PROFILE_CARD = {
  name: 'Elena Rostova',
  age: 23,
  university: 'MIT',
  department: 'Biomedical Engineering',
  year: 'Research Fellow',
  trustScore: 4.8,
  goalText:
    'Seeking a disciplined study partner for thesis review and deep-work sessions. Familiarity with MATLAB is a plus.',
  isRevealed: false,
  isVerified: true,
  audio: 'Headphones On / Ignored World' as const,
  pacing: 'Strict Pomodoro (25/5)' as const,
  fuel: 'Black Filter Coffee' as const,
};

// ── Main ProfileCard ───────────────────────────────────────────────────────────
interface Props {
  profile?: typeof MOCK_PROFILE_CARD;
}

export default function ProfileCard({ profile = MOCK_PROFILE_CARD }: Props) {
  const audioStamp  = AUDIO_STAMPS[profile.audio];
  const pacingStamp = PACING_STAMPS[profile.pacing];
  const fuelStamp   = FUEL_STAMPS[profile.fuel];

  return (
    <View style={styles.card}>

      {/* ── PHOTO ZONE ──────────────────────────────────────────────────────── */}
      <View style={styles.photoZone}>
        {/* Dark placeholder */}
        <View style={styles.photoBg} />

        {/* Centred silhouette */}
        <View style={styles.silhouetteContainer}>
          <Ionicons
            name={profile.isRevealed ? 'person' : 'person-outline'}
            size={80}
            color="rgba(255,255,255,0.08)"
          />
        </View>

        {/* Faux gradient – three stacked overlays darkening toward the bottom */}
        <View style={styles.gradFull} />
        <View style={styles.gradMid} />
        <View style={styles.gradBottom} />

        {/* Verified badge – top right */}
        {profile.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={28} color={PRIMARY} />
          </View>
        )}

        {/* Trust score – top left */}
        <View style={styles.trustBadge}>
          <Ionicons name="star" size={11} color={PRIMARY} />
          <Text style={styles.trustText}>{profile.trustScore}</Text>
        </View>

        {/* Bottom content: name / dept / tags */}
        <View style={styles.photoBottom}>
          <Text style={styles.photoName}>
            {profile.name}, {profile.age}
          </Text>
          <Text style={styles.photoDept}>{profile.department}</Text>
          <View style={styles.tagRow}>
            <View style={styles.tagNavy}>
              <Text style={styles.tagNavyText}>{profile.university}</Text>
            </View>
            <View style={styles.tagGold}>
              <Text style={styles.tagGoldText}>
                {profile.year.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── BIO SECTION ─────────────────────────────────────────────────────── */}
      <View style={styles.bioSection}>
        <View style={styles.bioBar} />
        <Text style={styles.bioText}>"{profile.goalText}"</Text>
      </View>

      {/* ── STAMPS SECTION ──────────────────────────────────────────────────── */}
      <View style={styles.stampsSection}>
        <Text style={styles.stampsLabel}>STUDY VIBE</Text>
        <View style={styles.stampsRow}>
          <View style={styles.stampSlot1}>
            <VintageStamp stamp={audioStamp} size="md" />
          </View>
          <View style={styles.stampSlot2}>
            <VintageStamp stamp={pacingStamp} size="md" />
          </View>
          <View style={styles.stampSlot3}>
            <VintageStamp stamp={fuelStamp} size="md" />
          </View>
        </View>
      </View>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: SURFACE,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 12,
  },

  // ── Photo zone
  photoZone: {
    width: '100%',
    height: 340,
    position: 'relative',
    overflow: 'hidden',
  },
  photoBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SURFACE_MID,
  },
  silhouetteContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Faux gradient layers (lightest → darkest toward the bottom)
  gradFull: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(0,8,20,0.28)',
  },
  gradMid: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(0,8,20,0.45)',
  },
  gradBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: 'rgba(0,8,20,0.62)',
  },

  // Verified badge
  verifiedBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,8,20,0.50)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Trust score pill
  trustBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,8,20,0.50)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  trustText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: '700',
  },

  // Bottom-of-photo content
  photoBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 4,
  },
  photoName: {
    color: TEXT,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  photoDept: {
    color: GOLD,
    fontSize: 16,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  tagNavy: {
    backgroundColor: SURFACE_HIGH,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagNavyText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagGold: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagGoldText: {
    color: ON_PRIMARY,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Bio section
  bioSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: SURFACE,
  },
  bioBar: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: PRIMARY,
    borderRadius: 2,
    minHeight: 20,
  },
  bioText: {
    flex: 1,
    color: TEXT_MUTED,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 21,
  },

  // ── Stamps section
  stampsSection: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 8,
    backgroundColor: SURFACE,
  },
  stampsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: TEXT_DIM,
    letterSpacing: 2,
  },
  stampsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  stampSlot1: { marginTop: 6 },
  stampSlot2: { marginTop: -4 },
  stampSlot3: { marginTop: 10 },
});
