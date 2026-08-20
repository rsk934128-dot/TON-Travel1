/**
 * Audio Notification Service for Price Alerts
 * Uses Web Audio API to synthesize subtle, harmonic, and pleasant chime notifications
 * when price alert events are triggered, with mute/unmute toggle controls.
 */

const SOUND_STORAGE_KEY = 'tontravel_price_alert_sound_muted';

let isMutedState: boolean = (() => {
  try {
    const saved = localStorage.getItem(SOUND_STORAGE_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
    // Check config if available
    const configSaved = localStorage.getItem('tontravel_price_alert_config');
    if (configSaved) {
      const parsed = JSON.parse(configSaved);
      if (typeof parsed.soundEnabled === 'boolean') {
        return !parsed.soundEnabled;
      }
    }
    return false; // Default: sound is enabled (not muted)
  } catch {
    return false;
  }
})();

type SoundListener = (muted: boolean) => void;
const listeners = new Set<SoundListener>();

export function isSoundMuted(): boolean {
  return isMutedState;
}

export function setSoundMuted(muted: boolean): void {
  isMutedState = muted;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, muted ? 'true' : 'false');
    // Also sync to price alert config if present
    const configSaved = localStorage.getItem('tontravel_price_alert_config');
    if (configSaved) {
      const parsed = JSON.parse(configSaved);
      parsed.soundEnabled = !muted;
      localStorage.setItem('tontravel_price_alert_config', JSON.stringify(parsed));
    }
  } catch (e) {
    console.error('Error saving sound mute state:', e);
  }
  listeners.forEach((fn) => {
    try {
      fn(isMutedState);
    } catch {}
  });
}

export function toggleSoundMute(): boolean {
  const next = !isMutedState;
  setSoundMuted(next);
  return next;
}

export function subscribeToSoundMute(listener: SoundListener): () => void {
  listeners.add(listener);
  listener(isMutedState);
  return () => {
    listeners.delete(listener);
  };
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    console.warn('Web Audio API not supported or blocked:', e);
    return null;
  }
}

/**
 * Synthesizes a subtle, harmonic, crystal-clear chime for price alert triggers
 */
export function playPriceAlertChime(
  triggerType: 'HIGH_TARGET' | 'LOW_DIP' | 'VOLATILITY_THRESHOLD' | 'TEST' | string = 'TEST'
): void {
  if (isMutedState) {
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Define harmonic frequencies and timings based on trigger archetype
    let notes: { freq: number; start: number; duration: number; gain: number; type?: OscillatorType }[] = [];

    if (triggerType === 'HIGH_TARGET') {
      // Upward, optimistic crystalline chime (G5 -> B5 -> E6)
      notes = [
        { freq: 783.99, start: 0.0, duration: 0.28, gain: 0.12, type: 'sine' },
        { freq: 987.77, start: 0.08, duration: 0.32, gain: 0.14, type: 'sine' },
        { freq: 1318.51, start: 0.18, duration: 0.55, gain: 0.16, type: 'sine' }
      ];
    } else if (triggerType === 'LOW_DIP') {
      // Warm, bell-like opportunity chime (E5 -> A5 -> C#6)
      notes = [
        { freq: 659.25, start: 0.0, duration: 0.3, gain: 0.13, type: 'sine' },
        { freq: 880.00, start: 0.09, duration: 0.35, gain: 0.14, type: 'sine' },
        { freq: 1108.73, start: 0.18, duration: 0.6, gain: 0.15, type: 'sine' }
      ];
    } else if (triggerType === 'VOLATILITY_THRESHOLD') {
      // Crisp dual ping harmonic (A5 -> E6)
      notes = [
        { freq: 880.00, start: 0.0, duration: 0.25, gain: 0.13, type: 'sine' },
        { freq: 1318.51, start: 0.1, duration: 0.45, gain: 0.15, type: 'sine' }
      ];
    } else {
      // Subtle elegant notification bell (C6 -> G6)
      notes = [
        { freq: 1046.50, start: 0.0, duration: 0.22, gain: 0.12, type: 'sine' },
        { freq: 1567.98, start: 0.09, duration: 0.48, gain: 0.14, type: 'sine' }
      ];
    }

    // Play synthesized notes with smooth exponential decay & lowpass filter
    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = note.type || 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      // Lowpass filter to ensure sound is warm, soft, and never harsh
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now + note.start);

      // Natural envelope: instant soft attack, exponential decay
      const startTime = now + note.start;
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(note.gain, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + note.duration);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + note.duration + 0.05);
    });
  } catch (err) {
    console.warn('Audio chime playback error:', err);
  }
}

/**
 * Preview current sound even if muted, for testing
 */
export function playPreviewChime(triggerType: string = 'TEST'): void {
  const wasMuted = isMutedState;
  isMutedState = false;
  playPriceAlertChime(triggerType);
  isMutedState = wasMuted;
}
