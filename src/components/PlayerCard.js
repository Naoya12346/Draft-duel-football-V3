import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useGame } from '../context/GameContext';
import { usePlayerFace, initials } from '../hooks/usePlayerFace';
import { teamColors } from '../data/playerDB';
import { tierColors, flagEmoji } from '../utils/gameLogic';
import PressableScale from './PressableScale';
import TeamBadge from './TeamBadge';
import { F } from '../theme';

function PlayerAvatar({ player, size, fontScale = 0.32 }) {
  const face = usePlayerFace(player);
  const [primary, secondary] = teamColors(player.c);
  if (face) {
    return (
      <Image
        source={{ uri: face }}
        style={{
          width: size,
          height: size * 1.12,
          borderRadius: size * 0.42,
        }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.35)',
      }}
    >
      <LinearGradient colors={[primary, secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.avatarCenter}>
        <Text style={{ fontFamily: F.italicExtra, fontSize: size * fontScale, color: '#fff' }}>
          {initials(player.n)}
        </Text>
      </View>
    </View>
  );
}

/**
 * Premium player card. Renders a custom admin card image when present,
 * otherwise a tiered cinematic card with photo/avatar.
 */
export default function PlayerCard({
  player,
  width = 150,
  onPress,
  animate = false,
  card: cardOverride,
  showBadge = true,
}) {
  const { db, typeFor } = useGame();
  const card = cardOverride || db.cardMap[player.id];
  const [tierLabel, tierColor] = typeFor(player);

  if (card && card.img) {
    const height = width * ((card.h || 1) / (card.w || 1));
    return (
      <PressableScale onPress={onPress} style={{ width }} scaleTo={0.96}>
        <View
          style={{
            width,
            height,
            borderRadius: 14,
            shadowColor: tierColor,
            shadowOpacity: 0.55,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 10,
          }}
        >
          <Image
            source={{ uri: card.img }}
            style={{ width, height, borderRadius: 14 }}
            resizeMode="contain"
          />
        </View>
      </PressableScale>
    );
  }

  const [c1, c2, c3] = tierColors(player.o);
  const height = width * 1.34;
  const nameSize = player.n.length > 14 ? width * 0.13 : player.n.length > 10 ? width * 0.155 : width * 0.185;

  return (
    <Animated.View entering={animate ? ZoomIn.duration(420) : undefined} style={{ width }}>
      <PressableScale onPress={onPress} scaleTo={0.96}>
        <View
          style={[
            styles.card,
            {
              width,
              height,
              borderColor: tierColor,
              shadowColor: tierColor,
            },
          ]}
        >
          <LinearGradient colors={[c1, c2, c3]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.stripes}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[styles.stripe, { left: -width + i * (width * 0.34) }]} />
            ))}
          </View>
          <LinearGradient
            colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
            style={styles.gloss}
          />

          <View style={styles.topRow}>
            <View>
              <Text style={[styles.ovr, { fontSize: width * 0.24 }]}>{player.o}</Text>
              <Text style={[styles.pos, { fontSize: width * 0.085 }]}>{player.p}</Text>
            </View>
            {showBadge ? <TeamBadge code={player.c} size={width * 0.23} /> : null}
          </View>

          <View style={[styles.faceWrap, { width: width * 0.72, height: width * 0.8, top: height * 0.16 }]}>
            <PlayerAvatar player={player} size={width * 0.62} />
          </View>

          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.62)']}
            style={styles.bottomFade}
          />

          <View style={styles.bottom}>
            <Text
              numberOfLines={2}
              adjustsFontSizeToFit
              style={[styles.name, { fontSize: nameSize }]}
            >
              {player.n}
            </Text>
            <View style={styles.metaRow}>
              <Text numberOfLines={1} style={[styles.meta, { fontSize: width * 0.072 }]}>
                {player.c.length <= 2 ? `${flagEmoji(player.c)} ` : ''}
                {player.tn} {player.y}
              </Text>
            </View>
            <View style={[styles.tierChip, { borderColor: `${tierColor}99`, backgroundColor: `${tierColor}22` }]}>
              <Text style={[styles.tierText, { color: tierColor, fontSize: width * 0.066 }]}>{tierLabel}</Text>
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  stripes: { ...StyleSheet.absoluteFillObject, opacity: 0.16 },
  stripe: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    width: 18,
    backgroundColor: '#fff',
    transform: [{ rotate: '22deg' }],
  },
  gloss: { position: 'absolute', left: 0, right: 0, top: 0, height: '38%' },
  topRow: {
    position: 'absolute',
    top: 9,
    left: 11,
    right: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ovr: { fontFamily: F.italicExtra, color: '#1b1200', lineHeight: undefined },
  pos: { fontFamily: F.extra, color: '#3a2a00', letterSpacing: 1, marginTop: -2 },
  faceWrap: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  bottom: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    alignItems: 'center',
  },
  name: {
    fontFamily: F.italicExtra,
    color: '#fff',
    textTransform: 'uppercase',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: undefined,
  },
  metaRow: { marginTop: 2, maxWidth: '100%' },
  meta: {
    fontFamily: F.bold,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
  },
  tierChip: {
    marginTop: 4,
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  tierText: { fontFamily: F.extra, letterSpacing: 1.2 },
  avatarCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
