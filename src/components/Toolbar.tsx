import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/constants/colors";

export type ToolbarAction = {
  key: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /**
   * nav     — small paired icon button (Prev/Next)
   * primary — the one dominant call to action for the current context
   * outline — a secondary action paired next to `primary` (e.g. Cancel)
   * ghost   — a low-emphasis, always-available utility (Share, Open…)
   */
  variant?: "nav" | "primary" | "outline" | "ghost";
  icon?: string;
};

type Props = {
  actions: ToolbarAction[];
};

// Two rows, grouped by what the action IS rather than one flat shelf of
// identical pills: page navigation and persistent utilities up top (they
// don't change meaning), the current context's main action(s) below,
// visually dominant since that's the thing most worth tapping right now.
export default function Toolbar({ actions }: Props) {
  const nav = actions.filter((a) => a.variant === "nav");
  const ghost = actions.filter((a) => !a.variant || a.variant === "ghost");
  const primary = actions.filter((a) => a.variant === "primary" || a.variant === "outline");

  return (
    <View style={styles.bar}>
      <View style={styles.topRow}>
        {nav.length > 0 && (
          <View style={styles.navGroup}>
            {nav.map((action, i) => (
              <View key={action.key} style={styles.navItem}>
                {i > 0 && <View style={styles.navDivider} />}
                <Pressable
                  onPress={action.onPress}
                  disabled={action.disabled}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.navButton,
                    action.disabled && styles.disabled,
                    pressed && !action.disabled && styles.navButtonPressed,
                  ]}
                >
                  <Text style={styles.navGlyph}>{action.icon ?? action.label}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Its own flexWrap, not the row's — so on a narrow phone these
            labels wrap onto a second line within their own corner instead
            of colliding with or squeezing out the nav buttons. */}
        <View style={styles.ghostGroup}>
          {ghost.map((action) => (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              disabled={action.disabled}
              hitSlop={4}
              style={({ pressed }) => [
                styles.ghostButton,
                pressed && !action.disabled && styles.ghostButtonPressed,
              ]}
            >
              <Text style={[styles.ghostLabel, action.disabled && styles.disabled]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {primary.length > 0 && (
        <View style={styles.primaryRow}>
          {primary.map((action) => (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              disabled={action.disabled}
              style={({ pressed }) => [
                action.variant === "outline" ? styles.outlineButton : styles.primaryButton,
                action.disabled && styles.disabled,
                pressed && !action.disabled && styles.pressed,
              ]}
            >
              <Text style={action.variant === "outline" ? styles.outlineLabel : styles.primaryLabel}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
    // A toolbar pinned to the bottom reads as a distinct, floating control
    // surface when it casts a soft shadow upward onto the content behind
    // it, rather than just a hairline border.
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 12 },
    }),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  navGroup: {
    flexDirection: "row",
    backgroundColor: colors.paper,
    borderRadius: 10,
    padding: 2,
  },
  navItem: { flexDirection: "row", alignItems: "center" },
  navDivider: { width: 1, height: 20, backgroundColor: colors.line },
  navButton: {
    width: 40,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  navButtonPressed: { backgroundColor: colors.surface },
  navGlyph: { fontSize: 18, fontWeight: "700", color: colors.ink },
  ghostGroup: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    marginLeft: spacing.sm,
  },
  ghostButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  ghostButtonPressed: { backgroundColor: colors.paper },
  ghostLabel: { fontSize: 13, fontWeight: "600", color: colors.muted },
  primaryRow: { flexDirection: "row", gap: spacing.sm },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
  },
  primaryLabel: { color: colors.accentInk, fontSize: 15, fontWeight: "700" },
  outlineButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  outlineLabel: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.75 },
});
