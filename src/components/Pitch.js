import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { FORMATION_ROWS } from '../data/constants';
import { C, F } from '../theme';

const SHIELD = 'M22 2L2 12l7 14 7-4v34h32V22l7 4 7-14L42 2C40 8 36 10 32 10S24 8 22 2z';

const STRIPES = ['#15803d', '#166534'];

function Slot({ player, position, accent, animate, index, onPress }) {
  return (
    <Animated.View
      entering={
        animate
          ? FadeInDown.delay(60 + index * 55)
              .springify()
              .damping(14)
          : undefined
      }
      style={styles.slot}
    >
      <Animated.View entering={animate ? ZoomIn.delay(60 + index * 55).duration(360) : undefined}>
        <View
          style={[
            styles.shieldWrap,
            player && {
              shadowColor: accent,
              shadowOpacity: 0.7,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        >
          <Svg viewBox="0 0 64 58" width="100%" height="100%">
            <Path
              d={SHIELD}
              fill={player ? accent : '#3f4b5f'}
              stroke={player ? '#ffffff' : '#1e293b'}
              strokeWidth={2}
            />
          </Svg>
          <View style={styles.shieldLabel} pointerEvents="none">
            <Text
              style={[
                styles.shieldText,
                player ? styles.shieldTextFilled : styles.shieldTextEmpty,
              ]}
            >
              {player ? player.o : position}
            </Text>
          </View>
        </View>
      </Animated.View>
      <Text numberOfLines={1} style={styles.name}>
        {player ? player.n.split(' ').pop() : ''}
      </Text>
      {onPress && player ? (
        <View
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          onResponderRelease={() => onPress(player)}
        />
      ) : null}
    </Animated.View>
  );
}

/**
 * The 4-3-3 pitch. When `animate` is on, players spring onto their positions
 * one by one (used for the auction + draft result reveal).
 */
export default function Pitch({ lineup, accent = C.gold, animate = false, onPlayerPress, height = 430 }) {
  let slotIndex = 0;
  return (
    <View style={[styles.pitch, { height }]}>
      <View style={StyleSheet.absoluteFill}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View
            key={i}
            style={{ flex: 1, backgroundColor: STRIPES[i % 2] }}
          />
        ))}
      </View>
      <View style={styles.halfLine} />
      <View style={styles.centerCircle} />
      <View style={styles.boxTop} />
      <View style={styles.boxBottom} />

      <View style={styles.rows}>
        {FORMATION_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((position) => {
              const idx = slotIndex;
              slotIndex += 1;
              const player = lineup && lineup[idx] ? lineup[idx] : null;
              return (
                <Slot
                  key={`${position}-${idx}`}
                  player={player}
                  position={position}
                  accent={accent}
                  animate={animate}
                  index={idx}
                  onPress={onPlayerPress}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pitch: {
    position: 'relative',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#064e3b',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  halfLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  centerCircle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 96,
    height: 96,
    marginLeft: -48,
    marginTop: -48,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  boxTop: {
    position: 'absolute',
    top: 0,
    left: '28%',
    right: '28%',
    height: 34,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  boxBottom: {
    position: 'absolute',
    bottom: 0,
    left: '28%',
    right: '28%',
    height: 34,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  rows: {
    ...StyleSheet.absoluteFillObject,
    paddingVertical: 14,
    justifyContent: 'space-around',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  slot: { width: '19%', alignItems: 'center' },
  shieldWrap: {
    width: '100%',
    aspectRatio: 64 / 58,
    maxWidth: 58,
  },
  shieldLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  shieldText: { fontFamily: F.extra },
  shieldTextFilled: { color: '#0b1224', fontSize: 21 },
  shieldTextEmpty: { color: '#cbd5e1', fontSize: 14 },
  name: {
    marginTop: 2,
    maxWidth: '100%',
    textAlign: 'center',
    fontFamily: F.bold,
    fontSize: 13,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
