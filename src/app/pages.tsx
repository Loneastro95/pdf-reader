import { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "@/constants/colors";
import { indicesExcluding, sortedIndices } from "@/lib/pages";
import Toolbar, { type ToolbarAction } from "@/components/Toolbar";

type Props = {
  pageCount: number;
  busy: boolean;
  onRemove: (keep: number[]) => void;
  onExtract: (indices: number[]) => void;
  onMerge: () => void;
  onCancel: () => void;
};

export default function Pages({ pageCount, busy, onRemove, onExtract, onMerge, onCancel }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const remove = () => {
    if (selected.size === 0) return;
    if (selected.size === pageCount) {
      Alert.alert("Can't remove every page", "A document needs at least one page left.");
      return;
    }
    Alert.alert(
      `Remove ${selected.size} page${selected.size === 1 ? "" : "s"}?`,
      "This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => onRemove(indicesExcluding(pageCount, selected)),
        },
      ],
    );
  };

  const extract = () => {
    if (selected.size === 0) return;
    onExtract(sortedIndices(selected));
  };

  const actions: ToolbarAction[] = [
    { key: "merge", label: "Merge another PDF…", variant: "ghost", disabled: busy, onPress: onMerge },
    {
      key: "remove",
      label: busy ? "Working…" : `Remove${selected.size ? ` (${selected.size})` : ""}`,
      variant: "primary",
      disabled: busy || selected.size === 0,
      onPress: remove,
    },
    {
      key: "extract",
      label: `Extract${selected.size ? ` (${selected.size})` : ""} to new file`,
      variant: "outline",
      disabled: busy || selected.size === 0,
      onPress: extract,
    },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onCancel} hitSlop={8}>
          <Text style={styles.ghostLabel}>Done</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>Pages</Text>
          <Text style={styles.subtitle}>
            {selected.size === 0
              ? `${pageCount} page${pageCount === 1 ? "" : "s"}`
              : `${selected.size} selected`}
          </Text>
        </View>
        <View style={styles.spacer} />
      </View>

      <FlatList
        data={Array.from({ length: pageCount }, (_, i) => i)}
        keyExtractor={(i) => String(i)}
        renderItem={({ item: index }) => {
          const isSelected = selected.has(index);
          return (
            <Pressable
              style={[styles.row, isSelected && styles.rowSelected]}
              onPress={() => toggle(index)}
            >
              <Text style={styles.rowLabel}>Page {index + 1}</Text>
              <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </Pressable>
          );
        }}
      />

      <Text style={styles.hint}>
        Select pages, then remove them from this document or extract them into
        a brand-new file — the original stays untouched either way.
      </Text>

      <Toolbar actions={actions} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
  },
  ghostLabel: { fontSize: 15, color: colors.muted, fontWeight: "600" },
  title: { fontSize: 16, fontWeight: "600", color: colors.ink, textAlign: "center" },
  subtitle: { fontSize: 12, color: colors.muted, textAlign: "center" },
  spacer: { width: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
  },
  rowSelected: { backgroundColor: colors.paper },
  rowLabel: { fontSize: 15, color: colors.ink },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: colors.accentInk, fontSize: 14, fontWeight: "700" },
  hint: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
