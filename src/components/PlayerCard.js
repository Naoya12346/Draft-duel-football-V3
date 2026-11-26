import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, { Easing, ZoomIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { F } from '../theme';

const SHAPE = 'M 0 32.2 L 186.5 0 L 373 32.2 L 373 410.8 L 186.5 495 L 0 410.8 Z';

function Badge({ club, width }) {
  const size = width * 0.26;
  return (
    <View style={[styles.badge, { width: size, height: size * 1.12 }]}>
      <Svg viewBox="0 0 40 46" width={size} height={size * 1.12} style={StyleSheet.absoluteFill}>
        <Path
          d="M3 3 L37 3 L37 31 L20 44 L3 31 Z"
          fill="rgba(74,48,0,0.10)"
          stroke="#4a3000"
          strokeWidth="2"
        />
      </Svg>
      <Text style={[styles.badgeText, { fontSize: width * 0.06 }]} numberOfLines={1}>
        {String(club || '').toUpperCase().slice(0, 3)}
      </Text>
    </View>
  );
}

function Shield({ width, height, gid }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 373 495" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={gid} x1="0.12" y1="0" x2="0.88" y2="1">
          <Stop offset="0" stopColor="#fff3a8" />
          <Stop offset="0.35" stopColor="#f5c93a" />
          <Stop offset="0.72" stopColor="#e0a824" />
          <Stop offset="1" stopColor="#b98512" />
        </LinearGradient>
        <ClipPath id={`${gid}-clip`}>
          <Path d={SHAPE} />
        </ClipPath>
      </Defs>
      <Path d={SHAPE} fill={`url(#${gid})`} />
      {Array.from({ length: 40 }).map((_, i) => {
        const x = -495 + i * 14;
        return (
          <Line
            key={i}
            x1={x}
            y1={0}
            x2={x + 495}
            y2={495}
            stroke="#ffffff"
            strokeWidth="6"
            strokeOpacity="0.12"
            clipPath={`url(#${gid}-clip)`}
          />
        );
      })}
    </Svg>
  );
}

/**
 * Exact auction card: shield shape, gold gradient, diagonal stripes.
 * Props: rating, position, club, name, tier (default GOLD).
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
}) {
  const height = width * (495 / 373);
  const press = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -4 * press.value },
      { scale: 1 + 0.03 * press.value },
    ],
  }));
  const shine = useAnimatedStyle(() => ({ opacity: 0.09 * press.value }));
  const gid = `card-${String(name || 'p').replace(/[^a-zA-Z0-9]/g, '')}`;

  const card = (
    <Animated.View
      entering={animate ? ZoomIn.duration(380) : undefined}
      style={[{ width, height }, style]}
    >
      {image ? (
        <Image source={{ uri: image }} style={{ width, height }} resizeMode="contain" />
      ) : (
        <View style={[styles.card, { width, height }]}>
          <Shield width={width} height={height} gid={gid} />

          <View style={styles.top}>
            <View>
              <Text style={[styles.rating, { fontSize: width * 0.30 }]}>{rating}</Text>
              <Text style={[styles.position, { fontSize: width * 0.075 }]}>{position}</Text>
            </View>
            <Badge club={club} width={width} />
          </View>

          <View style={styles.bottom}>
            <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.name, { fontSize: width * 0.155 }]}>
              {name}
            </Text>
            <Text style={[styles.tier, { fontSize: width * 0.062 }]}>{tier}</Text>
          </View>

          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.highlight, shine]} />
        </View>
      )}
    </Animated.View>
  );

  if (!onPress) return card;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) });
      }}
      onPressOut={() => {
        press.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
      }}
      style={{ width, height }}
    >
      {card}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 2, overflow: 'hidden' },
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
  highlight: { backgroundColor: '#ffffff' },
});

export default React.memo(PlayerCard);
