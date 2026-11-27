import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as api from '../../src/api';
import { SafetyMenu } from '../../src/components/Safety';
import { Text, TextInput } from '../../src/components/Text';
import { BackButton, Photo, s } from '../../src/components/ui';
import { useApp } from '../../src/store';
import { C } from '../../src/theme';
import { fmtTime } from '../../src/time';
import type { Message } from '../../src/types';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPing, uid, profile, blockedIds, hiddenIds } = useApp();
  const ping = getPing(id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [menuFor, setMenuFor] = useState<Message | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  const load = useCallback(async () => {
    try {
      setMessages(await api.fetchMessages(id));
    } catch {
      /* keep old messages on a failed poll */
    }
  }, [id]);

  // Polls every 5 s while the chat is open.
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const visible = messages.filter((m) => !hiddenIds.has(m.id) && !(m.authorId && blockedIds.has(m.authorId)));

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      await api.sendMessage({ pingId: id, uid, authorName: profile.displayName, body });
      await load();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      Alert.alert('Not sent', e.message);
      setText(body);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.row, { padding: 16, borderBottomWidth: 1, borderBottomColor: C.line }]}>
          <BackButton />
          {ping ? <Photo ping={ping} style={{ width: 40, height: 40, marginLeft: 12 }} rounded={10} /> : null}
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: C.dark }} numberOfLines={1}>
              {ping?.title ?? 'Event circle'}
            </Text>
            <Text style={{ color: C.muted, fontSize: 12 }}>{ping ? `${ping.going} going · Public circle` : 'Public circle'}</Text>
          </View>
        </View>
        <FlatList
          ref={listRef}
          data={visible}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={
            <Text style={{ color: C.muted, fontSize: 12, textAlign: 'center', marginBottom: 6 }}>
              Be kind. Long-press a message to report it or block someone.
            </Text>
          }
          ListEmptyComponent={<Text style={{ color: C.muted, textAlign: 'center', marginTop: 40 }}>Say hi and plan where to meet.</Text>}
          renderItem={({ item }) => {
            const me = item.authorId === uid;
            return (
              <Pressable
                onLongPress={() => (!me ? setMenuFor(item) : undefined)}
                delayLongPress={350}
                style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '80%' }}
              >
                {!me ? <Text style={{ fontSize: 11, color: C.muted, marginBottom: 2, fontWeight: '600' }}>{item.authorName}</Text> : null}
                <View style={{ backgroundColor: me ? C.primary : C.white, borderRadius: 16, padding: 12, borderWidth: me ? 0 : 1, borderColor: C.line }}>
                  <Text style={{ color: me ? C.white : C.dark }}>{item.body}</Text>
                </View>
                <Text style={{ fontSize: 10, color: C.muted, marginTop: 2, alignSelf: me ? 'flex-end' : 'flex-start' }}>{fmtTime(item.createdAt)}</Text>
              </Pressable>
            );
          }}
        />
        <View style={[s.row, { padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: C.line }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={`Message as ${profile.displayName}`}
            placeholderTextColor="#9AA9A6"
            style={[s.input, { flex: 1 }]}
            maxLength={500}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable onPress={send} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Send">
            <Ionicons name="send" size={18} color={C.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      {menuFor ? (
        <SafetyMenu
          visible={!!menuFor}
          onClose={() => setMenuFor(null)}
          target="message"
          id={menuFor.id}
          authorId={menuFor.authorId}
          authorName={menuFor.authorName}
        />
      ) : null}
    </SafeAreaView>
  );
}
