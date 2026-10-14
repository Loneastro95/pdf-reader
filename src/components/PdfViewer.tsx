import React from 'react';
import { View, StyleSheet } from 'react-native';
import Pdf from 'react-native-pdf';

type Props = {
  uri: string;
  page: number;
  onLoaded: (pages: number, size: { width: number; height: number }) => void;
  onPageChanged: (page: number) => void;
};

export default function PdfViewer({ uri, page, onLoaded, onPageChanged }: Props) {
  return (
    <View style={styles.container}>
      <Pdf
        source={{ uri, cache: true }}
        page={page}
        // `singlePage` is misleadingly named: it permanently locks
        // rendering to page index 0 (react-native-pdf's own docs call it
        // "only show first page, useful for thumbnail views") and ignores
        // the `page` prop entirely. `enablePaging` is the prop that shows
        // one page on screen at a time while still responding to `page`
        // and reporting `onPageChanged`.
        enablePaging
        trustAllCerts={false}
        onLoadComplete={(numPages, _path, size) => onLoaded(numPages, size)}
        onPageChanged={(p) => onPageChanged(p)}
        style={styles.pdf}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pdf: { flex: 1, backgroundColor: '#eee' },
});