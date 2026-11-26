import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { C, F } from '../theme';

/** Centered glass modal used for stats, slot pickers and confirmations. */
export default function AppModal({ visible, onClose, title, children, footer, sheet = false }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.overlay, sheet && styles.overlayBottom]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          entering={ZoomIn.duration(200)}
          style={[styles.card, sheet && styles.sheet]}
        >
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {children}
          {footer}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.86)',
    justifyContent: 'center',
    padding: 16,
  },
  overlayBottom: { justifyContent: 'flex-end', padding: 0 },
  card: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: 'rgba(15,23,42,0.98)',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 18,
  },
  sheet: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 30,
    maxWidth: '100%',
  },
  title: {
    fontFamily: F.italicExtra,
    fontSize: 26,
    color: C.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.6,
  },
});
