import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { colors, spacing } from "@/constants/colors";
import { pickPdf } from "@/lib/files";

export default function Home() {
  const [opening, setOpening] = useState(false);

  const openPdf = async () => {
    setOpening(true);
    try {
      const uri = await pickPdf();
      if (uri) router.push({ pathname: "/viewer", params: { uri } });
    } catch (err) {
      Alert.alert(
        "Couldn't open that file",
        err instanceof Error ? err.message : "Try picking the PDF again."
      );
    } finally {
      setOpening(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <DocumentMark />
        <Text style={styles.headline}>Open a document.</Text>
        <Text style={styles.subhead}>
          Read a PDF, mark it up, and sign it with a drawn signature — right
          on your phone.
        </Text>
      </View>

      <Pressable
        onPress={openPdf}
        disabled={opening}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          opening && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.buttonLabel}>
          {opening ? "Opening…" : "Choose a PDF"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

// A small bespoke glyph: a page with a folded corner and a torn
// signature ribbon, built from plain Views so no icon/SVG library
// is needed.
function DocumentMark() {
  return (
    <View style={markStyles.wrap}>
      <View style={markStyles.page}>
        <View style={markStyles.lineLong} />
        <View style={markStyles.lineShort} />
        <View style={markStyles.ribbon} />
      </View>
      <View style={markStyles.fold} />
    </View>
  );
}

const markStyles = StyleSheet.create({
  wrap: { width: 84, height: 104, marginBottom: spacing.lg },
  page: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.sm,
    justifyContent: "flex-end",
  },
  lineLong: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: spacing.sm,
  },
  lineShort: {
    height: 3,
    width: "60%",
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: spacing.md,
  },
  ribbon: {
    height: 10,
    borderRadius: 2,
    backgroundColor: colors.accent,
    transform: [{ rotate: "-4deg" }],
  },
  fold: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    backgroundColor: colors.paper,
    borderBottomLeftRadius: 4,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  headline: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  subhead: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    maxWidth: 320,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  buttonPressed: { opacity: 0.85 },
  buttonDisabled: { opacity: 0.6 },
  buttonLabel: {
    color: colors.accentInk,
    fontSize: 16,
    fontWeight: "600",
  },
});
