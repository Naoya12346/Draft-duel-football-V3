import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import PressableScale from './PressableScale';
import { F } from '../theme';
import { MOTION } from '../theme/motion';

const VARIANTS = {
  gold: {
    grad: ['#ffe45c', '#f5a300'],
    border: '#fde68a',
    text: '#161000',
    edge: '#7c4a00',
    glow: 'rgba(250,204,21,0.45)',
  },
  blue: {
    grad: ['#3b82f6', '#0f1f58'],
    border: '#60a5fa',
    text: '#ffffff',
    edge: '#0b1437',
    glow: 'rgba(37,99,235,0.4)',
  },
  purple: {
    grad: ['#8b5cf6', '#3b0764'],
    border: '#c4b5fd',
    text: '#ffffff',
    edge: '#2e1065',
    glow: 'rgba(168,85,247,0.4)',
  },
  danger: {
    grad: ['#ef4444', '#7f1d1d'],
    border: '#fca5a5',
    text: '#ffffff',
    edge: '#450a0a',
    glow: 'rgba(239,68,68,0.35)',
  },
  dark: {
    grad: ['#1e293b', '#0b1224'],
    border: '#475569',
    text: '#e2e8f0',
    edge: '#020617',
    glow: 'rgba(59,130,246,0.16)',
  },
  ghost: {
    grad: ['rgba(30,41,59,0.65)', 'rgba(2,6,23,0.65)'],
    border: '#334155',
    text: '#cbd5e1',
    edge: 'rgba(0,0,0,0.35)',
    glow: 'transparent',
  },
};

const SIZES = {
  lg: { height: 62, font: 30, radius: 20, pad: 20, edge: 5 },
  md: { height: 52, font: 23, radius: 18, pad: 16, edge: 4 },
  sm: { height: 48, font: 18, radius: 12, pad: 12, edge: 3 },
};

export default function GameButton({
  label,
  onPress,
  variant = 'gold',
  size = 'lg',
  disabled = false,
  slant = false,
  icon = null,
  style,
  textStyle,
}) {
  const v = VARIANTS[variant] || VARIANTS.gold;
  const s = SIZES[size] || SIZES.lg;
  const press = useSharedValue(0);
  const locked = useRef(0);
  const depth = useAnimatedStyle(() => ({
    transform: slant
      ? [{ translateY: 3 * press.value }, { skewX: '-8deg' }]
      : [{ translateY: 3 * press.value }],
  }));
  const ripple = useAnimatedStyle(() => ({ opacity: 0.16 * press.value, transform: [{ scale: 1 + press.value * 0.35 }] }));

  return (
    <PressableScale
      onPress={() => {
        const now = Date.now();
        if (now - locked.current < 260) return;
        locked.current = now;
        if (onPress) onPress();
      }}
      onPressIn={() => {
        press.value = withTiming(1, { duration: MOTION.duration.micro, easing: Easing.out(Easing.cubic) });
      }}
      onPressOut={() => {
        press.value = withSpring(0, { damping: 18, stiffness: 320, mass: 0.5 });
      }}
      disabled={disabled}
      style={style}
      scaleTo={0.96}
      overlayRadius={s.radius}
    >
      <Animated.View
        style={[
          styles.wrap,
          depth,
          {
            borderRadius: s.radius,
            borderColor: disabled ? '#334155' : v.border,
            borderBottomColor: disabled ? '#0b1224' : v.edge,
            borderBottomWidth: s.edge,
            shadowColor: v.glow,
            opacity: disabled ? 0.45 : 1,
          },
        ]}
      >
        <LinearGradient
          colors={disabled ? ['#1e293b', '#0f172a'] : v.grad}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={styles.shine} />
        <Animated.View pointerEvents="none" style={[styles.ripple, ripple]} />
        <View
          style={[
            styles.content,
            { height: s.height, paddingHorizontal: s.pad, transform: slant ? [{ skewX: '8deg' }] : undefined },
          ]}
        >
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              {
                fontSize: s.font,
                color: disabled ? '#64748b' : v.text,
                letterSpacing: 1.4,
              },
              textStyle,
            ]}
          >
            {label}
          </Text>
        </View>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  ripple: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 220,
    height: 220,
    marginLeft: -110,
    marginTop: -110,
    borderRadius: 110,
    backgroundColor: '#ffffff',
  },
  shine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '46%',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { marginRight: 8 },
  label: {
    fontFamily: F.italicExtra,
    textTransform: 'uppercase',
  },
});
