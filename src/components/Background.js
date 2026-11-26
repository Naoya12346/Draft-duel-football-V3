import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/** Ambient stadium background shared by every screen. */
export default function Background() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#0b1e4d', '#050b1f', '#020617']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orbBlue]} />
      <View style={[styles.orb, styles.orbPurple]} />
      <View style={styles.beamWrap}>
        <LinearGradient
          colors={['rgba(250,204,21,0.20)', 'rgba(250,204,21,0)']}
          style={[styles.beam, { left: '6%', transform: [{ rotate: '-16deg' }] }]}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
          style={[styles.beam, { left: '46%' }]}
        />
        <LinearGradient
          colors={['rgba(96,165,250,0.20)', 'rgba(96,165,250,0)']}
          style={[styles.beam, { right: '6%', transform: [{ rotate: '16deg' }] }]}
        />
      </View>
      <LinearGradient
        colors={['rgba(16,185,129,0)', 'rgba(16,185,129,0.10)']}
        style={styles.floor}
      />
      <View style={styles.floorLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbBlue: {
    width: 260,
    height: 260,
    left: -90,
    top: 80,
    backgroundColor: 'rgba(29,78,216,0.22)',
  },
  orbPurple: {
    width: 220,
    height: 220,
    right: -80,
    top: 320,
    backgroundColor: 'rgba(168,85,247,0.16)',
  },
  beamWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  beam: {
    position: 'absolute',
    top: -60,
    width: 150,
    height: '70%',
    borderRadius: 80,
    opacity: 0.9,
  },
  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
  },
  floorLine: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    bottom: 140,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
