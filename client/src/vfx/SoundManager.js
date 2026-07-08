import { Howl, Howler } from 'howler';

class SoundManager {
  constructor() {
    this.sounds = {};
    this.missingSounds = new Set();
    this.isMuted = false;
    this.volume = 0.5;
    this.lastPlayedAt = {};
    this.throttleMs = 100;
  }

  init() {
    Howler.volume(this.volume);
  }

  play(soundId) {
    if (!soundId || this.isMuted || this.missingSounds.has(soundId)) return;

    const now = Date.now();
    if (now - (this.lastPlayedAt[soundId] || 0) < this.throttleMs) return;
    this.lastPlayedAt[soundId] = now;

    if (!this.sounds[soundId]) {
      this.sounds[soundId] = new Howl({
        src: [`/assets/sounds/${soundId}.mp3`],
        volume: 1.0,
        onloaderror: () => {
          this.missingSounds.add(soundId);
        },
      });
    }

    this.sounds[soundId].play();
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, Number(val) || 0));
    Howler.volume(this.volume);
  }

  setMuted(isMuted) {
    this.isMuted = Boolean(isMuted);
    Howler.mute(this.isMuted);
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
  }
}

export const soundManager = new SoundManager();
