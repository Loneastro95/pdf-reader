import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, spacing } from '@/constants/colors';

type Props = {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (text: string) => void;
};

export default function TextPromptModal({ visible, onCancel, onSubmit }: Props) {
  const [value, setValue] = useState('');

  // Clear the draft on the way out (cancel or submit) rather than in an
  // effect keyed on `visible`, so there's no cascading render from
  // setState-in-effect and no stale draft the next time this opens.
  const cancel = () => {
    setValue('');
    onCancel();
  };

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setValue('');
    onSubmit(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Add text</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Type what to add…"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoFocus
            multiline
          />
          <View style={styles.row}>
            <Pressable onPress={cancel} hitSlop={8} style={styles.cancelBtn}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={!value.trim()}
              style={[styles.addBtn, !value.trim() && styles.addBtnDisabled]}
            >
              <Text style={styles.addLabel}>Add</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,36,48,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg },
  title: { fontSize: 16, fontWeight: '600', color: colors.ink, marginBottom: spacing.sm },
  input: {
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 15,
    color: colors.ink,
  },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  cancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  cancelLabel: { color: colors.muted, fontSize: 15 },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  addBtnDisabled: { opacity: 0.5 },
  addLabel: { color: colors.accentInk, fontSize: 15, fontWeight: '600' },
});
