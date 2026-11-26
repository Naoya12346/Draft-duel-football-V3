import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';

import {
  BarlowCondensed_400Regular,
  BarlowCondensed_700Bold,
  BarlowCondensed_700Bold_Italic,
  BarlowCondensed_800ExtraBold,
  BarlowCondensed_800ExtraBold_Italic,
} from '@expo-google-fonts/barlow-condensed';

import { GameProvider, useGame } from './src/context/GameContext';
import { MotionProvider } from './src/context/MotionContext';
import { ToastProvider } from './src/components/Toast';
import FpsMeter from './src/components/FpsMeter';
import { RouterProvider } from './src/navigation/Router';
import Background from './src/components/Background';
import { C } from './src/theme';

const FONTS = {
  BarlowCondensed_400Regular,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
  BarlowCondensed_700Bold_Italic,
  BarlowCondensed_800ExtraBold_Italic,
};

function Boot() {
  return (
    <View style={styles.boot}>
      <ActivityIndicator size="large" color={C.gold} />
    </View>
  );
}

function Root() {
  const { ready, settings } = useGame();
  if (!ready) return <Boot />;
  return (
    <MotionProvider>
      <RouterProvider />
      {settings.showFps ? <FpsMeter /> : null}
    </MotionProvider>
  );
}

export default function App() {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let alive = true;
    Font.loadAsync(FONTS)
      .catch(() => {})
      .finally(() => {
        if (alive) setFontsReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!fontsReady) return <Boot />;

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Background />
        <GameProvider>
          <ToastProvider>
            <StatusBar style="light" backgroundColor="#020617" />
            <Root />
          </ToastProvider>
        </GameProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617' },
});
