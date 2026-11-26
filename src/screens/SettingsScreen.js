import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGame } from '../context/GameContext';
import { useRouter } from '../navigation/Router';
import Screen from '../components/Screen';
import PressableScale from '../components/PressableScale';
import GameButton from '../components/GameButton';
import AppModal from '../components/AppModal';
import Icon from '../components/Icon';
import { useToast } from '../components/Toast';
import { C, F } from '../theme';

function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.seg}>
      {options.map(([label, val]) => {
        const active = value === val;
        return (
          <PressableScale key={String(val)} onPress={() => onChange(val)} style={styles.segCell} scaleTo={0.94}>
            <View style={[styles.segItem, active && styles.segItemOn]}>
              <Text style={[styles.segText, active && styles.segTextOn]}>{label}</Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

function Row({ title, desc, children }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowDesc}>{desc}</Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings, resetProgress } = useGame();
  const router = useRouter();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ width: 42 }} />
        <Text style={styles.title}>SETTINGS</Text>
        <PressableScale onPress={() => router.back()} style={{ width: 42 }} scaleTo={0.9}>
          <View style={styles.closeBtn}>
            <Icon name="close" size={20} color="#cbd5e1" />
          </View>
        </PressableScale>
      </View>

      <Row title="Sound" desc="Bid, pick and sold sound effects">
        <Segmented
          options={[['ON', true], ['OFF', false]]}
          value={settings.sound}
          onChange={(v) => updateSettings({ sound: v })}
        />
      </Row>

      <Row title="Auction timer" desc="Auto-pass when the clock runs out">
        <Segmented
          options={[['OFF', 0], ['15s', 15], ['30s', 30], ['60s', 60]]}
          value={settings.timer}
          onChange={(v) => updateSettings({ timer: v })}
        />
      </Row>

      <Row title="Bid buttons" desc="Size of each bid step">
        <Segmented
          options={[['SMALL', false], ['BIG', true]]}
          value={settings.bigBids}
          onChange={(v) => updateSettings({ bigBids: v })}
        />
      </Row>

      <Row title="Animations" desc="AUTO follows your device motion setting">
        <Segmented
          options={[['AUTO', 'auto'], ['LITE', 'lite'], ['FULL', 'full']]}
          value={settings.motion}
          onChange={(v) => updateSettings({ motion: v })}
        />
      </Row>

      <Row title="Admin panel" desc="Cards, players, auction rules and backup">
        <GameButton
          label="OPEN ADMIN"
          variant="blue"
          size="md"
          icon={<Icon name="settings" size={18} color="#fff" />}
          onPress={() => router.push('Admin')}
        />
      </Row>

      <Row title="Progress" desc="Resets matches played and level">
        <GameButton
          label="RESET PROGRESS"
          variant="danger"
          size="md"
          icon={<Icon name="refresh" size={18} color="#fff" />}
          onPress={() => setConfirmReset(true)}
        />
      </Row>

      <AppModal
        visible={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset progress?"
        footer={
          <View style={styles.modalActions}>
            <View style={{ flex: 1 }}>
              <GameButton label="CANCEL" variant="dark" size="md" onPress={() => setConfirmReset(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <GameButton
                label="RESET"
                variant="danger"
                size="md"
                onPress={() => {
                  resetProgress();
                  setConfirmReset(false);
                  toast('Progress reset', 'success');
                }}
              />
            </View>
          </View>
        }
      >
        <Text style={styles.modalText}>Matches and level will return to zero. This cannot be undone.</Text>
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { fontFamily: F.italicExtra, fontSize: 30, color: '#fff', letterSpacing: 1 },
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
  row: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    backgroundColor: 'rgba(15,23,42,0.85)',
    padding: 16,
    marginBottom: 12,
  },
  rowTitle: { fontFamily: F.italicExtra, fontSize: 24, color: '#fff', lineHeight: 26 },
  rowDesc: { fontFamily: F.bold, fontSize: 14, color: C.muted, marginTop: 1, marginBottom: 12 },
  seg: { flexDirection: 'row', gap: 8 },
  segCell: { flex: 1 },
  segItem: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'rgba(2,6,23,0.5)',
    alignItems: 'center',
  },
  segItemOn: { borderColor: C.gold, backgroundColor: 'rgba(250,204,21,0.14)' },
  segText: { fontFamily: F.italicExtra, fontSize: 16, color: C.muted, letterSpacing: 0.5 },
  segTextOn: { color: C.gold },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalText: { fontFamily: F.bold, fontSize: 16, color: C.muted, textAlign: 'center', lineHeight: 21 },
});
