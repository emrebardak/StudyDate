import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { StampMeta } from '../types';

// ── Category color palettes ────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  audio: {
    bg: '#EDE0C4',
    border: '#B8935A',
    text: '#6B4A1E',
    ink: 'rgba(107,74,30,0.18)',
  },
  pacing: {
    bg: '#E8D5D5',
    border: '#9B4444',
    text: '#662222',
    ink: 'rgba(102,34,34,0.15)',
  },
  fuel: {
    bg: '#D8E8D8',
    border: '#4A7A4A',
    text: '#2A5A2A',
    ink: 'rgba(42,90,42,0.15)',
  },
};

interface Props {
  stamp: StampMeta;
  size?: 'sm' | 'md' | 'lg';
}

export default function VintageStamp({ stamp, size = 'md' }: Props) {
  const palette = CATEGORY_COLORS[stamp.category];
  const dim = size === 'sm' ? 72 : size === 'lg' ? 104 : 88;
  const iconSize = size === 'sm' ? 22 : size === 'lg' ? 34 : 28;
  const labelSize = size === 'sm' ? 7 : size === 'lg' ? 10 : 8;

  return (
    <View
      style={[
        styles.stamp,
        {
          width: dim,
          height: dim,
          borderColor: palette.border,
          backgroundColor: palette.bg,
          transform: [{ rotate: `${stamp.rotation}deg` }],
        },
      ]}
    >
      {/* Outer ring */}
      <View
        style={[
          styles.outerRing,
          { borderColor: palette.border, width: dim - 6, height: dim - 6 },
        ]}
      />

      {/* Ink wash overlay — gives the "faded stamp" feel */}
      <View
        style={[
          styles.inkWash,
          { backgroundColor: palette.ink },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.icon, { fontSize: iconSize }]}>{stamp.icon}</Text>
        <Text
          style={[
            styles.label,
            { color: palette.text, fontSize: labelSize },
          ]}
          numberOfLines={2}
        >
          {stamp.label.toUpperCase()}
        </Text>
      </View>

      {/* Corner perforations (passport punch marks) */}
      {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map((corner) => (
        <View
          key={corner}
          style={[
            styles.perforation,
            styles[corner as keyof typeof styles] as any,
            { borderColor: palette.border },
          ]}
        />
      ))}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  stamp: {
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  inkWash: {
    ...StyleSheet.absoluteFill,
    borderRadius: 6,
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
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.8,
    lineHeight: 10,
  },
  // Corner perforations
  topLeft: { top: 4, left: 4 },
  topRight: { top: 4, right: 4 },
  bottomLeft: { bottom: 4, left: 4 },
  bottomRight: { bottom: 4, right: 4 },
  perforation: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
});
