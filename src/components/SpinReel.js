import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { C, F } from '../theme';
import { MOTION } from '../theme/motion';
import { useMotion } from '../context/MotionContext';

const ROWS = 20;

function Column({ y, rows, height, kind }) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View style={[styles.reelWindow, { height }]}>
      <Animated.View style={style}>
        {rows.map((row, i) => {
          const isLast = i === rows.length - 1;
          return (
            <View key={`${kind}-${i}-${row.n}-${row.y}`} style={[styles.reelRow, { height }]}>
              <Text
                numberOfLines={1}
                style={[kind === 'team' ? styles.teamText : styles.yearText, isLast && styles.finalText]}
              >
                {kind === 'team' ? row.n : row.y}
              </Text>
            </View>
          );
        })}
      </Animated.View>
      <LinearGradient pointerEvents="none" colors={['rgba(11,18,36,0.95)', 'rgba(11,18,36,0)']} style={[styles.fade, { top: 0 }]} />
      <LinearGradient pointerEvents="none" colors={['rgba(11,18,36,0)', 'rgba(11,18,36,0.95)']} style={[styles.fade, { bottom: 0 }]} />
    </View>
  );
}

/** Vertical slot-machine reel for TEAM + ERA, text only (no flags/crests). */
export default function SpinReel({ spinKey = 0, finalTeam, pool = [], onFinish, height = 78 }) {
  const { enabled } = useMotion();
  const yTeam = useSharedValue(0);
  const yEra = useSharedValue(0);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const doneRef = useRef({ team: false, era: false });

  const rows = useMemo(() => {
    if (!finalTeam) return [];
    const list = [];
    for (let i = 0; i < ROWS; i += 1) {
      list.push(pool.length ? pool[(Math.floor(Math.random() * pool.length) + spinKey) % pool.length] : finalTeam);
    }
    list.push(finalTeam);
    return list;
  }, [spinKey, finalTeam, pool]);

  useEffect(() => {
    if (!finalTeam) return;
    const target = -(ROWS * height);
    if (!spinKey || !enabled) {
      yTeam.value = target;
      yEra.value = target;
      return;
    }
    yTeam.value = 0;
    yEra.value = 0;
    doneRef.current = { team: false, era: false };
    const easing = Easing.bezier(...MOTION.easing.emphasized);
    const settle = (key) => (finished) => {
      if (!finished) return;
      doneRef.current[key] = true;
      if (doneRef.current.team && doneRef.current.era && finishRef.current) {
        runOnJS(finishRef.current)();
      }
    };

    const teamStop = MOTION.duration.reel - 180;
    const eraStop = MOTION.duration.reel + 160;
    yTeam.value = withSequence(
      withTiming(target - 8, { duration: teamStop, easing }),
      withTiming(target + 3, { duration: MOTION.duration.small, easing: Easing.bezier(...MOTION.easing.overshoot) }),
      withTiming(target, { duration: MOTION.duration.micro, easing: Easing.linear }),
    );
    yEra.value = withSequence(
      withTiming(target - 8, { duration: eraStop, easing }),
      withTiming(target + 3, { duration: MOTION.duration.small, easing: Easing.bezier(...MOTION.easing.overshoot) }),
      withTiming(target, { duration: MOTION.duration.micro, easing: Easing.linear }),
    );
    // Completion is signalled by the last animated frame of each reel.
    const t1 = setTimeout(() => settle('team')(true), teamStop + MOTION.duration.small + MOTION.duration.micro);
    const t2 = setTimeout(() => settle('era')(true), eraStop + MOTION.duration.small + MOTION.duration.micro);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [spinKey, finalTeam, height, enabled, yTeam, yEra]);

  if (!finalTeam) {
    return (
      <View style={styles.wrap}>
        {[0, 1].map((i) => (
          <View key={i} style={[styles.emptyBox, { height }]}>
            <Text style={styles.emptyText}>?</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.column}>
        <Text style={styles.colLabel}>TEAM</Text>
        <View style={styles.reelShell}>
          <Column y={yTeam} rows={rows} height={height} kind="team" />
        </View>
      </View>
      <View style={styles.column}>
        <Text style={styles.colLabel}>ERA</Text>
        <View style={styles.reelShell}>
          <Column y={yEra} rows={rows} height={height} kind="year" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  colLabel: { fontFamily: F.extra, fontSize: 12, letterSpacing: 3, color: C.muted, marginBottom: 5, textAlign: 'center' },
  reelShell: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(250,204,21,0.35)',
    backgroundColor: '#0b1224',
    overflow: 'hidden',
  },
  reelWindow: { overflow: 'hidden' },
  reelRow: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  teamText: { fontFamily: F.italicExtra, fontSize: 25, color: '#e2e8f0', textAlign: 'center' },
  yearText: { fontFamily: F.italicExtra, fontSize: 30, color: '#bfdbfe', textAlign: 'center', letterSpacing: 1 },
  finalText: { color: C.gold },
  fade: { position: 'absolute', left: 0, right: 0, height: 18 },
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
