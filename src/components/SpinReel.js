import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { C, F } from '../theme';

const ROWS = 24;

function Column({ y, rows, height, kind }) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View style={[styles.reelWindow, { height }]}>
      <Animated.View style={style}>
        {rows.map((row, i) => {
          const isLast = i === rows.length - 1;
          return (
            <View key={`${kind}-${i}`} style={[styles.reelRow, { height }]}>
              <Text
                numberOfLines={1}
                style={[
                  kind === 'team' ? styles.teamText : styles.yearText,
                  isLast && styles.finalText,
                ]}
              >
                {kind === 'team' ? row.n : row.y}
              </Text>
            </View>
          );
        })}
      </Animated.View>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(11,18,36,0.95)', 'rgba(11,18,36,0)']}
        style={[styles.fade, { top: 0 }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(11,18,36,0)', 'rgba(11,18,36,0.95)']}
        style={[styles.fade, { bottom: 0 }]}
      />
    </View>
  );
}

/**
 * Vertical slot-machine reel for TEAM + ERA.
 * Flags/crests are intentionally omitted — text only.
 */
export default function SpinReel({
  spinKey = 0,
  finalTeam,
  pool = [],
  onFinish,
  height = 78,
  duration = 3000,
}) {
  const y = useSharedValue(0);
  const rows = useMemo(() => {
    if (!finalTeam) return [];
    const list = [];
    for (let i = 0; i < ROWS; i += 1) {
      list.push(pool.length ? pool[Math.floor(Math.random() * pool.length)] : finalTeam);
    }
    list.push(finalTeam);
    return list;
  }, [spinKey, finalTeam, pool]);

  useEffect(() => {
    if (!finalTeam) return;
    if (!spinKey) {
      // Static final state (e.g. returning to the screen).
      y.value = -(ROWS * height);
      return;
    }
    y.value = 0;
    y.value = withTiming(
      -(ROWS * height),
      { duration, easing: Easing.bezier(0.12, 0.72, 0.16, 1) },
      (finished) => {
        if (finished && onFinish) runOnJS(onFinish)();
      },
    );
  }, [spinKey]);

  if (!finalTeam) {
    return (
      <View style={styles.emptyWrap}>
        <View style={[styles.emptyBox, { height }]}>
          <Text style={styles.emptyText}>?</Text>
        </View>
        <View style={[styles.emptyBox, { height }]}>
          <Text style={styles.emptyText}>?</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.column}>
        <Text style={styles.colLabel}>TEAM</Text>
        <View style={styles.reelShell}>
          <Column y={y} rows={rows} height={height} kind="team" />
        </View>
      </View>
      <View style={styles.column}>
        <Text style={styles.colLabel}>ERA</Text>
        <View style={styles.reelShell}>
          <Column y={y} rows={rows} height={height} kind="year" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  colLabel: {
    fontFamily: F.extra,
    fontSize: 12,
    letterSpacing: 3,
    color: C.muted,
    marginBottom: 5,
    textAlign: 'center',
  },
  reelShell: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(250,204,21,0.35)',
    backgroundColor: '#0b1224',
    overflow: 'hidden',
    shadowColor: '#facc15',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  reelWindow: { overflow: 'hidden' },
  reelRow: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  teamText: {
    fontFamily: F.italicExtra,
    fontSize: 25,
    color: '#e2e8f0',
    textAlign: 'center',
  },
  yearText: {
    fontFamily: F.italicExtra,
    fontSize: 30,
    color: '#bfdbfe',
    textAlign: 'center',
    letterSpacing: 1,
  },
  finalText: { color: C.gold },
  fade: { position: 'absolute', left: 0, right: 0, height: 18 },
  emptyWrap: { flexDirection: 'row', gap: 10 },
  emptyBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(71,85,105,0.6)',
    backgroundColor: 'rgba(15,23,42,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontFamily: F.extra, fontSize: 26, color: 'rgba(148,163,184,0.6)' },
});
