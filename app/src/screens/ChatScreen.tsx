import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../theme';

const { width } = Dimensions.get('window');

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MATCH = {
  alias: 'Anon_Chem101',
  messageCount: 3,
  revealThreshold: 10,
  isRevealed: false,
};

const MOCK_MESSAGES = [
  {
    id: '1',
    senderId: 'other',
    content:
      "Hey! I saw you're also taking O-Chem this semester. The syllabus looks brutal.",
    time: '14:05',
  },
  {
    id: '2',
    senderId: 'me',
    content:
      "Tell me about it. I'm already stuck on Chapter 2 mechanisms. Do you prefer studying in the library or a cafe?",
    time: '14:12',
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────────
function MatchHeader({ revealed }: { revealed: boolean }) {
  return (
    <View style={styles.matchHeader}>
      {/* Blurred avatar */}
      <View style={styles.blurredAvatar}>
        {revealed ? (
          <Ionicons name="person" size={28} color={Colors.white} />
        ) : (
          <View style={styles.blurOverlay}>
            <Ionicons name="person" size={28} color="rgba(255,255,255,0.3)" />
          </View>
        )}
      </View>

      {/* Alias + progress */}
      <Text style={styles.matchAlias}>
        Locked Match: {MATCH.alias}
      </Text>
      <Text style={styles.matchSubtitle}>
        {MATCH.messageCount} messages sent. Reveal at {MATCH.revealThreshold}.
      </Text>

      {/* Reveal button */}
      <TouchableOpacity style={styles.revealBtn}>
        <Ionicons name="eye-outline" size={14} color={Colors.primary} />
        <Text style={styles.revealBtnText}>REVEAL PROFILE</Text>
      </TouchableOpacity>
    </View>
  );
}

function MessageBubble({
  message,
}: {
  message: { senderId: string; content: string; time: string };
}) {
  const isMe = message.senderId === 'me';
  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
          {message.content}
        </Text>
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
          {message.time}
        </Text>
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function ChatScreen({ navigation }: { navigation: any }) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const scrollRef = useRef<ScrollView>(null);

  function handleSend() {
    if (!inputText.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        senderId: 'me',
        content: inputText.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInputText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <View style={styles.root}>
      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <Ionicons name="menu" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>StudyMatch</Text>
        <TouchableOpacity style={styles.avatarCircle}>
          <Ionicons name="person" size={16} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* ── Scrollable chat area ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: false })
          }
        >
          {/* Match header card */}
          <MatchHeader revealed={MATCH.isRevealed} />

          {/* Dashed divider */}
          <View style={styles.dashedDivider}>
            {Array.from({ length: 14 }).map((_, i) => (
              <View key={i} style={styles.dash} />
            ))}
          </View>

          {/* Connection timestamp */}
          <Text style={styles.connectionTimestamp}>
            Connection established. Oct 24, 14:02
          </Text>

          {/* Messages */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </ScrollView>

        {/* ── Input Bar ── */}
        <View style={styles.inputBar}>
          {/* Planner shortcut */}
          <TouchableOpacity style={styles.plannerBtn}>
            <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Ionicons name="send" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Bottom Tab Bar ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="grid-outline" size={22} color={Colors.tabInactive} />
          <Text style={styles.tabLabel}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="aperture-outline" size={22} color={Colors.tabInactive} />
          <Text style={styles.tabLabel}>Match</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItemActive}>
          <Ionicons name="chatbubble" size={22} color={Colors.primary} />
          <Text style={styles.tabLabelActive}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="calendar-outline" size={22} color={Colors.tabInactive} />
          <Text style={styles.tabLabel}>Planner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.accentBg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.accentBg,
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Match header card
  matchHeader: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.base,
    ...Shadow.card,
  },
  blurredAvatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(100,70,50,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchAlias: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
  },
  matchSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  revealBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },

  // Dashed divider
  dashedDivider: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  dash: {
    width: 8,
    height: 1.5,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
  },

  connectionTimestamp: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.sm,
  },

  // Bubbles
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    justifyContent: 'flex-start',
  },
  bubbleRowMe: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: width * 0.72,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 4,
    ...Shadow.card,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  bubbleTextMe: {
    color: Colors.white,
  },
  bubbleTime: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  bubbleTimeMe: {
    color: 'rgba(255,255,255,0.6)',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  plannerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.tabBg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingBottom: 24,
    paddingTop: Spacing.sm,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 },
  tabItemActive: { flex: 1, alignItems: 'center', gap: 2 },
  tabLabel: { fontSize: Typography.size.xs, color: Colors.tabInactive },
  tabLabelActive: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },
});
