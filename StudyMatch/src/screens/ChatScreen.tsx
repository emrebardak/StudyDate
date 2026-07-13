import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, Radius, Typography, Shadow } from '../theme';
import { supabase } from '../lib/supabase';
import { mapMessageFromAPI } from '../data/mappers';
import type { Message } from '../types';

const { width } = Dimensions.get('window');

function formatTime(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Message Bubble ─────────────────────────────────────────────────────────────
function MessageBubble({
  message,
  currentUserId,
}: {
  message: Message;
  currentUserId: string | null;
}) {
  const isMe = message.senderId === currentUserId;
  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={styles.bubbleText}>{message.content}</Text>
        <View style={[styles.bubbleMeta, isMe && styles.bubbleMetaMe]}>
          <Text style={styles.bubbleTime}>{formatTime(message.createdAt)}</Text>
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
export default function ChatScreen({
  navigation,
  route,
}: {
  navigation: any;
  route?: any;
}) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(
    route?.params?.matchId ?? null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Resolve session user + match, then load the message history. When opened from
  // the Chats tab (no matchId param), fall back to the user's single active match —
  // the Lock System guarantees there is at most one (PRD §5).
  const loadChat = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) {
        setError('Not signed in.');
        return;
      }
      setCurrentUserId(userId);

      let resolvedMatchId = route?.params?.matchId ?? null;
      if (!resolvedMatchId) {
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
        resolvedMatchId = match?.id ?? null;
      }
      setMatchId(resolvedMatchId);
      if (!resolvedMatchId) {
        // No active match — the empty state below explains it.
        setMessages([]);
        return;
      }

      const { data: rows, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', resolvedMatchId)
        .order('created_at', { ascending: true });
      if (msgError) {
        setError(msgError.message);
        return;
      }
      setMessages((rows ?? []).map(mapMessageFromAPI));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load chat.');
    } finally {
      setLoading(false);
    }
  }, [route?.params?.matchId]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  async function handleSend() {
    const content = inputText.trim();
    if (!content || !matchId || !currentUserId || sending) return;
    setSending(true);
    try {
      const { data: row, error: insertError } = await supabase
        .from('messages')
        .insert({ match_id: matchId, sender_id: currentUserId, content })
        .select()
        .single();
      if (insertError) {
        setError(insertError.message);
        return;
      }
      setMessages((prev) => [...prev, mapMessageFromAPI(row)]);
      setInputText('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send message.');
    } finally {
      setSending(false);
    }
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

          {/* Loading / error / empty states */}
          {loading && (
            <View style={styles.stateWrap}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          )}
          {!loading && error !== '' && (
            <TouchableOpacity style={styles.stateWrap} onPress={loadChat}>
              <Text style={styles.stateText}>{error}</Text>
              <Text style={styles.stateRetry}>Tap to retry</Text>
            </TouchableOpacity>
          )}
          {!loading && !error && !matchId && (
            <View style={styles.stateWrap}>
              <Text style={styles.stateText}>
                No active match yet. Find a study partner in Discovery first.
              </Text>
            </View>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              currentUserId={currentUserId}
            />
          ))}

          {/* Reveal card */}
          {!loading && !error && matchId != null && <RevealCard />}
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

          <TouchableOpacity
            style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={sending}
          >
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

  // Loading / error / empty states
  stateWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  stateText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  stateRetry: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
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
  sendBtnDisabled: {
    opacity: 0.6,
  },
});
