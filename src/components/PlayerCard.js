import React, { useEffect, useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { ClipPath, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from './Icon';
import { CrestMark, FlagMark } from './TeamMarks';
import { useMotion } from '../context/MotionContext';
import { F, GRADIENTS, M3 } from '../theme';
import { MOTION } from '../theme/motion';

/** polygon(0 6.5%, 50% 0, 100% 6.5%, 100% 83%, 50% 100%, 0 83%) in a 373x495 box. */
const SHAPE = 'M 0 32.2 L 186.5 0 L 373 32.2 L 373 410.8 L 186.5 495 L 0 410.8 Z';
const RATIO = 495 / 373;
let seq = 0;

function Badge({ label, width }) {
  const size = width * 0.25;
  return (
    <View style={[styles.badge, { width: size, height: size * 1.12 }]}>
      <Svg viewBox="0 0 40 46" width={size} height={size * 1.12} style={StyleSheet.absoluteFill}>
        <Path d="M3 3 L37 3 L37 31 L20 44 L3 31 Z" fill="rgba(0,0,0,0.06)" stroke="#4a3000" strokeWidth="2" />
      </Svg>
      <Text style={[styles.badgeText, { fontSize: width * 0.06 }]} numberOfLines={1}>
        {String(label || '').toUpperCase().slice(0, 3)}
      </Text>
    </View>
  );
}

function Shield({ width, height, gid, colors }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 373 495" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={gid} x1="0.12" y1="0" x2="0.88" y2="1">
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="0.35" stopColor={colors[1]} />
          <Stop offset="0.72" stopColor={colors[2]} />
          <Stop offset="1" stopColor={colors[3]} />
        </LinearGradient>
        <ClipPath id={`${gid}-clip`}>
          <Path d={SHAPE} />
        </ClipPath>
      </Defs>
      <Path d={SHAPE} fill={`url(#${gid})`} />
      {Array.from({ length: 30 }).map((_, i) => {
        const x = -495 + i * 20;
        return (
          <Line
            key={i}
            x1={x}
            y1={0}
            x2={x + 495}
            y2={495}
            stroke="#ffffff"
            strokeWidth="7"
            strokeOpacity="0.11"
            clipPath={`url(#${gid}-clip)`}
          />
        );
      })}
    </Svg>
  );
}

/**
 * The single reusable card for the whole app.
 * Props: rating, position, club, name, tier (default GOLD), image,
 * width, onPress, animate. `home` turns it into a P1/P2 name card.
 */
function PlayerCard({
  rating,
  position,
  club,
  name,
  tier = 'GOLD',
  width = 146,
  image,
  onPress,
  animate = false,
  home = null,
}) {
  const height = width * RATIO;
  const { enabled } = useMotion();
  const gid = useRef(`pcard${(seq += 1)}`).current;
  const entered = useSharedValue(animate && enabled ? 0 : 1);
  const press = useSharedValue(0);
  const idle = useSharedValue(0);
  const lastPress = useRef(0);

  useEffect(() => {
    if (animate && enabled) {
      entered.value = withTiming(1, { duration: MOTION.duration.large, easing: Easing.bezier(...MOTION.easing.emphasized) });
    }
  }, [animate, enabled, entered]);

  useEffect(() => {
    if (!home || !enabled) return undefined;
    idle.value = withRepeat(
      withTiming(1, { duration: 1750 + (side || 0) * 220, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return () => cancelAnimation(idle);
  }, [side, enabled, idle]);

  const animated = useAnimatedStyle(() => ({
    opacity: entered.value,
    transform: [
      { translateY: -4 * press.value + (home ? -4 * idle.value : 0) },
      { rotate: home ? `${(home.side === 1 ? 1 : -1) * (1 - 2 * idle.value)}deg` : '0deg' },
      { scale: (0.9 + 0.1 * entered.value) * (1 - 0.03 * press.value) },
    ],
  }));
  const shine = useAnimatedStyle(() => ({ opacity: press.value * 0.12 + (home ? idle.value * 0.07 : 0) }));

  const side = home ? home.side : null;
  const gradient = home
    ? home.side === 1
      ? GRADIENTS.blue
      : GRADIENTS.gold
    : GRADIENTS.gold;
  const initials = home
    ? (home.name || '').trim().slice(0, 2).toUpperCase() || home.label
    : '';

  const card = (
    <Animated.View style={[{ width, height }, animated]}>
      {image ? (
        <Image
          source={{ uri: image }}
          style={{ width, height }}
          resizeMode="contain"
          accessible
          accessibilityLabel={name}
        />
      ) : (
        <View style={[styles.card, { width, height }]}>
          <Shield width={width} height={height} gid={gid} colors={gradient} />

          {home ? (
            <>
              <View style={styles.top}>
                <View>
                  <Text style={[styles.homeLabel, { fontSize: width * 0.21 }]}>{home.label}</Text>
                  <Text style={[styles.homeSub, { fontSize: width * 0.07 }]}>PLAYER</Text>
                </View>
                <Icon name="user" size={width * 0.14} color="#4a3000" />
              </View>
              <View style={[styles.avatar, { width: width * 0.42, height: width * 0.42, borderRadius: width * 0.21 }]}>
                <Text style={[styles.avatarText, { fontSize: width * 0.17 }]}>{initials}</Text>
              </View>
              <View style={styles.homeBottom}>
                <TextInput
                  value={home.name}
                  onChangeText={home.onChange}
                  placeholder="NAME"
                  placeholderTextColor="rgba(74,48,0,0.45)"
                  maxLength={12}
                  autoCapitalize="characters"
                  style={[styles.homeInput, { fontSize: width * 0.15 }]}
                />
                <Text style={[styles.homeFormation, { fontSize: width * 0.075 }]}>4 - 3 - 3</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.top}>
                <View style={styles.markColumn}>
                  <Text style={[styles.rating, { fontSize: width * 0.3 }]}>{rating}</Text>
                  <Text style={[styles.position, { fontSize: width * 0.075 }]}>{position}</Text>
                  <FlagMark code={club} teamName={name} width={width * 0.19} />
                  <CrestMark code={club} teamName={name} width={width * 0.17} />
                </View>
                <Badge label={club} width={width} />
              </View>
              <View style={styles.bottom}>
                <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.name, { fontSize: width * 0.155 }]}>
                  {name}
                </Text>
                <Text style={[styles.tier, { fontSize: width * 0.062 }]}>{tier}</Text>
              </View>
            </>
          )}

          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.highlight, shine]} />
        </View>
      )}
    </Animated.View>
  );

  if (!onPress) return card;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => {
        const now = Date.now();
        if (now - lastPress.current < 260) return;
        lastPress.current = now;
        if (onPress) onPress();
      }}
      onPressIn={() => {
        press.value = withTiming(1, { duration: MOTION.duration.micro, easing: Easing.out(Easing.cubic) });
      }}
      onPressOut={() => {
        press.value = withSpring(0, { damping: 18, stiffness: 320, mass: 0.5 });
      }}
      style={{ width, height, touchAction: 'manipulation' }}
    >
      {card}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 2, overflow: 'hidden' },
  markColumn: { alignItems: 'flex-start', gap: 3 },
  top: {
    position: 'absolute',
    top: '6%',
    left: '7%',
    right: '7%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rating: { fontFamily: F.italicExtra, color: '#4a3000', lineHeight: undefined },
  position: { fontFamily: F.extra, color: '#4a3000', letterSpacing: 2.4, marginTop: -1 },
  badge: { alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: F.extra, color: '#4a3000', position: 'absolute', letterSpacing: 0.5 },
  bottom: { position: 'absolute', left: '6%', right: '6%', bottom: '17%', alignItems: 'center' },
  name: {
    fontFamily: F.italicExtra,
    color: '#fff',
    textTransform: 'uppercase',
    textAlign: 'center',
    textShadowColor: 'rgba(74,48,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tier: { fontFamily: F.extra, color: '#7a5410', letterSpacing: 2.4, marginTop: 2 },
  homeLabel: { fontFamily: F.italicExtra, color: '#fff', lineHeight: undefined },
  homeSub: { fontFamily: F.extra, color: 'rgba(255,255,255,0.9)', letterSpacing: 2.2 },
  avatar: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: F.italicExtra, color: '#fff' },
  homeBottom: { position: 'absolute', left: '7%', right: '7%', bottom: '12%', alignItems: 'center' },
  homeInput: {
    width: '100%',
    textAlign: 'center',
    fontFamily: F.italicExtra,
    color: '#fff',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 0,
  },
  homeFormation: { fontFamily: F.extra, color: '#fff', letterSpacing: 2, marginTop: 4 },
  highlight: { backgroundColor: M3.color.statePressed },
});

export default React.memo(PlayerCard);
