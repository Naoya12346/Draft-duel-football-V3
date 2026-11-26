import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { useGame } from '../context/GameContext';
import { useRouter } from '../navigation/Router';
import { playSound, successHaptic, warnHaptic } from '../utils/feedback';
import Screen from '../components/Screen';
import GameButton from '../components/GameButton';
import PlayerCard from '../components/PlayerCard';
import Confetti from '../components/Confetti';
import Icon from '../components/Icon';
import { C, F } from '../theme';

const K = [C.gold, C.blue];

export default function SoldScreen() {
  const { auction, displayName, typeFor, auctionNext } = useGame();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { replace: navReplace, back: navBack } = router;
  const fired = useRef(false);

  const sold = auction.sold;
  const team = sold ? sold.team : -1;
  const player = sold ? sold.player : null;
  const accent = team >= 0 ? K[team] : '#94a3b8';
  const bothFull = auction.cnt[0] >= auction.N && auction.cnt[1] >= auction.N;

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (sold && sold.team >= 0) {
      playSound('sold');
      successHaptic();
    } else {
      playSound('tick');
      warnHaptic();
    }
  }, [sold]);

  if (!sold || !player) {
    return (
      <Screen scroll={false} contentContainerStyle={styles.center}>
        <Text style={styles.empty}>No lot to show.</Text>
        <GameButton
          label="BACK TO AUCTION"
          variant="dark"
          size="md"
          onPress={() => navBack()}
          style={{ marginTop: 16, width: 220 }}
        />
      </Screen>
    );
  }

  const [tierLabel, tierColor] = typeFor(player);
  const cardW = Math.max(150, Math.min(196, width * 0.46));

  const next = () => {
    const phase = auctionNext();
    if (phase === 'result') navReplace('Result');
    else navBack();
  };

  return (
    <Screen scroll={false} contentContainerStyle={styles.root}>
      {team >= 0 ? <Confetti key={player.id} color={accent} count={70} /> : null}

      <View style={styles.topLabelRow}>
        <View style={styles.line} />
        <Text style={styles.topLabel}>AUCTION RESULT</Text>
        <View style={styles.line} />
      </View>

      <Animated.View
        entering={ZoomIn.duration(420).springify().damping(12)}
        style={[styles.stamp, { borderColor: accent }]}
      >
        <Text style={[styles.stampText, { color: accent }]}>
          {team >= 0 ? 'SOLD' : 'UNSOLD'}
        </Text>
        {team >= 0 ? (
          <Text style={[styles.stampTeam, { color: accent }]} numberOfLines={1}>
            {displayName(team).toUpperCase()}
          </Text>
        ) : (
          <Text style={styles.stampTeamOff}>NO BIDS</Text>
        )}
      </Animated.View>

      <Animated.View entering={FadeIn.delay(120).duration(360)}>
        <PlayerCard player={player} width={cardW} animate />
      </Animated.View>

      <View style={styles.nameWrap}>
        <Text numberOfLines={1} style={styles.name}>{player.n}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.tierChip, { borderColor: `${tierColor}88`, backgroundColor: `${tierColor}1f` }]}>
            <Text style={[styles.tierText, { color: tierColor }]}>{tierLabel}</Text>
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {player.tn} {player.y} · {player.p}
          </Text>
        </View>
      </View>

      <View style={styles.priceBox}>
        {team >= 0 ? (
          <>
            <Text style={styles.priceCaption}>SIGNED FOR</Text>
            <Text style={[styles.price, { color: accent }]}>{sold.price}M</Text>
            <Text style={styles.priceSub}>
              {auction.budget[team]}M LEFT · {auction.cnt[team]}/{auction.N} SIGNED
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.priceCaption}>RETURNED TO THE POOL</Text>
            <Text style={[styles.price, { color: '#94a3b8', fontSize: 34 }]}>NO SALE</Text>
            <Text style={styles.priceSub}>Neither side placed a bid</Text>
          </>
        )}
      </View>

      <GameButton
        label={bothFull ? 'SEE RESULT' : 'NEXT LOT'}
        variant="gold"
        size="lg"
        slant
        icon={<Icon name={bothFull ? 'trophy' : 'play'} size={24} color="#161000" />}
        onPress={next}
        style={styles.cta}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { fontFamily: F.italicExtra, fontSize: 22, color: C.muted },
  topLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(148,163,184,0.25)' },
  topLabel: { fontFamily: F.extra, fontSize: 11, letterSpacing: 2.6, color: C.dim },

  stamp: {
    borderWidth: 3,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 3,
    alignItems: 'center',
    transform: [{ rotate: '-7deg' }],
    marginBottom: 14,
    backgroundColor: 'rgba(2,6,23,0.55)',
  },
  stampText: { fontFamily: F.italicExtra, fontSize: 44, letterSpacing: 4, lineHeight: 48 },
  stampTeam: { fontFamily: F.extra, fontSize: 13, letterSpacing: 2, marginTop: -4 },
  stampTeamOff: { fontFamily: F.extra, fontSize: 13, letterSpacing: 2, color: C.dim, marginTop: -4 },

  nameWrap: { alignItems: 'center', marginTop: 12 },
  name: { fontFamily: F.italicExtra, fontSize: 28, color: '#fff', letterSpacing: 0.4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  tierChip: { borderRadius: 5, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 0.5 },
  tierText: { fontFamily: F.extra, fontSize: 10, letterSpacing: 1.2 },
  meta: { fontFamily: F.bold, fontSize: 13, color: C.muted },

  priceBox: {
    marginTop: 12,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: 'rgba(15,23,42,0.85)',
    paddingVertical: 8,
    paddingHorizontal: 26,
    minWidth: 210,
  },
  priceCaption: { fontFamily: F.extra, fontSize: 10, letterSpacing: 2, color: C.dim },
  price: { fontFamily: F.italicExtra, fontSize: 40, lineHeight: 42 },
  priceSub: { fontFamily: F.bold, fontSize: 12, color: C.muted, marginTop: -2 },

  cta: { width: '100%', marginTop: 18 },
});
