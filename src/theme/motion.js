/** Shared motion tokens: durations in ms and cubic-bezier control points. */

export const MOTION = {
  duration: {
    micro: 120,
    small: 220,
    medium: 380,
    large: 560,
    hero: 800,
    reel: 1900,
  },
  easing: {
    standard: [0.2, 0, 0, 1],
    emphasized: [0.05, 0.7, 0.1, 1],
    overshoot: [0.34, 1.56, 0.64, 1],
    linear: [0, 0, 1, 1],
  },
  stagger: 60,
};

export function motionOn(settings) {
  if (!settings) return true;
  return settings.motion !== 'lite';
}
