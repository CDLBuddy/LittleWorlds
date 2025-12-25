/**
 * Quality presets for different device capabilities
 */

export type QualityLevel = 'low' | 'medium' | 'high';

export interface QualityPreset {
  level: QualityLevel;
  maxDPR: number;
  shadows: boolean;
  particles: boolean;
  antialiasing: boolean;
  postProcessing: boolean;
  maxLights: number;
}

export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  low: {
    level: 'low',
    maxDPR: 1,
    shadows: false,
    particles: false,
    antialiasing: false,
    postProcessing: false,
    maxLights: 2,
  },
  medium: {
    level: 'medium',
    maxDPR: 1.5,
    shadows: true,
    particles: true,
    antialiasing: false,
    postProcessing: false,
    maxLights: 4,
  },
  high: {
    level: 'high',
    maxDPR: 2,
    shadows: true,
    particles: true,
    antialiasing: true,
    postProcessing: true,
    maxLights: 8,
  },
};

export function getAutoQualityLevel(): QualityLevel {
  // Simple heuristic based on device memory and GPU
  const memory = (performance as any).memory?.jsHeapSizeLimit || 0;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile || memory < 1e9) {
    return 'low';
  } else if (memory < 2e9) {
    return 'medium';
  }
  return 'high';
}
