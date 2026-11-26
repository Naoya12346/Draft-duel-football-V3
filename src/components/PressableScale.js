import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { tapHaptic } from '../utils/feedback';

const SPRING = { damping: 16, stiffness: 320, mass: 0.6 };

/**
 * Pressable wrapper that springs down on touch for a native, tactile feel.
 */
export default function PressableScale({
  children,
  onPress,
  disabled,
  style,
  scaleTo = 0.95,
  haptic = 'light',
  hitSlop,
  accessibilityLabel,
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

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
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING);
        }}
        onPress={() => {
          if (disabled) return;
          if (haptic) tapHaptic(haptic);
          if (onPress) onPress();
        }}
        style={styles.press}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  press: { width: '100%' },
});
