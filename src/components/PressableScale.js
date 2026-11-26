import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const SPRING = { damping: 22, stiffness: 420, mass: 0.5 };

/**
 * Pressable with a smooth spring press and a soft highlight, no haptics.
 */
export default function PressableScale({
  children,
  onPress,
  disabled,
  style,
  scaleTo = 0.95,
  hitSlop,
  accessibilityLabel,
  overlayRadius = 14,
}) {
  const scale = useSharedValue(1);
  const highlight = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const highlightStyle = useAnimatedStyle(() => ({ opacity: highlight.value }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={hitSlop}
        disabled={disabled}
        onPressIn={() => {
          if (disabled) return;
          scale.value = withSpring(scaleTo, SPRING);
          highlight.value = withTiming(1, { duration: 110 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING);
          highlight.value = withTiming(0, { duration: 180 });
        }}
        onPress={() => {
          if (disabled) return;
          if (onPress) onPress();
        }}
        style={styles.press}
      >
        {children}
        <Animated.View
          pointerEvents="none"
          style={[styles.highlight, { borderRadius: overlayRadius }, highlightStyle]}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  press: { width: '100%' },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
});
