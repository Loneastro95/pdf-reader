import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/colors';
import type { Placement } from '@/lib/coords';
import { boxToPlacement, movedBox, resizedBox, type Box } from '@/lib/overlayMath';

type Props = {
  containerW: number;
  containerH: number;
  initialBox: Box;
  onChange: (p: Placement) => void;
  children: (box: Box) => ReactNode;
};

// Drags and resizes a box with plain React state + React Native's core
// PanResponder — deliberately NOT react-native-gesture-handler/reanimated.
// Those need the New Architecture (react-native-reanimated 4 only supports
// it) and a correctly rebuilt dev client; PanResponder has no such
// requirement and no native module to get out of sync, so it can't be the
// reason an overlay fails to respond.
export default function DraggableBox({ containerW, containerH, initialBox, onChange, children }: Props) {
  const [box, setBox] = useState<Box>(initialBox);

  // Refs, not state, for anything read inside a PanResponder callback —
  // those callbacks fire later, from the touch system, so they'd otherwise
  // close over whatever `box`/props looked like on the render that created
  // them. Values are only ever written to these refs from an effect or an
  // event handler, never during render (React Compiler — app.json's
  // reactCompiler experiment — enforces this).
  const boxRef = useRef(box);
  const startRef = useRef(box);
  const latestRef = useRef({ containerW, containerH, onChange });

  useEffect(() => {
    latestRef.current = { containerW, containerH, onChange };
  }, [containerW, containerH, onChange]);

  const update = (next: Box) => {
    boxRef.current = next;
    setBox(next);
  };

  const commit = () => {
    const { containerW, containerH, onChange } = latestRef.current;
    onChange(boxToPlacement(boxRef.current, containerW, containerH));
  };

  // PanResponder (not react-native-gesture-handler) needs no native module
  // and reads/writes only refs inside its handlers, so `useMemo` with an
  // empty dep array — create once, reuse forever — is safe here.
  //
  // react-hooks/refs flags this: it can't see that PanResponder only ever
  // *calls* these closures later, as touch event handlers, never during
  // this render — the exact "event handler" case the rule's own docs
  // carve out, just not one it can verify through an external API.
  const movePan = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startRef.current = boxRef.current;
        },
        onPanResponderMove: (_evt, gesture) => {
          update(movedBox(startRef.current, gesture.dx, gesture.dy));
        },
        onPanResponderRelease: commit,
        onPanResponderTerminate: commit,
      }),
    [],
  );

  // Same deferred-callback case as movePan above.
  const resizePan = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startRef.current = boxRef.current;
        },
        onPanResponderMove: (_evt, gesture) => {
          update(resizedBox(startRef.current, gesture.dx, gesture.dy));
        },
        onPanResponderRelease: commit,
        onPanResponderTerminate: commit,
      }),
    [],
  );

  return (
    <View
      style={[styles.box, { left: box.x, top: box.y, width: box.w, height: box.h }]}
      {...movePan.panHandlers}
    >
      {children(box)}
      <View style={styles.handle} {...resizePan.panHandlers}>
        <View style={styles.handleGlyph} />
      </View>
    </View>
  );
}

const HANDLE_SIZE = 28;

const styles = StyleSheet.create({
  box: { position: 'absolute' },
  // The visible glyph is smaller than the touch target (HANDLE_SIZE),
  // which is centered on the box's corner so it's easy to grab without
  // looking oversized.
  handle: {
    position: 'absolute',
    right: -HANDLE_SIZE / 2,
    bottom: -HANDLE_SIZE / 2,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleGlyph: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
