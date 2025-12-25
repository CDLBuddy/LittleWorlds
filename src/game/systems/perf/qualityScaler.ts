/**
 * Quality Scaler - cap DPR, shadows off, etc.
 */

import { Scene, Engine } from '@babylonjs/core';
import { QualityLevel, QUALITY_PRESETS } from '@game/config/qualityPresets';

export class QualityScaler {
  private engine: Engine;
  private currentQuality: QualityLevel = 'high';

  constructor(_scene: Scene, engine: Engine) {
    this.engine = engine;
  }

  setQuality(level: QualityLevel): void {
    const preset = QUALITY_PRESETS[level];
    this.currentQuality = level;

    // Apply DPR
    this.engine.setHardwareScalingLevel(1 / preset.maxDPR);

    // TODO: Apply other quality settings
    console.log(`Quality set to: ${level}`, preset);
  }

  scaleDown(): void {
    if (this.currentQuality === 'high') {
      this.setQuality('medium');
    } else if (this.currentQuality === 'medium') {
      this.setQuality('low');
    }
  }

  scaleUp(): void {
    if (this.currentQuality === 'low') {
      this.setQuality('medium');
    } else if (this.currentQuality === 'medium') {
      this.setQuality('high');
    }
  }

  getCurrentQuality(): QualityLevel {
    return this.currentQuality;
  }
}
