import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useGame } from '../context/GameContext';
import { useRouter } from '../navigation/Router';
import { isChampion, teamMaxOvr, teamPool } from '../data/playerDB';
import { MODES } from '../data/constants';
import Screen from '../components/Screen';
import PressableScale from '../components/PressableScale';
import TeamBadge from '../components/TeamBadge';
import Icon from '../components/Icon';
import { C, F } from '../theme';

const FILTERS = [
  ['ALL', 'ALL'],
  ['N', 'NATIONAL'],
  ['C', 'CLUB'],
];

export default function TeamsScreen() {
  const { db, mode } = useGame();
  const router = useRouter();
  const initial = mode === 'A' ? 'ALL' : mode;
  const [filter, setFilter] = useState(initial);

  const teams = useMemo(() => {
    const list = teamPool(db.teams, filter === 'ALL' ? 'ALL' : filter).slice();
    list.sort((a, b) => a.n.localeCompare(b.n) || Number(a.y) - Number(b.y));
    return list;
  }, [db.teams, filter]);

  return (
    <Screen scroll={false} contentContainerStyle={styles.root}>
      <View style={styles.header}>
        <View style={{ width: 42 }} />
        <View style={styles.headerTitle}>
          <Text style={styles.title}>{filter === 'ALL' ? 'ALL' : MODES[filter].label}</Text>
          <Text style={styles.subtitle}>{teams.length} TEAMS</Text>
        </View>
        <PressableScale onPress={() => router.back()} style={{ width: 42 }} scaleTo={0.9}>
          <View style={styles.closeBtn}>
            <Icon name="close" size={20} color="#cbd5e1" />
          </View>
        </PressableScale>
      </View>

      <View style={styles.chips}>
        {FILTERS.map(([key, label]) => {
          const active = filter === key;
          return (
            <PressableScale key={key} onPress={() => setFilter(key)} style={styles.chipCell} scaleTo={0.94}>
              <View style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && { color: '#93c5fd' }]}>{label}</Text>
              </View>
            </PressableScale>
          );
        })}
      </View>

      <FlatList
        data={teams}
        keyExtractor={(t) => `${t.c}-${t.n}-${t.y}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const champ = isChampion(item);
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index * 18, 260)).duration(320)}>
              <View style={styles.row}>
                <View style={styles.badge}>
                  <TeamBadge code={item.c} size={32} />
                </View>
                <View style={styles.rowBody}>
                  <Text numberOfLines={1} style={styles.teamName}>{item.n}</Text>
                  <Text style={styles.teamMeta}>
                    {item.y}
                    {champ ? '  •  CHAMPION' : ''}
                    {item.k ? '  •  CLUB' : ''}
                  </Text>
                </View>
                <View style={styles.ovrBox}>
                  <Text style={styles.ovr}>{teamMaxOvr(item)}</Text>
                  <Text style={styles.ovrLabel}>TOP OVR</Text>
                </View>
              </View>
            </Animated.View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 12 },
  headerTitle: { alignItems: 'center' },
  title: { fontFamily: F.italicExtra, fontSize: 30, color: '#fff', letterSpacing: 0.6, lineHeight: 32 },
  subtitle: { fontFamily: F.extra, fontSize: 15, letterSpacing: 2.4, color: C.muted },
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
  chips: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  chipCell: { flex: 1 },
  chip: {
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'rgba(15,23,42,0.7)',
    alignItems: 'center',
  },
  chipActive: { borderColor: '#60a5fa', backgroundColor: 'rgba(37,99,235,0.18)' },
  chipText: { fontFamily: F.italic, fontSize: 16, color: C.muted, letterSpacing: 0.6 },
  list: { paddingBottom: 30 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    backgroundColor: 'rgba(15,23,42,0.78)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  badge: { width: 40, alignItems: 'center' },
  rowBody: { flex: 1, minWidth: 0 },
  teamName: { fontFamily: F.italicExtra, fontSize: 22, color: '#fff', lineHeight: 24 },
  teamMeta: { fontFamily: F.bold, fontSize: 12, color: C.muted, letterSpacing: 0.6 },
  ovrBox: { alignItems: 'flex-end' },
  ovr: { fontFamily: F.italicExtra, fontSize: 26, color: C.teal, lineHeight: 28 },
  ovrLabel: { fontFamily: F.extra, fontSize: 8, letterSpacing: 1.4, color: C.dim },
});
