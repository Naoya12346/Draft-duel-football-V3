import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGame } from '../context/GameContext';
import { useRouter } from '../navigation/Router';
import Screen from '../components/Screen';
import PressableScale from '../components/PressableScale';
import GameButton from '../components/GameButton';
import Icon from '../components/Icon';
import { C, F } from '../theme';

const PRESETS = [100, 150, 200, 300, 500];
const SIZES = [3, 5, 7, 9, 11];

export default function AuctionSetupScreen() {
  const { startAuction } = useGame();
  const router = useRouter();
  const [budget, setBudget] = useState(200);
  const [perTeam, setPerTeam] = useState(11);

  const adjust = (delta) => setBudget((b) => Math.max(30, Math.min(1000, b + delta)));

  const begin = () => {
    startAuction(budget, perTeam);
    router.replace('Auction');
  };

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ width: 42 }} />
        <View style={styles.headerTitle}>
          <Text style={styles.title}>AUCTION</Text>
          <Text style={styles.subtitle}>SETUP</Text>
        </View>
        <PressableScale onPress={() => router.back()} style={{ width: 42 }} scaleTo={0.9}>
          <View style={styles.closeBtn}>
            <Icon name="close" size={20} color="#cbd5e1" />
          </View>
        </PressableScale>
      </View>

      <View style={styles.panel}>
        <Text style={styles.label}>BUDGET PER TEAM</Text>
        <View style={styles.budgetRow}>
          <PressableScale onPress={() => adjust(-10)} style={styles.stepBtn} scaleTo={0.9}>
            <View style={styles.stepInner}>
              <Icon name="minus" size={26} color="#fff" />
            </View>
          </PressableScale>
          <View style={styles.budgetCenter}>
            <Text style={styles.budgetValue}>{budget}</Text>
            <Text style={styles.budgetUnit}>MILLION</Text>
          </View>
          <PressableScale onPress={() => adjust(10)} style={styles.stepBtn} scaleTo={0.9}>
            <View style={styles.stepInner}>
              <Icon name="plus" size={26} color="#fff" />
            </View>
          </PressableScale>
        </View>

        <View style={styles.presetRow}>
          {PRESETS.map((v) => {
            const active = budget === v;
            return (
              <PressableScale key={v} onPress={() => setBudget(v)} style={styles.presetCell} scaleTo={0.94}>
                <View style={[styles.preset, active && styles.presetActive]}>
                  <Text style={[styles.presetText, active && { color: C.gold }]}>{v}</Text>
                </View>
              </PressableScale>
            );
          })}
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>PLAYERS PER TEAM</Text>
        <View style={styles.sizeRow}>
          {SIZES.map((v) => {
            const active = perTeam === v;
            return (
              <PressableScale key={v} onPress={() => setPerTeam(v)} style={styles.sizeCell} scaleTo={0.94}>
                <View style={[styles.sizeBtn, active && styles.sizeBtnActive]}>
                  <Text style={[styles.sizeText, active && { color: C.gold }]}>{v}</Text>
                </View>
              </PressableScale>
            );
          })}
        </View>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            ≈ <Text style={styles.infoStrong}>{(budget / perTeam).toFixed(1)}M</Text> per player
          </Text>
          <Text style={styles.infoSub}>
            Base prices 1M–15M · keep at least 1M for every open slot
          </Text>
        </View>

        <GameButton
          label="START AUCTION"
          variant="gold"
          size="lg"
          icon={<Icon name="whistle" size={24} color="#161000" />}
          onPress={begin}
          style={{ marginTop: 18 }}
          slant
        />
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
  panel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.28)',
    backgroundColor: 'rgba(15,23,42,0.9)',
    padding: 18,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  label: { fontFamily: F.extra, fontSize: 12, letterSpacing: 2.4, color: C.muted },
  budgetRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  stepBtn: { width: 54 },
  stepInner: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#60a5fa',
    backgroundColor: 'rgba(37,99,235,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetCenter: { flex: 1, alignItems: 'center' },
  budgetValue: { fontFamily: F.italicExtra, fontSize: 62, color: C.gold, lineHeight: 64 },
  budgetUnit: { fontFamily: F.extra, fontSize: 11, letterSpacing: 2, color: C.muted, marginTop: -4 },
  presetRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  presetCell: { flex: 1 },
  preset: {
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'rgba(2,6,23,0.5)',
    alignItems: 'center',
  },
  presetActive: { borderColor: C.gold, backgroundColor: 'rgba(250,204,21,0.14)' },
  presetText: { fontFamily: F.italic, fontSize: 16, color: C.muted },
  sizeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  sizeCell: { flex: 1 },
  sizeBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'rgba(2,6,23,0.5)',
    alignItems: 'center',
  },
  sizeBtnActive: { borderColor: C.gold, backgroundColor: 'rgba(250,204,21,0.14)' },
  sizeText: { fontFamily: F.italicExtra, fontSize: 22, color: C.muted },
  info: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(51,65,85,0.8)',
    backgroundColor: 'rgba(2,6,23,0.5)',
    padding: 12,
    alignItems: 'center',
  },
  infoText: { fontFamily: F.bold, fontSize: 16, color: C.muted },
  infoStrong: { color: C.gold, fontFamily: F.extra },
  infoSub: { fontFamily: F.bold, fontSize: 12, color: C.dim, textAlign: 'center', marginTop: 3 },
});
