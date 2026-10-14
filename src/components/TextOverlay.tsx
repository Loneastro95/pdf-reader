import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import type { Placement } from '@/lib/coords';
import { placementToBox } from '@/lib/overlayMath';
import DraggableBox from './DraggableBox';

type Props = {
  text: string;
  containerW: number;
  containerH: number;
  onChange: (p: Placement) => void;
};

const DEFAULT_PLACEMENT: Placement = { x: 0.1, y: 0.55, w: 0.5, h: 0.12 };

export default function TextOverlay({ text, containerW, containerH, onChange }: Props) {
  return (
    <DraggableBox
      containerW={containerW}
      containerH={containerH}
      initialBox={placementToBox(DEFAULT_PLACEMENT, containerW, containerH)}
      onChange={onChange}
    >
      {(box) => (
        <View style={styles.box}>
          <Text style={[styles.text, { fontSize: Math.max(10, box.h * 0.6) }]} numberOfLines={1}>
            {text}
          </Text>
        </View>
      )}
    </DraggableBox>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  text: { color: colors.ink, fontWeight: '600' },
});
