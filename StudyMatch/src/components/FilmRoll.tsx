import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const BURGUNDY = '#662222';
const FILM_BG = '#1A1008';
const SPROCKET_COLOR = '#2E2010';

interface Photo {
  id: string;
  caption: string;
  // In production: uri: string
}

interface Props {
  photos: Photo[];
}

// ── Sprocket holes (film perforations) ────────────────────────────────────────
function SprocketRow({ count }: { count: number }) {
  return (
    <View style={styles.sprocketRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.sprocketHole} />
      ))}
    </View>
  );
}

// ── Single polaroid frame ─────────────────────────────────────────────────────
function PolaroidFrame({ photo }: { photo: Photo }) {
  // Slightly random tilt for each frame using a deterministic offset
  const tilt = ((photo.id.charCodeAt(0) % 7) - 3) * 1.2;

  return (
    <View style={[styles.polaroidWrapper, { transform: [{ rotate: `${tilt}deg` }] }]}>
      <View style={styles.polaroid}>
        {/* Photo area */}
        <View style={styles.photoArea}>
          {/* Film grain overlay */}
          <View style={styles.filmGrain} />
          <Text style={styles.photoPlaceholder}>📷</Text>
        </View>
        {/* Caption strip */}
        <View style={styles.captionStrip}>
          <Text style={styles.caption}>{photo.caption}</Text>
        </View>
      </View>
      {/* Tape strip on top */}
      <View style={styles.tape} />
    </View>
  );
}

// ── Main FilmRoll ─────────────────────────────────────────────────────────────
export default function FilmRoll({ photos }: Props) {
  const sprocketCount = Math.ceil(width / 18);

  return (
    <View style={styles.filmStrip}>
      {/* Top sprocket track */}
      <View style={styles.sprocketTrack}>
        <SprocketRow count={sprocketCount} />
      </View>

      {/* Scrollable frames */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.framesRow}
        style={styles.framesScroll}
      >
        {photos.map((photo) => (
          <PolaroidFrame key={photo.id} photo={photo} />
        ))}
      </ScrollView>

      {/* Bottom sprocket track */}
      <View style={styles.sprocketTrack}>
        <SprocketRow count={sprocketCount} />
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  filmStrip: {
    backgroundColor: FILM_BG,
    paddingVertical: 0,
    width: '100%',
  },

  // Sprockets
  sprocketTrack: {
    backgroundColor: SPROCKET_COLOR,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  sprocketRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  sprocketHole: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: FILM_BG,
    borderWidth: 1,
    borderColor: '#3A2A10',
  },

  // Frames scroll
  framesScroll: {
    backgroundColor: FILM_BG,
  },
  framesRow: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 24,
    alignItems: 'center',
  },

  // Polaroid
  polaroidWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  polaroid: {
    backgroundColor: '#FAF5EE',
    borderRadius: 2,
    padding: 6,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  photoArea: {
    width: 130,
    height: 115,
    backgroundColor: '#C8B89A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  filmGrain: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.08)',
    opacity: 0.4,
  },
  photoPlaceholder: {
    fontSize: 36,
    opacity: 0.5,
  },
  captionStrip: {
    width: 130,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#FAF5EE',
  },
  caption: {
    fontSize: 11,
    color: BURGUNDY,
    fontStyle: 'italic',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Tape strip
  tape: {
    position: 'absolute',
    top: -8,
    width: 40,
    height: 16,
    backgroundColor: 'rgba(245, 218, 167, 0.55)',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(180, 150, 80, 0.3)',
  },
});
