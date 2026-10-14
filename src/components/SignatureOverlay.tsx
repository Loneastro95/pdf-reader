import { Image, StyleSheet } from 'react-native';

import type { Placement } from '@/lib/coords';
import { placementToBox } from '@/lib/overlayMath';
import DraggableBox from './DraggableBox';

export type { Placement };

type Props = {
  png: string;
  containerW: number;
  containerH: number;
  onChange: (p: Placement) => void;
};

const DEFAULT_PLACEMENT: Placement = { x: 0.3, y: 0.7, w: 0.35, h: 0.14 };

export default function SignatureOverlay({ png, containerW, containerH, onChange }: Props) {
  return (
    <DraggableBox
      containerW={containerW}
      containerH={containerH}
      initialBox={placementToBox(DEFAULT_PLACEMENT, containerW, containerH)}
      onChange={onChange}
    >
      {() => <Image source={{ uri: png }} style={styles.img} resizeMode="contain" />}
    </DraggableBox>
  );
}

const styles = StyleSheet.create({ img: { width: '100%', height: '100%' } });
