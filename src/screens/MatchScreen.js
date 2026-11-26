import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { useGame } from '../context/GameContext';
import { useRouter } from '../navigation/Router';
import { playSound } from '../utils/feedback';
import Screen from '../components/Screen';
import PressableScale from '../components/PressableScale';
import GameButton from '../components/GameButton';
import Icon from '../components/Icon';
import AppModal from '../components/AppModal';
import Confetti from '../components/Confetti';
import { C, F } from '../theme';

const K = [C.gold, C.blue];

const TYPE_COLOR = {
  GOAL: null,
  SAVE: '#38bdf8',
  MISS: '#94a3b8',
  PENS: '#facc15',
};

function LogLine({ event, accent }) {
  const color = event.type === 'GOAL' ? accent : TYPE_COLOR[event.type] || '#475569';
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={[styles.logLine, { borderLeftColor: color }]}
    >
      <Text style={[styles.logMinute, { color }]}>{event.minute}'</Text>
      <View style={styles.logBody}>
        <Text style={[styles.logType, { color }]}>{event.type}</Text>
        <Text style={styles.logText} numberOfLines={2}>{event.text}</Text>
      </View>
    </Animated.View>
  );
}

export default function MatchScreen() {
  const { match, totals, displayName, startMatch, registerResult, resetFlow } = useGame();
  const router = useRouter();
  const { reset: navReset, back: navBack } = router;

  const [minute, setMinute] = useState(0);
  const [revealed, setRevealed] = useState([]);
  const [score, setScore] = useState([0, 0]);
  const [finished, setFinished] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const timerRef = useRef(null);
  const registeredRef = useRef(false);
  const progress = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
    transformOrigin: 'left',
  }));

  useEffect(() => {
    if (!match) startMatch();
  }, [match, startMatch]);

  useEffect(() => {
    if (!match) return undefined;
    if (timerRef.current) clearInterval(timerRef.current);
    registeredRef.current = false;
    setMinute(0);
    setRevealed([]);
    setScore([0, 0]);
    setFinished(false);
    progress.value = 0;

    let idx = 0;
    let m = 0;
    let sc = [0, 0];

    timerRef.current = setInterval(() => {
      m = Math.min(90, m + 10);
      const add = [];
      while (idx < match.events.length && match.events[idx].minute <= m) {
        add.push(match.events[idx]);
        idx += 1;
      }
      const hadGoal = add.some((e) => e.type === 'GOAL' || e.type === 'PENS');
      if (add.length) {
        add.forEach((e) => {
          if (e.type === 'GOAL') {
            sc = [sc[0] + (e.team === 0 ? 1 : 0), sc[1] + (e.team === 1 ? 1 : 0)];
          }
        });
        setRevealed((prev) => prev.concat(add));
        setScore([...sc]);
        if (hadGoal) playSound('sold');
      }
      setMinute(m);
      progress.value = withTiming(m / 90, { duration: 900 });

      if (m >= 90) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setScore([...match.score]);
        setFinished(true);
        if (!hadGoal) playSound('sold');
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [match, progress]);

  useEffect(() => {
    if (finished && !registeredRef.current) {
      registeredRef.current = true;
      registerResult();
    }
  }, [finished, registerResult]);

  if (!match) {
    return (
      <Screen scroll={false} contentContainerStyle={styles.loading}>
        <Text style={styles.loadingText}>PREPARING THE MATCH…</Text>
      </Screen>
    );
  }

  const winner = match.winner === 1 ? 1 : 0;
  const winnerName = displayName(winner);
  const upset = totals[winner] < totals[winner ^ 1];
  const visible = revealed
    .map((event, idx) => ({ event, idx }))
    .slice(-12)
    .reverse();

  const skip = () => {
    if (finished) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setMinute(90);
    setRevealed(match.events.slice());
    setScore([...match.score]);
    setFinished(true);
    progress.value = withTiming(1, { duration: 180 });
    playSound('sold');
  };

  const rematch = () => {
    startMatch();
  };

  const leave = () => {
    setShowExit(false);
    resetFlow();
    navReset('Home');
  };

  return (
    <Screen scroll={false} contentContainerStyle={styles.root}>
      {finished ? <Confetti key={`ft-${match.score.join('-')}`} color={K[winner]} count={60} /> : null}

      <View style={styles.header}>
        <PressableScale onPress={() => setShowExit(true)} style={{ width: 44 }} scaleTo={0.9}>
          <View style={styles.iconBtn}>
            <Icon name="close" size={20} color="#cbd5e1" />
          </View>
        </PressableScale>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>MATCH DAY</Text>
          <Text style={styles.subtitle}>90 MINUTES · 4-3-3</Text>
        </View>
        <View style={styles.liveChip}>
          <View style={[styles.liveDot, finished && { backgroundColor: C.dim }]} />
          <Text style={[styles.liveText, finished && { color: C.dim }]}>
            {finished ? 'FT' : 'LIVE'}
          </Text>
        </View>
      </View>

      <View style={styles.board}>
        <View style={styles.boardSide}>
          <Text numberOfLines={1} style={[styles.boardName, { color: K[0] }]}>
            {displayName(0)}
          </Text>
          <Text style={styles.boardTotal}>OVR {totals[0]}</Text>
        </View>
        <View style={styles.scoreWrap}>
          <Animated.Text
            key={`${score[0]}-${score[1]}`}
            entering={ZoomIn.duration(240)}
            style={styles.score}
          >
            {score[0]} - {score[1]}
          </Animated.Text>
          <Text style={styles.clock}>{finished ? 'FULL TIME' : `${minute}'`}</Text>
          {finished && match.penalties ? (
            <Text style={styles.pens}>DECIDED ON PENALTIES</Text>
          ) : null}
        </View>
        <View style={styles.boardSide}>
          <Text numberOfLines={1} style={[styles.boardName, { color: K[1] }]}>
            {displayName(1)}
          </Text>
          <Text style={styles.boardTotal}>OVR {totals[1]}</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>

      {finished ? (
        <Animated.View
          entering={ZoomIn.duration(320).springify().damping(13)}
          style={[styles.finalBanner, { borderColor: `${K[winner]}77` }]}
        >
          <Text style={styles.fullTime}>FULL TIME</Text>
          <Text numberOfLines={1} style={[styles.winner, { color: K[winner] }]}>
            {winnerName.toUpperCase()} WINS{match.penalties ? ' (PENS)' : ''}
          </Text>
          {upset ? <Text style={styles.upset}>UPSET ON THE CARDS</Text> : null}
        </Animated.View>
      ) : null}

      <View style={styles.logPanel}>
        <View style={styles.logHead}>
          <Text style={styles.logTitle}>COMMENTARY</Text>
          {!finished ? <Text style={styles.logLive}>UPDATING LIVE</Text> : null}
        </View>
        <ScrollView
          style={styles.logScroll}
          contentContainerStyle={styles.logContent}
          showsVerticalScrollIndicator={false}
        >
          {visible.length === 0 ? (
            <Text style={styles.logEmpty}>The referee blows the whistle…</Text>
          ) : (
            visible.map(({ event, idx }) => (
              <LogLine
                key={`${idx}-${event.minute}-${event.type}`}
                event={event}
                accent={K[event.team] || K[0]}
              />
            ))
          )}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        {finished ? (
          <View style={styles.footerRow}>
            <GameButton
              label="REMATCH"
              variant="gold"
              size="md"
              slant
              icon={<Icon name="refresh" size={20} color="#161000" />}
              onPress={rematch}
              style={{ flex: 1 }}
            />
            <GameButton
              label="BACK TO RESULT"
              variant="dark"
              size="md"
              onPress={() => navBack()}
              style={{ flex: 1 }}
            />
          </View>
        ) : (
          <GameButton
            label="SKIP TO FULL TIME"
            variant="dark"
            size="md"
            icon={<Icon name="play" size={20} color="#e2e8f0" />}
            onPress={skip}
          />
        )}
      </View>

      <AppModal
        visible={showExit}
        onClose={() => setShowExit(false)}
        title="Leave the match?"
        footer={
          <View style={styles.modalActions}>
            <View style={{ flex: 1 }}>
              <GameButton label="STAY" variant="dark" size="md" onPress={() => setShowExit(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <GameButton label="LEAVE" variant="danger" size="md" onPress={leave} />
            </View>
          </View>
        }
      >
        <Text style={styles.modalText}>
          You will return home and this match will be lost. The squads stay in the result screen.
        </Text>
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 14, paddingTop: 4, paddingBottom: 10 },
  loading: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: F.italicExtra, fontSize: 22, color: C.muted, letterSpacing: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerCenter: { alignItems: 'center' },
  title: { fontFamily: F.italicExtra, fontSize: 26, color: '#fff', letterSpacing: 1 },
  subtitle: { fontFamily: F.extra, fontSize: 9, letterSpacing: 2, color: C.dim },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: 'rgba(15,23,42,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveChip: {
    width: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    backgroundColor: 'rgba(2,6,23,0.6)',
    paddingVertical: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  liveText: { fontFamily: F.extra, fontSize: 10, letterSpacing: 1, color: '#fca5a5' },

  board: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.22)',
    backgroundColor: 'rgba(15,23,42,0.92)',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  boardSide: { flex: 1, alignItems: 'center' },
  boardName: { fontFamily: F.italicExtra, fontSize: 16, letterSpacing: 0.3, maxWidth: '100%' },
  boardTotal: { fontFamily: F.extra, fontSize: 9, letterSpacing: 1.2, color: C.dim, marginTop: 1 },
  scoreWrap: { alignItems: 'center', paddingHorizontal: 6 },
  score: { fontFamily: F.italicExtra, fontSize: 44, color: C.gold, lineHeight: 46 },
  clock: { fontFamily: F.extra, fontSize: 10, letterSpacing: 1.6, color: C.muted, marginTop: -2 },
  pens: { fontFamily: F.extra, fontSize: 8, letterSpacing: 1, color: C.dim, marginTop: 1 },

  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(30,41,59,0.9)',
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: { width: '100%', height: '100%', borderRadius: 999, backgroundColor: C.gold },

  finalBanner: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(15,23,42,0.92)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  fullTime: { fontFamily: F.extra, fontSize: 9, letterSpacing: 2.4, color: C.dim },
  winner: { fontFamily: F.italicExtra, fontSize: 24, letterSpacing: 0.6, lineHeight: 26 },
  upset: { fontFamily: F.extra, fontSize: 10, letterSpacing: 1.6, color: '#fb923c', marginTop: 1 },

  logPanel: {
    flex: 1,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    backgroundColor: 'rgba(2,6,23,0.55)',
    overflow: 'hidden',
  },
  logHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.14)',
  },
  logTitle: { fontFamily: F.extra, fontSize: 10, letterSpacing: 1.8, color: C.muted },
  logLive: { fontFamily: F.extra, fontSize: 8, letterSpacing: 1.2, color: '#fca5a5' },
  logScroll: { flex: 1 },
  logContent: { padding: 8 },
  logEmpty: { fontFamily: F.bold, fontSize: 13, color: C.dim, textAlign: 'center', marginTop: 16 },
  logLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(15,23,42,0.8)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 5,
  },
  logMinute: { width: 30, fontFamily: F.italicExtra, fontSize: 14, lineHeight: 16 },
  logBody: { flex: 1 },
  logType: { fontFamily: F.extra, fontSize: 9, letterSpacing: 1.4 },
  logText: { fontFamily: F.bold, fontSize: 13, color: '#e2e8f0', lineHeight: 16 },

  footer: { marginTop: 8 },
  footerRow: { flexDirection: 'row', gap: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalText: { fontFamily: F.bold, fontSize: 16, color: C.muted, textAlign: 'center', lineHeight: 21 },
});
