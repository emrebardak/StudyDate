import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { StampMeta } from '../types';

// ── Colors ────────────────────────────────────────────────────────────────────
const SURFACE  = '#001d3d';              // Prussian Blue
const PRIMARY  = '#ffc300';             // Gold
const GOLD_50  = 'rgba(255,195,0,0.5)'; // Gold at 0.5 opacity for inner ring

interface Props {
  stamp: StampMeta;
  size?: 'sm' | 'md' | 'lg';
}

export default function VintageStamp({ stamp, size = 'md' }: Props) {
  const dim       = size === 'sm' ? 72 : size === 'lg' ? 104 : 88;
  const iconSize  = size === 'sm' ? 22 : size === 'lg' ? 34 : 28;
  const labelSize = size === 'sm' ? 7  : size === 'lg' ? 10  : 8;

  return (
    <View
      style={[
        styles.stamp,
        {
          width: dim,
          height: dim,
          transform: [{ rotate: `${stamp.rotation}deg` }],
        },
      ]}
    >
      {/* Inner dashed ring – gold at 0.5 opacity */}
      <View
        style={[
          styles.innerRing,
          { width: dim - 10, height: dim - 10 },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.icon, { fontSize: iconSize }]}>
          {stamp.icon}
        </Text>
        <Text
          style={[styles.label, { fontSize: labelSize }]}
          numberOfLines={2}
        >
          {stamp.label.toUpperCase()}
        </Text>
      </View>

      {/* Corner perforations – gold-bordered circles */}
      {(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const).map(
        (corner) => (
          <View
            key={corner}
            style={[styles.perforation, styles[corner]]}
          />
        ),
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  stamp: {
    borderRadius: 6,
    borderWidth: 2,
    borderColor: PRIMARY,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  innerRing: {
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: GOLD_50,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    gap: 3,
    zIndex: 1,
  },
  icon: {
    textAlign: 'center',
  },
  label: {
    color: PRIMARY,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.8,
    lineHeight: 10,
  },
  // Corner perforations
  topLeft:     { top: 4,    left: 4 },
  topRight:    { top: 4,    right: 4 },
  bottomLeft:  { bottom: 4, left: 4 },
  bottomRight: { bottom: 4, right: 4 },
  perforation: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: 'transparent',
  },
});
