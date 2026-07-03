import { Howl, Howler } from 'howler';

class SoundManager {
  constructor() {
    this.sounds = {};
    this.isMuted = false;
    this.volume = 0.5;
  }

  init() {
    Howler.volume(this.volume);
    // Chuẩn bị các placeholder/tên file
    // Sẽ được load lazy hoặc preload ở đây
  }

  play(soundId) {
    if (this.isMuted) return;

    if (!this.sounds[soundId]) {
      // Lazy load sound nếu chưa có. 
      // Do chưa có asset thật, ta thử load file ảo, Howler sẽ tự im lặng nếu 404
      this.sounds[soundId] = new Howl({
        src: [`/assets/sounds/${soundId}.mp3`],
        volume: 1.0,
        onloaderror: () => {
          // Bỏ qua lỗi 404 vì chúng ta chưa có asset thật
          console.warn(`[SoundManager] Missing asset: ${soundId}.mp3`);
        }
      });
    }

    this.sounds[soundId].play();
  }

  setVolume(val) {
    this.volume = val;
    Howler.volume(val);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    Howler.mute(this.isMuted);
  }
}

export const soundManager = new SoundManager();
