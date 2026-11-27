import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useApp } from '../store';
import type { ReportReason, ReportTarget } from '../types';
import { ActionSheet } from './ui';

const REASONS: { reason: ReportReason; label: string }[] = [
  { reason: 'fake', label: 'Fake or misleading' },
  { reason: 'spam', label: 'Spam or ads' },
  { reason: 'inappropriate', label: 'Inappropriate or offensive' },
  { reason: 'unsafe', label: 'Unsafe or dangerous' },
  { reason: 'other', label: 'Something else' },
];

const NOUN: Record<ReportTarget, string> = { ping: 'ping', review: 'review', message: 'message' };

/**
 * "⋯" menu for anything people post: report it (hidden for you right away, for everyone after
 * 3 reports) or block the person who posted it.
 */
export function SafetyMenu({
  visible,
  onClose,
  target,
  id,
  authorId,
  authorName,
  onDone,
}: {
  visible: boolean;
  onClose: () => void;
  target: ReportTarget;
  id: string;
  authorId: string | null;
  authorName: string;
  onDone?: () => void;
}) {
  const { uid, reportContent, blockUser } = useApp();
  const [step, setStep] = useState<'menu' | 'reason'>('menu');
  const close = () => {
    setStep('menu');
    onClose();
  };

  const doReport = async (reason: ReportReason) => {
    try {
      await reportContent(target, id, reason);
      Alert.alert('Thanks for telling us', `We’ve hidden this ${NOUN[target]} for you. If 3 people report it, it’s hidden for everyone.`);
      onDone?.();
    } catch (e: any) {
      Alert.alert('Couldn’t send report', e?.message ?? 'Try again.');
    }
  };

  const doBlock = () =>
    Alert.alert(`Block ${authorName}?`, 'You won’t see their pings, reviews or messages anymore. You can undo this in your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await blockUser(authorId!);
            onDone?.();
          } catch (e: any) {
            Alert.alert('Couldn’t block', e?.message ?? 'Try again.');
          }
        },
      },
    ]);

  const canBlock = !!authorId && authorId !== uid;

  if (step === 'reason') {
    return (
      <ActionSheet
        visible={visible}
        title={`Why are you reporting this ${NOUN[target]}?`}
        options={REASONS.map((r) => ({ label: r.label, onPress: () => doReport(r.reason) }))}
        onClose={close}
      />
    );
  }
  return (
    <ActionSheet
      visible={visible}
      title={`This ${NOUN[target]}`}
      options={[
        { label: `Report ${NOUN[target]}`, icon: 'flag-outline', keepOpen: true, onPress: () => setStep('reason') },
        ...(canBlock ? [{ label: `Block ${authorName}`, icon: 'hand-left-outline', destructive: true, onPress: doBlock }] : []),
      ]}
      onClose={close}
    />
  );
}
