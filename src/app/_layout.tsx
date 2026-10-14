import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";

// expo-router's native stack uses react-native-gesture-handler internally
// for the swipe-back gesture, so the whole app still needs to be wrapped
// in GestureHandlerRootView even though our own screens now drag/resize
// overlays with plain PanResponder instead (see DraggableBox.tsx).
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.paper },
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
