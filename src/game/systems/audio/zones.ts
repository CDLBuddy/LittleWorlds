/**
 * Audio zones - distance-based ambience (creek/fire)
 */

import { Vector3 } from '@babylonjs/core';

export interface AudioZone {
  id: string;
  position: Vector3;
  radius: number;
  soundKey: string;
  maxVolume: number;
}

export class AudioZoneManager {
  private zones: AudioZone[] = [];

  addZone(zone: AudioZone): void {
    this.zones.push(zone);
  }

  removeZone(id: string): void {
    this.zones = this.zones.filter((z) => z.id !== id);
  }

  getZoneVolume(zoneId: string, listenerPosition: Vector3): number {
    const zone = this.zones.find((z) => z.id === zoneId);
    if (!zone) return 0;

    const distance = Vector3.Distance(listenerPosition, zone.position);
    
    if (distance > zone.radius) return 0;
    
    const falloff = 1 - distance / zone.radius;
    return falloff * zone.maxVolume;
  }

  update(listenerPosition: Vector3): Map<string, number> {
    const volumes = new Map<string, number>();
    
    this.zones.forEach((zone) => {
      const volume = this.getZoneVolume(zone.id, listenerPosition);
      if (volume > 0) {
        volumes.set(zone.soundKey, Math.max(volumes.get(zone.soundKey) ?? 0, volume));
      }
    });
    
    return volumes;
  }
}
