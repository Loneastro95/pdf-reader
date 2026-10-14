import { useRef } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SignatureScreen, { type SignatureViewRef } from "react-native-signature-canvas";

import { colors, spacing } from "@/constants/colors";

type Props = {
  onDone: (png: string) => void;
  onCancel: () => void;
};

export default function Sign({ onDone, onCancel }: Props) {
  const padRef = useRef<SignatureViewRef>(null);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onCancel} hitSlop={8}>
          <Text style={styles.ghostLabel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Sign</Text>
        <Pressable onPress={() => padRef.current?.clearSignature()} hitSlop={8}>
          <Text style={styles.ghostLabel}>Clear</Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>Draw your signature below</Text>

      <SignatureScreen
        ref={padRef}
        onOK={onDone}
        onEmpty={() => Alert.alert("Nothing to save", "Draw a signature first.")}
        webStyle={padStyle}
        backgroundColor="rgba(255,255,255,0)"
        penColor={colors.ink}
      />

      <Pressable
        style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
        onPress={() => padRef.current?.readSignature()}
      >
        <Text style={styles.saveLabel}>Save signature</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// react-native-signature-canvas ships its own "Clear"/confirm buttons
// inside the WebView's footer, but that footer can end up clipped by the
// WebView's own layout and is easy to miss. We hide it and drive
// save/clear from our own RN buttons above/below instead, via the
// SignatureViewRef methods — those work regardless of the WebView's
// internal layout.
const padStyle = `.m-signature-pad--footer { display: none; }`;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  ghostLabel: { fontSize: 15, color: colors.muted, fontWeight: "600" },
  title: { fontSize: 16, fontWeight: "600", color: colors.ink },
  hint: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 13,
    paddingVertical: spacing.sm,
  },
  saveButton: {
    margin: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
  },
  saveButtonPressed: { opacity: 0.85 },
  saveLabel: { color: colors.accentInk, fontSize: 15, fontWeight: "700" },
});
