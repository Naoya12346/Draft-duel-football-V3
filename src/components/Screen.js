import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Screen shell with safe-area handling and an optional scroll container.
 */
export default function Screen({
  children,
  scroll = true,
  contentContainerStyle,
  style,
  edges = ['top'],
  keyboard = false,
}) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={keyboard ? 'handled' : 'never'}
          bounces
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  fill: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
});
