import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { ClipPath, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from './Icon';
import { F } from '../theme';

const W = 148;
const H = 198;

const PATHS = [
  'M 32 0 L 200 0 L 200 236 L 168 276 L 0 276 L 0 40 Z',
  'M 0 0 L 168 0 L 200 40 L 200 276 L 32 276 L 0 236 Z',
];

function HexSurface({ index, colors }) {
  const id = `hex-${index}`;
  return (
    <Svg width={W} height={H} viewBox="0 0 200 276" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="0.55" stopColor={colors[1]} />
          <Stop offset="1" stopColor={colors[2]} />
        </LinearGradient>
        <ClipPath id={`${id}-clip`}>
          <Path d={PATHS[index]} />
        </ClipPath>
      </Defs>
      <Path d={PATHS[index]} fill={`url(#${id})`} stroke={colors[3]} strokeWidth="2.5" />
      <ClipPath id={`${id}-stripes`}>
        <Path d={PATHS[index]} />
      </ClipPath>
      {Array.from({ length: 9 }).map((_, i) => (
        <Line
          key={i}
          x1={-90 + i * 38}
          y1={-20}
          x2={-10 + i * 38}
          y2={300}
          stroke="#ffffff"
          strokeWidth="9"
          strokeOpacity="0.12"
          clipPath={`url(#${id}-stripes)`}
        />
      ))}
    </Svg>
  );
}

function HexCard({ index, name, onChange, colors, dark }) {
  const label = `P${index + 1}`;
  const initials = name.trim() ? name.trim().slice(0, 2).toUpperCase() : label;
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 110).duration(520).springify().damping(14)}
      style={[
        styles.wrap,
        { shadowColor: colors[3], transform: [{ rotate: index === 0 ? '-5deg' : '5deg' }] },
      ]}
    >
      <HexSurface index={index} colors={colors} />
      <View style={styles.content}>
        <View style={styles.top}>
          <View>
            <Text style={[styles.label, dark && styles.ink]}>{label}</Text>
            <Text style={[styles.labelSub, dark && styles.inkSoft]}>PLAYER</Text>
          </View>
          <Icon
            name="user"
            size={19}
            color={dark ? 'rgba(58,42,0,0.65)' : 'rgba(255,255,255,0.85)'}
          />
        </View>

        <View style={[styles.avatar, { borderColor: dark ? 'rgba(58,42,0,0.35)' : 'rgba(255,255,255,0.45)' }]}>
          <Text style={[styles.avatarText, dark && styles.ink]}>{initials}</Text>
        </View>

        <TextInput
          value={name}
          onChangeText={onChange}
          placeholder="NAME"
          placeholderTextColor={dark ? 'rgba(58,42,0,0.45)' : 'rgba(255,255,255,0.55)'}
          maxLength={12}
          autoCapitalize="characters"
          style={[styles.input, dark ? styles.ink : styles.paper, {
            borderBottomColor: dark ? 'rgba(58,42,0,0.45)' : 'rgba(255,255,255,0.55)',
          }]}
        />
        <Text style={[styles.formation, dark ? styles.inkSoft : styles.paper]}>4 - 3 - 3</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: W,
    height: H,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  content: { ...StyleSheet.absoluteFillObject, paddingTop: 14, paddingHorizontal: 14, paddingBottom: 12, alignItems: 'center' },
  top: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: { fontFamily: F.italicExtra, fontSize: 30, color: '#fff', lineHeight: 31 },
  labelSub: { fontFamily: F.extra, fontSize: 10, letterSpacing: 1.8, color: 'rgba(255,255,255,0.85)' },
  avatar: {
    marginTop: 10,
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: F.italicExtra, fontSize: 25, color: '#fff' },
  input: {
    marginTop: 11,
    width: '88%',
    textAlign: 'center',
    fontFamily: F.italicExtra,
    fontSize: 21,
    letterSpacing: 0.6,
    borderBottomWidth: 1.5,
    paddingVertical: 1,
  },
  formation: { marginTop: 5, fontFamily: F.extra, fontSize: 11, letterSpacing: 2 },
  ink: { color: '#3a2a00' },
  inkSoft: { color: 'rgba(58,42,0,0.72)' },
  paper: { color: '#fff' },
});

export default React.memo(HexCard);
