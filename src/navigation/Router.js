/**
 * Lightweight animated stack navigator.
 * Only the top screen is mounted; screens read/write shared state from context,
 * so remounting is cheap and keeps transitions buttery smooth.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideInLeft, SlideInRight } from 'react-native-reanimated';

import HomeScreen from '../screens/HomeScreen';
import ModesScreen from '../screens/ModesScreen';
import TeamsScreen from '../screens/TeamsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DraftScreen from '../screens/DraftScreen';
import AuctionSetupScreen from '../screens/AuctionSetupScreen';
import AuctionScreen from '../screens/AuctionScreen';
import SoldScreen from '../screens/SoldScreen';
import ResultScreen from '../screens/ResultScreen';
import MatchScreen from '../screens/MatchScreen';
import AdminScreen from '../screens/AdminScreen';

const SCREENS = {
  Home: HomeScreen,
  Modes: ModesScreen,
  Teams: TeamsScreen,
  Settings: SettingsScreen,
  Draft: DraftScreen,
  AuctionSetup: AuctionSetupScreen,
  Auction: AuctionScreen,
  Sold: SoldScreen,
  Result: ResultScreen,
  Match: MatchScreen,
  Admin: AdminScreen,
};

const RouterContext = createContext(null);

let seq = 0;

export function RouterProvider() {
  const [stack, setStack] = useState([{ name: 'Home', params: {}, key: 'root' }]);
  const [direction, setDirection] = useState('forward');
  const stackRef = useRef(stack);
  stackRef.current = stack;

  const push = useCallback((name, params = {}) => {
    setDirection('forward');
    setStack((s) => [...s, { name, params, key: `${name}-${(seq += 1)}` }]);
  }, []);

  const replace = useCallback((name, params = {}) => {
    setDirection('forward');
    setStack((s) => [...s.slice(0, -1), { name, params, key: `${name}-${(seq += 1)}` }]);
  }, []);

  const back = useCallback(() => {
    setDirection('back');
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);

  const reset = useCallback((name = 'Home', params = {}) => {
    setDirection('back');
    setStack([{ name, params, key: `${name}-${(seq += 1)}` }]);
  }, []);

  const popTo = useCallback((name) => {
    setDirection('back');
    setStack((s) => {
      const idx = s.map((x) => x.name).lastIndexOf(name);
      return idx >= 0 ? s.slice(0, idx + 1) : s;
    });
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stackRef.current.length > 1) {
        back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [back]);

  const top = stack[stack.length - 1];
  const Screen = SCREENS[top.name] || HomeScreen;
  const entering =
    direction === 'back'
      ? SlideInLeft.duration(260)
      : stack.length === 1
        ? FadeIn.duration(280)
        : SlideInRight.duration(280);

  const value = { push, replace, back, reset, popTo, stack, current: top.name };

  return (
    <RouterContext.Provider value={value}>
      <Animated.View
        key={top.key}
        entering={entering}
        style={styles.fill}
      >
        <Screen params={top.params} />
      </Animated.View>
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used inside RouterProvider');
  return ctx;
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#020617' },
});
