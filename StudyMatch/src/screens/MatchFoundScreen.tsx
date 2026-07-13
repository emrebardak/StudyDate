import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// ── Colors ────────────────────────────────────────────────────────────────────
const BG           = '#000814'; // Ink Black
const SURFACE      = '#001d3d'; // Prussian Blue
const SURFACE_HIGH = '#003566'; // Regal Navy
const SURFACE_MID  = '#00214a';
const PRIMARY      = '#ffc300'; // School Bus Yellow
const TEXT         = '#FFFFFF';
const TEXT_MUTED   = '#8899AA';
const TEXT_DIM     = '#4A6080';
const ON_PRIMARY   = '#000814';

interface Props {
  navigation: any;
}

export default function MatchFoundScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Medal icon ───────────────────────────────────────────────────── */}
        <View style={styles.medalContainer}>
          <Ionicons name="medal" size={48} color={PRIMARY} />
        </View>

        {/* ── Photo pair ──────────────────────────────────────────────────── */}
        <View style={styles.photoPairRow}>
          <View style={styles.photoCircle}>
            <Ionicons name="person" size={42} color={TEXT_DIM} />
          </View>

          {/* Gold lightning circle between the two photos */}
          <View style={styles.lightningCircle}>
            <Ionicons name="flash" size={22} color={ON_PRIMARY} />
          </View>

          <View style={styles.photoCircle}>
            <Ionicons name="person" size={42} color={TEXT_DIM} />
          </View>
        </View>

        {/* ── 98% Synergy badge ───────────────────────────────────────────── */}
        <View style={styles.synergyBadge}>
          <Ionicons name="school-outline" size={16} color={PRIMARY} />
          <Text style={styles.synergyText}>98% SYNERGY</Text>
        </View>

        {/* ── MATCH SECURED ───────────────────────────────────────────────── */}
        <Text style={styles.matchLine}>MATCH</Text>
        <Text style={styles.matchLine}>SECURED</Text>

        {/* ── Description ─────────────────────────────────────────────────── */}
        <Text style={styles.description}>
          {'You and '}
          <Text style={styles.partnerName}>Dr. Eleanor Vance</Text>
          {' are ready to master '}
          <Text style={styles.subjectName}>Advanced Quantum Mechanics</Text>
          {' together.'}
        </Text>

        <View style={styles.spacer} />

        {/* ── Start Chat button ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.startChatBtn}
          onPress={() => navigation.navigate('Chat', { matchId: 'new' })}
          activeOpacity={0.85}
        >
          <Text style={styles.startChatText}>Start Chat  ▷</Text>
        </TouchableOpacity>

        {/* ── Keep Swiping button ─────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.keepSwipingBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.keepSwipingText}>Keep Swiping</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },

  // ── Medal
  medalContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: SURFACE,
    borderWidth: 2,
    borderColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },

  // ── Photo pair
  photoPairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  photoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: SURFACE_MID,
    borderWidth: 3,
    borderColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightningCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    marginHorizontal: -10,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 10,
  },

  // ── Synergy badge
  synergyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: SURFACE_HIGH,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 30,
    marginBottom: 28,
  },
  synergyText: {
    color: PRIMARY,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // ── MATCH SECURED
  matchLine: {
    color: PRIMARY,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
    lineHeight: 50,
  },

  // ── Description
  description: {
    color: TEXT_MUTED,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 20,
    paddingHorizontal: 8,
  },
  partnerName: {
    color: TEXT,
    fontWeight: '700',
  },
  subjectName: {
    color: PRIMARY,
    fontWeight: '600',
  },

  spacer: {
    flex: 1,
    minHeight: 36,
  },

  // ── Start Chat button
  startChatBtn: {
    width: '100%',
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  startChatText: {
    color: ON_PRIMARY,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ── Keep Swiping button
  keepSwipingBtn: {
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: SURFACE_HIGH,
    paddingVertical: 17,
    alignItems: 'center',
  },
  keepSwipingText: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
});
