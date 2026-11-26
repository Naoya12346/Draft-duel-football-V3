import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useGame } from '../context/GameContext';
import { flagEmoji, tierColors } from '../utils/gameLogic';
import PressableScale from './PressableScale';
import TeamBadge from './TeamBadge';
import { F } from '../theme';

const PATH = 'M 32 0 L 200 0 L 200 236 L 168 276 L 0 276 L 0 40 Z';

function HexPlayerCard({ player, width = 150, animate = false, onPress }) {
  const { db, typeFor } = useGame();
  const card = db.cardMap[player.id];
  const [tierLabel, tierColor] = typeFor(player);
  const height = width * 1.38;

  if (card && card.img) {
    const imgH = width * ((card.h || 1) / (card.w || 1));
    return (
      <PressableScale onPress={onPress} style={{ width }} scaleTo={0.96}>
        <Image source={{ uri: card.img }} style={{ width, height: imgH, borderRadius: 12 }} resizeMode="contain" />
      </PressableScale>
    );
  }

  const [c1, c2, c3, c4] = tierColors(player.o);
  const nameSize = player.n.length > 13 ? width * 0.13 : player.n.length > 9 ? width * 0.16 : width * 0.19;
  const gid = `lot-${player.id.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <Animated.View entering={animate ? ZoomIn.duration(420) : undefined} style={{ width }}>
      <PressableScale onPress={onPress} scaleTo={0.96}>
        <View style={[styles.card, { width, height, shadowColor: tierColor }]}>
          <Svg width={width} height={height} viewBox="0 0 200 276" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={c1} />
                <Stop offset="0.4" stopColor={c2} />
                <Stop offset="0.75" stopColor={c3} />
                <Stop offset="1" stopColor={c4} />
              </LinearGradient>
              <ClipPath id={`${gid}-clip`}>
                <Path d={PATH} />
              </ClipPath>
            </Defs>
            <Path d={PATH} fill={`url(#${gid})`} stroke={tierColor} strokeWidth="2.5" />
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
                clipPath={`url(#${gid}-clip)`}
              />
            ))}
          </Svg>

          <View style={styles.top}>
            <View>
              <Text style={[styles.ovr, { fontSize: width * 0.27 }]}>{player.o}</Text>
              <Text style={[styles.pos, { fontSize: width * 0.09 }]}>{player.p}</Text>
            </View>
            <TeamBadge code={player.c} size={width * 0.24} />
          </View>

          <View style={styles.bottom}>
            <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.name, { fontSize: nameSize }]}>
              {player.n}
            </Text>
            <Text numberOfLines={1} style={[styles.meta, { fontSize: width * 0.075 }]}>
              {player.c.length <= 2 ? `${flagEmoji(player.c)} ` : ''}{player.tn} {player.y}
            </Text>
            <View style={[styles.tier, { borderColor: `${tierColor}99`, backgroundColor: `${tierColor}22` }]}>
              <Text style={[styles.tierText, { color: tierColor, fontSize: width * 0.07 }]}>{tierLabel}</Text>
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  top: { position: 'absolute', top: 8, left: 10, right: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ovr: { fontFamily: F.italicExtra, color: '#1b1200', lineHeight: undefined },
  pos: { fontFamily: F.extra, color: '#3a2a00', letterSpacing: 1, marginTop: -2 },
  bottom: { position: 'absolute', left: 8, right: 8, bottom: 12, alignItems: 'center' },
  name: { fontFamily: F.italicExtra, color: '#fff', textTransform: 'uppercase', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  meta: { fontFamily: F.bold, color: 'rgba(255,255,255,0.82)', textAlign: 'center' },
  tier: { marginTop: 4, borderRadius: 5, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 1 },
  tierText: { fontFamily: F.extra, letterSpacing: 1.2 },
});

export default React.memo(HexPlayerCard);
