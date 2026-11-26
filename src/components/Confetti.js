import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useMotion } from '../context/MotionContext';
import { MOTION } from '../theme/motion';

const PALETTE = ['#facc15', '#ffffff', '#38bdf8', '#a855f7', '#22c55e'];

function Piece({ color, spread, delay }) {
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const conf = useMemo(() => {
    const angle = (Math.random() - 0.5) * Math.PI;
    const distance = spread * (0.4 + Math.random() * 0.8);
    return {
      dx: Math.cos(angle) * distance,
      dy: -Math.abs(Math.sin(angle) * distance) - height * 0.12,
      rot: (Math.random() - 0.5) * 720,
      size: 6 + Math.random() * 6,
      left: width / 2 + (Math.random() - 0.5) * 40,
      top: height * 0.42,
      delay,
    };
  }, [spread, height, width, delay]);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: MOTION.duration.large + Math.random() * 300,
      delay: conf.delay,
      easing: Easing.out(Easing.quad),
    });
  }, [conf.delay, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateX: conf.dx * p },
        { translateY: conf.dy * p + p * p * (height * 0.55) },
        { rotate: `${conf.rot * p}deg` },
      ],
      opacity: 1 - Math.max(0, (p - 0.6) / 0.4),
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        {
          left: conf.left,
          top: conf.top,
          width: conf.size,
          height: conf.size * 1.7,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

/** One-shot celebration burst. Mount it (with a key) to fire. */
export default function Confetti({ color = '#facc15', count = 36, spread = 220 }) {
  const { enabled } = useMotion();
  const { width, height } = useWindowDimensions();
  const total = Math.min(40, count);
  const pieces = useMemo(
    () =>
      Array.from({ length: total }, (_, i) => ({
        id: i,
        color: i % 5 === 0 ? color : PALETTE[i % PALETTE.length],
        delay: Math.random() * 180,
      })),
    [total, color],
  );
  if (!enabled) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} width={width} height={height}>
      {pieces.map((p) => (
        <Piece key={p.id} color={p.color} spread={spread} delay={p.delay} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    borderRadius: 2,
  },
});
