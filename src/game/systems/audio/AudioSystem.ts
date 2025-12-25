/**
 * Audio System - WebAudio graph, buses, volumes
 */

export interface AudioBus {
  name: string;
  volume: number;
  muted: boolean;
}

export class AudioSystem {
  private buses = new Map<string, AudioBus>();

  constructor() {
    this.setupBuses();
  }

  private setupBuses(): void {
    this.buses.set('master', { name: 'master', volume: 1, muted: false });
    this.buses.set('music', { name: 'music', volume: 0.5, muted: false });
    this.buses.set('sfx', { name: 'sfx', volume: 0.8, muted: false });
    this.buses.set('ambient', { name: 'ambient', volume: 0.6, muted: false });
  }

  setBusVolume(busName: string, volume: number): void {
    const bus = this.buses.get(busName);
    if (bus) {
      bus.volume = Math.max(0, Math.min(1, volume));
    }
  }

  getBusVolume(busName: string): number {
    return this.buses.get(busName)?.volume ?? 1;
  }

  muteBus(busName: string, muted: boolean): void {
    const bus = this.buses.get(busName);
    if (bus) {
      bus.muted = muted;
    }
  }

  getEffectiveVolume(busName: string): number {
    const bus = this.buses.get(busName);
    if (!bus || bus.muted) return 0;
    
    const masterBus = this.buses.get('master');
    const masterVol = masterBus && !masterBus.muted ? masterBus.volume : 0;
    
    return bus.volume * masterVol;
  }
}
