/**
 * Sound + haptics feedback. Sounds are tiny generated WAVs bundled with the app.
 */
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

const SOURCES = {
  bid: require('../../assets/sounds/bid.wav'),
  pick: require('../../assets/sounds/pick.wav'),
  sold: require('../../assets/sounds/sold.wav'),
  tick: require('../../assets/sounds/tick.wav'),
};

const cache = {};
let enabled = true;

export function setSoundEnabled(value) {
  enabled = !!value;
}

async function loadSound(name) {
  if (cache[name]) return cache[name];
  try {
    const { sound } = await Audio.Sound.createAsync(SOURCES[name], { shouldPlay: false });
    cache[name] = sound;
    return sound;
  } catch (e) {
    return null;
  }
}

export async function playSound(name) {
  if (!enabled || !SOURCES[name]) return;
  try {
    const sound = await loadSound(name);
    if (!sound) return;
    await sound.replayAsync();
  } catch (e) {
    /* ignore */
  }
}

export function tapHaptic(style = 'light') {
  const map = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
  };
  Haptics.impactAsync(map[style] || map.light).catch(() => {});
}

export function successHaptic() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function warnHaptic() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

export async function configureAudio() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
    });
  } catch (e) {
    /* ignore */
  }
}
