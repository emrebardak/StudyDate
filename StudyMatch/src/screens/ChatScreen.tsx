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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme';

const { width } = Dimensions.get('window');

// ── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_MESSAGES = [
  {
    id: '1',
    senderId: 'other',
    content:
      'Hey! Just went over the quantum mechanics chapter. That wave function problem is actually pretty elegant once you see it.',
    time: '14:05',
  },
  {
    id: '2',
    senderId: 'other',
    content:
      'Have you started on the problem set yet? I think section 3 is going to hurt.',
    time: '14:07',
  },
  {
    id: '3',
    senderId: 'me',
    content:
      "Not yet, but I'm free Thursday evening if you want to tackle it together. Library 3rd floor?",
    time: '14:12',
  },
];

// ── Message Bubble ─────────────────────────────────────────────────────────────
function MessageBubble({
  message,
}: {
  message: (typeof MOCK_MESSAGES)[0];
}) {
  const isMe = message.senderId === 'me';
  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={styles.bubbleText}>{message.content}</Text>
        <View style={[styles.bubbleMeta, isMe && styles.bubbleMetaMe]}>
          <Text style={styles.bubbleTime}>{message.time}</Text>
          {isMe && (
            <Ionicons
              name="checkmark-done"
              size={12}
              color={Colors.primaryAlt}
              style={styles.checkIcon}
            />
          )}
        </View>
      </View>
    </View>
  );
}

// ── Reveal Card ────────────────────────────────────────────────────────────────
function RevealCard() {
  return (
    <View style={styles.revealCard}>
      <View style={styles.revealIconCircle}>
        <Ionicons name="eye-off" size={28} color={Colors.primary} />
      </View>
      <Text style={styles.revealTitle}>Ready to Reveal?</Text>
      <Text style={styles.revealDesc}>
        Both of you must agree to reveal your identities. Once confirmed,
        your profiles will be unlocked.
      </Text>
      <View style={styles.revealButtons}>
        <TouchableOpacity style={styles.btnReveal}>
          <Text style={styles.btnRevealText}>Reveal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnNotYet}>
          <Text style={styles.btnNotYetText}>Not Yet</Text>
        </TouchableOpacity>
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
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
    setInputText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.lockCircle}>
            <Ionicons name="lock-closed" size={14} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Physics Partner</Text>
            <Text style={styles.headerSubtitle}>Anonymous Match</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerMenu}>
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* ── Scroll ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: false })
          }
        >
          {/* System banner */}
          <View style={styles.systemBanner}>
            <Ionicons
              name="shield-checkmark-outline"
              size={12}
              color={Colors.textSecondary}
            />
            <Text style={styles.systemBannerText}>
              Match secured. Identity protected until mutual reveal.
            </Text>
          </View>

          {/* Messages */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Reveal card */}
          <RevealCard />
        </ScrollView>

        {/* ── Input Bar ── */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.addBtn}>
            <Ionicons name="add" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />

          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Ionicons name="arrow-up" size={18} color={Colors.textOnYellow} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBack: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  lockCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  headerSubtitle: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  headerMenu: {
    padding: Spacing.xs,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xl,
  },

  // System banner
  systemBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  systemBannerText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },

  // Bubbles
  bubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: Spacing.md,
  },
  bubbleRowMe: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: width * 0.72,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.sm,
  },
  bubbleMe: {
    backgroundColor: Colors.surfaceHigh,
    borderTopRightRadius: Radius.sm,
  },
  bubbleText: {
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  bubbleMetaMe: {
    alignSelf: 'flex-end',
  },
  bubbleTime: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  checkIcon: {
    marginLeft: 3,
  },

  // Reveal card
  revealCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.base,
    ...Shadow.card,
  },
  revealIconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  revealTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  revealDesc: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  revealButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  btnReveal: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
  },
  btnRevealText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textOnYellow,
  },
  btnNotYet: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnNotYetText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
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
    borderTopColor: Colors.border,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
