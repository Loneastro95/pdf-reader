import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";

import { colors, spacing } from "@/constants/colors";
import PdfViewer from "@/components/PdfViewer";
import SignatureOverlay, { type Placement } from "@/components/SignatureOverlay";
import TextOverlay from "@/components/TextOverlay";
import TextPromptModal from "@/components/TextPromptModal";
import Toolbar, { type ToolbarAction } from "@/components/Toolbar";
import Sign from "./sign";
import Pages from "./pages";
import { pickPdf, readAsBase64, writeBase64Pdf } from "@/lib/files";
import { addSignature, addText, extractPages, mergePdfs } from "@/lib/pdfEdit";

const DEFAULT_PLACEMENT: Placement = { x: 0.3, y: 0.7, w: 0.35, h: 0.14 };
const DEFAULT_TEXT_PLACEMENT: Placement = { x: 0.1, y: 0.55, w: 0.5, h: 0.12 };

export default function Viewer() {
  const params = useLocalSearchParams<{ uri?: string }>();
  const [uri, setUri] = useState<string | null>(params.uri ?? null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });
  // The drawn signature is kept once saved, separate from whether it's
  // currently being dragged into place — so it can be stamped onto
  // several pages/documents without redrawing it each time.
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [placingSignature, setPlacingSignature] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [textPlacement, setTextPlacement] = useState<Placement>(DEFAULT_TEXT_PLACEMENT);
  const [addingText, setAddingText] = useState(false);
  const [managingPages, setManagingPages] = useState(false);
  const [saving, setSaving] = useState(false);

  const openPdf = async () => {
    try {
      const picked = await pickPdf();
      if (picked) {
        // A genuinely new document: start over from page 1. The saved
        // signature itself is a reusable personal asset, so it survives
        // across documents — only the in-progress placement resets.
        setUri(picked);
        setPage(1);
        setPageCount(0);
        setPlacingSignature(false);
        setPlacement(DEFAULT_PLACEMENT);
        setPendingText(null);
        setTextPlacement(DEFAULT_TEXT_PLACEMENT);
      }
    } catch (err) {
      Alert.alert("Couldn't open that file", messageOf(err));
    }
  };

  const applySignature = async () => {
    if (!uri || !savedSignature) return;
    setSaving(true);
    try {
      const b64 = await readAsBase64(uri);
      const out = await addSignature(b64, page - 1, savedSignature, placement);
      const newUri = await writeBase64Pdf(`signed-${Date.now()}.pdf`, out);
      // Same document, same page — just reload the edited file and
      // briefly show the loading state while it re-renders. The signature
      // itself stays saved so it can be placed again elsewhere.
      setUri(newUri);
      setPageCount(0);
      setPlacingSignature(false);
    } catch (err) {
      Alert.alert("Couldn't place the signature", messageOf(err));
    } finally {
      setSaving(false);
    }
  };

  const applyText = async () => {
    if (!uri || !pendingText) return;
    setSaving(true);
    try {
      const b64 = await readAsBase64(uri);
      const out = await addText(b64, page - 1, pendingText, textPlacement);
      const newUri = await writeBase64Pdf(`edited-${Date.now()}.pdf`, out);
      setUri(newUri);
      setPageCount(0);
      setPendingText(null);
    } catch (err) {
      Alert.alert("Couldn't place the text", messageOf(err));
    } finally {
      setSaving(false);
    }
  };

  // Both "remove pages" and "extract pages" boil down to the same pdf-lib
  // call (copy a chosen set of page indices into a document) — they only
  // differ in which file ends up holding the result.
  const removePages = async (keep: number[]) => {
    if (!uri) return;
    setSaving(true);
    try {
      const b64 = await readAsBase64(uri);
      const out = await extractPages(b64, keep);
      const newUri = await writeBase64Pdf(`pages-${Date.now()}.pdf`, out);
      // This document's own page count changed, so start over at page 1
      // rather than risk pointing past the new end of the document.
      setUri(newUri);
      setPage(1);
      setPageCount(0);
      setManagingPages(false);
    } catch (err) {
      Alert.alert("Couldn't remove those pages", messageOf(err));
    } finally {
      setSaving(false);
    }
  };

  const extractToNewFile = async (indices: number[]) => {
    if (!uri) return;
    setSaving(true);
    try {
      const b64 = await readAsBase64(uri);
      const out = await extractPages(b64, indices);
      const newUri = await writeBase64Pdf(`split-${Date.now()}.pdf`, out);
      // The current document is untouched — this is a separate file, so
      // offer to share/save it immediately rather than silently writing
      // it to disk with nothing to show for it.
      setManagingPages(false);
      Alert.alert(
        "Pages extracted",
        `Saved ${indices.length} page${indices.length === 1 ? "" : "s"} to a new file. Share it now?`,
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Share",
            onPress: async () => {
              if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(newUri);
            },
          },
        ],
      );
    } catch (err) {
      Alert.alert("Couldn't extract those pages", messageOf(err));
    } finally {
      setSaving(false);
    }
  };

  const mergeWithAnother = async () => {
    if (!uri) return;
    try {
      const otherUri = await pickPdf();
      if (!otherUri) return;
      setSaving(true);
      const a = await readAsBase64(uri);
      const b = await readAsBase64(otherUri);
      const out = await mergePdfs(a, b);
      const newUri = await writeBase64Pdf(`merged-${Date.now()}.pdf`, out);
      setUri(newUri);
      setPage(1);
      setPageCount(0);
      setManagingPages(false);
    } catch (err) {
      Alert.alert("Couldn't merge that PDF in", messageOf(err));
    } finally {
      setSaving(false);
    }
  };

  const share = async () => {
    if (!uri) return;
    try {
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
      else Alert.alert("Sharing isn't available on this device.");
    } catch (err) {
      Alert.alert("Couldn't share this file", messageOf(err));
    }
  };

  if (drawing) {
    return (
      <Sign
        onDone={(png) => {
          setSavedSignature(png);
          setPlacingSignature(true);
          setDrawing(false);
        }}
        onCancel={() => setDrawing(false)}
      />
    );
  }

  if (!uri) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No document open yet.</Text>
          <Pressable style={styles.openButton} onPress={openPdf}>
            <Text style={styles.openButtonLabel}>Choose a PDF</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (managingPages) {
    return (
      <Pages
        pageCount={pageCount}
        busy={saving}
        onRemove={removePages}
        onExtract={extractToNewFile}
        onMerge={mergeWithAnother}
        onCancel={() => setManagingPages(false)}
      />
    );
  }

  const actions: ToolbarAction[] = [
    { key: "prev", label: "Prev", icon: "‹", variant: "nav", disabled: page <= 1, onPress: () => setPage((p) => Math.max(1, p - 1)) },
    { key: "next", label: "Next", icon: "›", variant: "nav", disabled: page >= pageCount, onPress: () => setPage((p) => Math.min(pageCount, p + 1)) },
    { key: "pages", label: "Pages", variant: "ghost", disabled: !pageCount, onPress: () => setManagingPages(true) },
    { key: "share", label: "Share", variant: "ghost", onPress: share },
    { key: "open", label: "Open another", variant: "ghost", onPress: openPdf },
  ];

  // A saved signature sticks around after being placed, so once there is
  // one, offer a quick way to redraw/replace it without losing the
  // "tap to place it again" shortcut below.
  if (savedSignature) {
    actions.push({ key: "redraw-sig", label: "New signature", variant: "ghost", onPress: () => setDrawing(true) });
  }

  // Only one overlay (signature or text) can be pending at a time, to
  // keep the toolbar and the page uncluttered.
  if (placingSignature) {
    actions.push(
      { key: "place-sig", label: saving ? "Placing…" : "Place signature", variant: "primary", disabled: saving, onPress: applySignature },
      { key: "cancel-sig", label: "Cancel", variant: "outline", disabled: saving, onPress: () => setPlacingSignature(false) },
    );
  } else if (pendingText) {
    actions.push(
      { key: "place-text", label: saving ? "Placing…" : "Place text", variant: "primary", disabled: saving, onPress: applyText },
      { key: "cancel-text", label: "Cancel", variant: "outline", disabled: saving, onPress: () => setPendingText(null) },
    );
  } else if (savedSignature) {
    // Already have a signature saved — tapping it starts placement again
    // directly, no redrawing needed.
    actions.push(
      { key: "place-sig", label: "Place signature", variant: "primary", onPress: () => setPlacingSignature(true) },
      { key: "text", label: "Add text", variant: "outline", onPress: () => setAddingText(true) },
    );
  } else {
    actions.push(
      { key: "sign", label: "Sign", variant: "primary", onPress: () => setDrawing(true) },
      { key: "text", label: "Add text", variant: "outline", onPress: () => setAddingText(true) },
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.pageIndicator}>
          {pageCount ? `Page ${page} of ${pageCount}` : "Loading…"}
        </Text>
      </View>

      <View
        style={styles.pageArea}
        onLayout={(e) =>
          setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
        }
      >
        <PdfViewer
          uri={uri}
          page={page}
          onLoaded={(n) => setPageCount(n)}
          onPageChanged={setPage}
        />
        {!pageCount && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}
        {placingSignature && savedSignature && box.w > 0 && (
          <SignatureOverlay
            png={savedSignature}
            containerW={box.w}
            containerH={box.h}
            onChange={setPlacement}
          />
        )}
        {pendingText && box.w > 0 && (
          <TextOverlay
            text={pendingText}
            containerW={box.w}
            containerH={box.h}
            onChange={setTextPlacement}
          />
        )}
      </View>

      <Toolbar actions={actions} />

      <TextPromptModal
        visible={addingText}
        onCancel={() => setAddingText(false)}
        onSubmit={(text) => {
          setPendingText(text);
          setAddingText(false);
        }}
      />
    </SafeAreaView>
  );
}

function messageOf(err: unknown) {
  return err instanceof Error ? err.message : "Please try again.";
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pageIndicator: { fontSize: 14, fontWeight: "600", color: colors.ink },
  pageArea: { flex: 1, backgroundColor: colors.surface },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  emptyText: { fontSize: 15, color: colors.muted },
  openButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  openButtonLabel: { color: colors.accentInk, fontSize: 15, fontWeight: "600" },
});
