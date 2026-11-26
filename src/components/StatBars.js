import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { getPlayerStats } from '../utils/gameLogic';
import { C, F } from '../theme';

function Bar({ label, value, index }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      index * 70,
      withTiming(value, { duration: 620, easing: Easing.out(Easing.cubic) }),
    );
  }, [index, progress, value]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
    transformOrigin: 'left',
  }));
  const tone = value >= 85 ? '#22d3ee' : value >= 70 ? '#facc15' : '#f97316';
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fillWrap, style]}>
          <LinearGradient
            colors={[tone, '#facc15']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function StatBars({ player, compact = false }) {
  const stats = getPlayerStats(player);
  return (
    <View style={compact && styles.compact}>
      {stats.map(([label, value], i) => (
        <Bar key={label} label={label} value={value} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  compact: { marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  label: {
    width: 38,
    fontFamily: F.extra,
    fontSize: 13,
    color: C.muted,
    letterSpacing: 0.6,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(30,41,59,0.9)',
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  fillWrap: { width: '100%', height: '100%', borderRadius: 999, overflow: 'hidden' },
  value: {
    width: 26,
    textAlign: 'right',
    fontFamily: F.extra,
    fontSize: 17,
    color: C.text,
  },
});
