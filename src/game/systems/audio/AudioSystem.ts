/**
 * AudioSystem v1 - WebAudio with iOS unlock, buses, and loop management
 * iPad-safe with proper memory management
 */

export interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
}

export interface PlayOptions {
  volume?: number;
  loop?: boolean;
  fadeIn?: number; // seconds
}

export interface LoopHandle {
  stop: (fadeOut?: number) => void;
  setVolume: (volume: number) => void;
}

export class AudioSystem {
  private context: AudioContext | null = null;
  private unlocked = false;
  private bufferCache = new Map<string, AudioBuffer>();
  
  // Gain nodes for buses
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  // Active loops
  private activeLoops = new Map<symbol, { source: AudioBufferSourceNode; gain: GainNode }>();
  
  // Config
  private config: AudioConfig = {
    masterVolume: 0.7,
    musicVolume: 0.4,
    sfxVolume: 0.6,
  };

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('[AudioSystem] WebAudio not supported');
        return;
      }
      
      this.context = new AudioContextClass();
      
      // Create bus gain nodes
      this.masterGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      
      // Connect buses to master
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
      
      // Set initial volumes
      this.masterGain.gain.value = this.config.masterVolume;
      this.musicGain.gain.value = this.config.musicVolume;
      this.sfxGain.gain.value = this.config.sfxVolume;
      
      this.setupUnlock();
      
      console.log('[AudioSystem] Initialized (locked until user gesture)');
    } catch (error) {
      console.error('[AudioSystem] Init failed:', error);
    }
  }

  private setupUnlock(): void {
    if (!this.context) return;

    const unlock = () => {
      if (this.unlocked || !this.context) return;

      // Resume context + play silent buffer
      if (this.context.state === 'suspended') {
        void this.context.resume();
      }

      const buffer = this.context.createBuffer(1, 1, 22050);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);
      source.start(0);

      this.unlocked = true;
      console.log('[AudioSystem] Unlocked via user gesture');

      // Remove listeners
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('touchend', unlock);
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    };

    document.addEventListener('touchstart', unlock, { once: false });
    document.addEventListener('touchend', unlock, { once: false });
    document.addEventListener('click', unlock, { once: false });
    document.addEventListener('keydown', unlock, { once: false });
  }

  /**
   * Explicitly unlock audio (called from UI on first play button click)
   */
  unlock(): void {
    if (!this.context || this.unlocked) return;
    
    if (this.context.state === 'suspended') {
      void this.context.resume().then(() => {
        this.unlocked = true;
        console.log('[AudioSystem] Explicitly unlocked');
      }).catch(err => {
        console.warn('[AudioSystem] Resume failed:', err);
      });
    } else {
      this.unlocked = true;
    }
  }

  /**
   * Load audio file and cache decoded buffer
   */
  async loadAudio(key: string, url: string): Promise<void> {
    if (!this.context) return;
    if (this.bufferCache.has(key)) return; // Already loaded

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      
      this.bufferCache.set(key, audioBuffer);
      console.log(`[AudioSystem] Loaded: ${key}`);
    } catch (error) {
      // Suppress error traces for placeholder audio files (they're just empty stubs)
      if (error instanceof DOMException && error.name === 'EncodingError') {
        // Silent - these are placeholder files
        return;
      }
      console.error(`[AudioSystem] Failed to load ${key} from ${url}:`, error);
    }
  }

  /**
   * Play a one-shot sound effect
   */
  playSfx(key: string, options: PlayOptions = {}): void {
    if (!this.context || !this.sfxGain || !this.unlocked) return;

    const buffer = this.bufferCache.get(key);
    if (!buffer) {
      console.warn(`[AudioSystem] SFX not loaded: ${key}`);
      return;
    }

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();

    source.buffer = buffer;
    gain.gain.value = options.volume ?? 1.0;

    source.connect(gain);
    gain.connect(this.sfxGain);

    source.start(0);
  }

  /**
   * Play a looping sound (music or ambient)
   * Returns handle to stop/control the loop
   */
  playLoop(key: string, options: PlayOptions = {}): LoopHandle {
    if (!this.context || !this.musicGain) {
      // Return dummy handle if audio not available
      return {
        stop: () => {},
        setVolume: () => {},
      };
    }

    const buffer = this.bufferCache.get(key);
    if (!buffer) {
      console.warn(`[AudioSystem] Loop audio not loaded: ${key}`);
      return {
        stop: () => {},
        setVolume: () => {},
      };
    }

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();

    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = options.volume ?? 1.0;

    source.connect(gain);
    gain.connect(this.musicGain);

    // Fade in if requested
    if (options.fadeIn && options.fadeIn > 0) {
      gain.gain.setValueAtTime(0, this.context.currentTime);
      gain.gain.linearRampToValueAtTime(
        options.volume ?? 1.0,
        this.context.currentTime + options.fadeIn
      );
    }

    const loopId = Symbol('loop');
    this.activeLoops.set(loopId, { source, gain });

    source.start(0);

    return {
      stop: (fadeOut?: number) => {
        if (!this.context) return;
        
        const loop = this.activeLoops.get(loopId);
        if (!loop) return;

        if (fadeOut && fadeOut > 0) {
          loop.gain.gain.setValueAtTime(loop.gain.gain.value, this.context.currentTime);
          loop.gain.gain.linearRampToValueAtTime(0, this.context.currentTime + fadeOut);
          
          setTimeout(() => {
            loop.source.stop();
            this.activeLoops.delete(loopId);
          }, fadeOut * 1000);
        } else {
          loop.source.stop();
          this.activeLoops.delete(loopId);
        }
      },
      setVolume: (volume: number) => {
        const loop = this.activeLoops.get(loopId);
        if (loop) {
          loop.gain.gain.value = volume;
        }
      },
    };
  }

  /**
   * Set volume for a specific bus
   */
  setVolume(bus: 'master' | 'music' | 'sfx', value: number): void {
    const clampedValue = Math.max(0, Math.min(1, value));
    
    switch (bus) {
      case 'master':
        this.config.masterVolume = clampedValue;
        if (this.masterGain) this.masterGain.gain.value = clampedValue;
        break;
      case 'music':
        this.config.musicVolume = clampedValue;
        if (this.musicGain) this.musicGain.gain.value = clampedValue;
        break;
      case 'sfx':
        this.config.sfxVolume = clampedValue;
        if (this.sfxGain) this.sfxGain.gain.value = clampedValue;
        break;
    }
    
    console.log(`[AudioSystem] ${bus} volume: ${clampedValue.toFixed(2)}`);
  }

  getVolume(bus: 'master' | 'music' | 'sfx'): number {
    switch (bus) {
      case 'master': return this.config.masterVolume;
      case 'music': return this.config.musicVolume;
      case 'sfx': return this.config.sfxVolume;
    }
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  dispose(): void {
    // Stop all active loops
    this.activeLoops.forEach(loop => {
      loop.source.stop();
    });
    this.activeLoops.clear();

    // Close context
    if (this.context) {
      void this.context.close().catch(err => {
        console.warn('[AudioSystem] Context close error:', err);
      });
    }

    // Clear cache
    this.bufferCache.clear();
    
    console.log('[AudioSystem] Disposed');
  }
}
