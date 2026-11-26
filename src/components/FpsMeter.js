import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C, F, M3 } from '../theme';

/** Tiny dev overlay: tap SETTINGS title 5 times to toggle. */
export default function FpsMeter() {
  const [fps, setFps] = useState(60);
  const frames = useRef(0);
  const last = useRef(0);

  useEffect(() => {
    let id;
    let alive = true;
    const tick = (now) => {
      if (!alive) return;
      frames.current += 1;
      if (!last.current) last.current = now;
      const dt = now - last.current;
      if (dt >= 500) {
        setFps(Math.round((frames.current * 1000) / dt));
        frames.current = 0;
        last.current = now;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(id);
    };
  }, []);

  return (
    <View pointerEvents="none" style={styles.badge}>
      <Text style={styles.text}>{fps} FPS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 44,
    right: 8,
    zIndex: 9999,
    borderRadius: M3.shape.sm,
    backgroundColor: 'rgba(2,6,23,0.85)',
    borderWidth: 1,
    borderColor: C.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: { fontFamily: F.extra, fontSize: 12, color: C.gold },
});
