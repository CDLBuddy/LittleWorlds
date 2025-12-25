/**
 * SFX - one-shots + randomization
 */

export interface SfxOptions {
  volume?: number;
  pitch?: number;
  pitchVariation?: number;
}

export class SfxPlayer {
  playOneShot(soundKey: string, options: SfxOptions = {}): void {
    const volume = options.volume ?? 1;
    const pitch = options.pitch ?? 1;
    const pitchVar = options.pitchVariation ?? 0;
    
    const finalPitch = pitch + (Math.random() - 0.5) * pitchVar;
    
    console.log(`Playing SFX: ${soundKey} (vol: ${volume}, pitch: ${finalPitch})`);
    // TODO: Actual audio playback
  }

  playRandomVariation(soundKeys: string[], options: SfxOptions = {}): void {
    const randomKey = soundKeys[Math.floor(Math.random() * soundKeys.length)];
    this.playOneShot(randomKey, options);
  }
}

export const sfxPlayer = new SfxPlayer();
