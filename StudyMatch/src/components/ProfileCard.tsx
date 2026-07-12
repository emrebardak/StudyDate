import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import VintageStamp from './VintageStamp';
import {
  AUDIO_STAMPS,
  PACING_STAMPS,
  FUEL_STAMPS,
  type AudioEnvironment,
  type StudyPacing,
  type StudyFuel,
} from '../types';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = width - 32;

// ── Color constants ────────────────────────────────────────────────────────────
const CARD_BG       = '#F5DAA7'; // warm amber parchment
const BURGUNDY      = '#662222';
const INK_DARK      = '#2C1A0E';
const INK_MUTED     = '#7A5C3A';
const PHOTO_BG      = '#B0A090';
const BLUR_OVERLAY  = 'rgba(130,95,65,0.52)';
const RULED_LINE    = 'rgba(102,34,34,0.12)';

// ── Mock data ─────────────────────────────────────────────────────────────────
export const MOCK_PROFILE_CARD = {
  name: 'Eleanor',
  age: 21,
  university: 'Istanbul Tech.',
  department: 'Computer Science',
  year: 'Junior',
  trustScore: 4.8,
  goalText: 'Mastering Data Structures — focusing on Big O notation today.',
  isRevealed: false,
  audio: 'Headphones On / Ignored World' as AudioEnvironment,
  pacing: 'Strict Pomodoro (25/5)' as StudyPacing,
  fuel: 'Black Filter Coffee' as StudyFuel,
};

// ── Sub-components ─────────────────────────────────────────────────────────────

// Typewriter-style label
function TypewriterText({
  text,
  style,
}: {
  text: string;
  style?: object;
}) {
  return (
    <Text style={[styles.typewriter, style]}>{text}</Text>
  );
}

// Ruled paper lines beneath the goal text
function RuledLines({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.ruledLines}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.ruledLine} />
      ))}
    </View>
  );
}

// Corner fold decoration
function CornerFold() {
  return <View style={styles.cornerFold} />;
}

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
      <CornerFold />

      {/* ── Photo zone (blurred until revealed) ── */}
      <View style={styles.photoZone}>
        <View style={styles.photoBg} />
        {!profile.isRevealed && <View style={styles.blurLayer} />}
        <View style={styles.photoOverlayContent}>
          {!profile.isRevealed ? (
            <>
              <Ionicons name="eye-off-outline" size={32} color="rgba(255,255,255,0.75)" />
              <Text style={styles.lockedLabel}>PHOTO LOCKED</Text>
            </>
          ) : (
            <Ionicons name="person" size={48} color="rgba(255,255,255,0.4)" />
          )}
        </View>

        {/* University tag in photo — like a camera date stamp */}
        <View style={styles.dateStamp}>
          <Text style={styles.dateStampText}>
            {profile.university.toUpperCase()} • {new Date().getFullYear()}
          </Text>
        </View>
      </View>

      {/* ── Info zone ── */}
      <View style={styles.infoZone}>

        {/* Name row */}
        <View style={styles.nameRow}>
          <View>
            <TypewriterText
              text={`${profile.name}, ${profile.age}`}
              style={styles.nameText}
            />
            <TypewriterText
              text={`${profile.department.toUpperCase()} · ${profile.year.toUpperCase()}`}
              style={styles.deptText}
            />
          </View>
          {/* Trust score */}
          <View style={styles.scoreBox}>
            <Text style={styles.scoreValue}>{profile.trustScore}</Text>
            <Text style={styles.scoreStar}>★</Text>
          </View>
        </View>

        {/* Divider — red ink line */}
        <View style={styles.inkDivider} />

        {/* Today's goal — chalkboard / handwritten style */}
        <View style={styles.goalSection}>
          <Text style={styles.goalLabel}>— TODAY'S FOCUS —</Text>
          <Text style={styles.goalText}>"{profile.goalText}"</Text>
          <RuledLines count={2} />
        </View>

        {/* ── Stamps row ── */}
        <View style={styles.stampsSection}>
          <Text style={styles.stampsLabel}>STUDY VIBE</Text>
          <View style={styles.stampsRow}>
            {/* Audio stamp — placed with slight random offsets */}
            <View style={[styles.stampSlot, { marginTop: 6 }]}>
              <VintageStamp stamp={audioStamp} size="md" />
            </View>
            {/* Pacing stamp */}
            <View style={[styles.stampSlot, { marginTop: -4 }]}>
              <VintageStamp stamp={pacingStamp} size="md" />
            </View>
            {/* Fuel stamp */}
            <View style={[styles.stampSlot, { marginTop: 10 }]}>
              <VintageStamp stamp={fuelStamp} size="md" />
            </View>
          </View>
        </View>

      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2C1A0E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },

  // Corner fold (paper aesthetic)
  cornerFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopWidth: 28,
    borderLeftWidth: 28,
    borderTopColor: '#D4A843',
    borderLeftColor: CARD_BG,
    zIndex: 10,
  },

  // Photo zone
  photoZone: {
    width: '100%',
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  photoBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: PHOTO_BG,
  },
  blurLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: BLUR_OVERLAY,
  },
  photoOverlayContent: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockedLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },

  // Camera date stamp overlay
  dateStamp: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
  },
  dateStampText: {
    color: '#F5DAA7',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },

  // Info zone
  infoZone: {
    padding: 14,
    gap: 10,
    backgroundColor: CARD_BG,
  },

  // Name row
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameText: {
    fontSize: 20,
    fontWeight: '700',
    color: INK_DARK,
    letterSpacing: 0.5,
  },
  deptText: {
    fontSize: 10,
    color: INK_MUTED,
    letterSpacing: 1.2,
    marginTop: 2,
  },

  // Typewriter style
  typewriter: {
    fontFamily: 'monospace',
    color: INK_DARK,
  },

  // Trust score box
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BURGUNDY,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 2,
    transform: [{ rotate: '1.5deg' }],
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FAF5EE',
  },
  scoreStar: {
    fontSize: 11,
    color: '#F5DAA7',
  },

  // Ink divider
  inkDivider: {
    height: 1.5,
    backgroundColor: BURGUNDY,
    opacity: 0.35,
    marginVertical: 2,
  },

  // Goal section
  goalSection: {
    gap: 6,
  },
  goalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: BURGUNDY,
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  goalText: {
    fontSize: 13,
    color: INK_DARK,
    fontStyle: 'italic',
    lineHeight: 20,
    fontFamily: 'monospace',
  },

  // Ruled lines
  ruledLines: {
    gap: 8,
    marginTop: 4,
  },
  ruledLine: {
    height: 1,
    backgroundColor: RULED_LINE,
  },

  // Stamps section
  stampsSection: {
    gap: 6,
    marginTop: 4,
  },
  stampsLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: INK_MUTED,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  stampsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  stampSlot: {},
});
