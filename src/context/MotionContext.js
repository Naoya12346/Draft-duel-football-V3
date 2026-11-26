import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useGame } from './GameContext';

const MotionContext = createContext({ enabled: true, reduced: false });

export function MotionProvider({ children }) {
  const { settings } = useGame();
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => {
      if (alive) setReduced(!!v);
    }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);

  const enabled = settings.motion !== 'lite' && !reduced;
  return <MotionContext.Provider value={{ enabled, reduced }}>{children}</MotionContext.Provider>;
}

export function useMotion() {
  return useContext(MotionContext);
}
