/**
 * WebAudio wrappers with iOS unlock flow
 */

export class AudioManager {
  private context: AudioContext;
  private unlocked = false;
  private sounds = new Map<string, AudioBuffer>();

  constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.setupUnlock();
  }

  private setupUnlock(): void {
    const unlock = () => {
      if (this.unlocked) return;

      // Create empty buffer and play it
      const buffer = this.context.createBuffer(1, 1, 22050);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);
      source.start(0);

      this.unlocked = true;

      // Remove event listeners
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('touchend', unlock);
      document.removeEventListener('click', unlock);
    };

    document.addEventListener('touchstart', unlock);
    document.addEventListener('touchend', unlock);
    document.addEventListener('click', unlock);
  }

  async loadSound(key: string, url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.sounds.set(key, audioBuffer);
    } catch (error) {
      console.error(`Failed to load sound: ${url}`, error);
    }
  }

  playSound(key: string, volume = 1): void {
    const buffer = this.sounds.get(key);
    if (!buffer) {
      console.warn(`Sound not loaded: ${key}`);
      return;
    }

    const source = this.context.createBufferSource();
    const gainNode = this.context.createGain();

    source.buffer = buffer;
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.context.destination);

    source.start(0);
  }

  dispose(): void {
    this.context.close();
    this.sounds.clear();
  }
}
