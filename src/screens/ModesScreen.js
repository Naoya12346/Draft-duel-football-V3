import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useGame } from '../context/GameContext';
import { useRouter } from '../navigation/Router';
import { buildAuctionPool, teamPool } from '../data/playerDB';
import { MODES } from '../data/constants';
import Screen from '../components/Screen';
import PressableScale from '../components/PressableScale';
import GameButton from '../components/GameButton';
import Icon from '../components/Icon';
import { C, F } from '../theme';

const ORDER = ['ALL', 'N', 'C', 'A'];
const ICONS = { ALL: 'trophy', N: 'flag', C: 'teams', A: 'whistle' };

export default function ModesScreen() {
  const { mode, setMode, db, admin } = useGame();
  const router = useRouter();

  const counts = useMemo(
    () => ({
      ALL: db.teams.length,
      N: teamPool(db.teams, 'N').length,
      C: teamPool(db.teams, 'C').length,
      A: buildAuctionPool(db.players, db.cardMap, admin).length,
    }),
    [db, admin],
  );

  const choose = (key) => {
    setMode(key);
    router.back();
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ width: 42 }} />
        <View style={styles.headerTitle}>
          <Text style={styles.title}>SELECT</Text>
          <Text style={styles.subtitle}>MODE</Text>
        </View>
        <PressableScale onPress={() => router.back()} style={{ width: 42 }} scaleTo={0.9}>
          <View style={styles.closeBtn}>
            <Icon name="close" size={20} color="#cbd5e1" />
          </View>
        </PressableScale>
      </View>

      {ORDER.map((key, i) => {
        const active = mode === key;
        return (
          <Animated.View key={key} entering={FadeInDown.delay(i * 70).duration(400)}>
            <PressableScale onPress={() => choose(key)} scaleTo={0.97}>
              <View style={[styles.card, active && styles.cardActive]}>
                <View style={[styles.iconBox, active && styles.iconBoxActive]}>
                  <Icon name={ICONS[key]} size={38} color={active ? C.gold : C.muted} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.cardTitle, active && { color: '#fff' }]}>{MODES[key].label}</Text>
                  <Text style={styles.cardBlurb}>{MODES[key].blurb}</Text>
                  <Text style={[styles.cardCount, active && { color: C.gold }]}>
                    {counts[key]} {key === 'A' ? 'PLAYERS' : 'TEAMS'}
                  </Text>
                </View>
                {active ? (
                  <View style={styles.check}>
                    <Icon name="check" size={16} color="#111" />
                  </View>
                ) : null}
              </View>
            </PressableScale>
          </Animated.View>
        );
      })}

      <View style={styles.footer}>
        <GameButton label="VIEW TEAMS" variant="blue" size="md" onPress={() => router.push('Teams')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  headerTitle: { alignItems: 'center' },
  title: { fontFamily: F.italicExtra, fontSize: 30, color: '#fff', letterSpacing: 0.6, lineHeight: 32 },
  subtitle: { fontFamily: F.extra, fontSize: 15, letterSpacing: 3, color: C.muted },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: 'rgba(15,23,42,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: 'rgba(15,23,42,0.8)',
    padding: 14,
    marginBottom: 12,
  },
  cardActive: {
    borderColor: C.gold,
    backgroundColor: 'rgba(250,204,21,0.1)',
    shadowColor: C.gold,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  iconBox: {
    width: 62,
    height: 62,
    borderRadius: 16,
    backgroundColor: 'rgba(2,6,23,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: { backgroundColor: 'rgba(250,204,21,0.12)' },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontFamily: F.italicExtra, fontSize: 28, color: '#cbd5e1', lineHeight: 30 },
  cardBlurb: { fontFamily: F.bold, fontSize: 14, color: C.muted, marginTop: 1 },
  cardCount: { fontFamily: F.extra, fontSize: 12, letterSpacing: 1.6, color: C.dim, marginTop: 4 },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { marginTop: 8, alignItems: 'center' },
});
