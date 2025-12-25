/**
 * Device detection and capability heuristics
 */

export interface DeviceCapabilities {
  isTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  hasGyroscope: boolean;
  maxDPR: number;
  estimatedGPU: 'low' | 'medium' | 'high';
}

export function detectDeviceCapabilities(): DeviceCapabilities {
  const ua = navigator.userAgent;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobile = /iPhone|iPod|Android.*Mobile/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);

  return {
    isTouch,
    isMobile,
    isTablet,
    hasGyroscope: 'DeviceOrientationEvent' in window,
    maxDPR: isMobile ? 2 : isTablet ? 2 : 2.5,
    estimatedGPU: estimateGPUTier(),
  };
}

function estimateGPUTier(): 'low' | 'medium' | 'high' {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) return 'low';

  const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    // Simple heuristics
    if (/Intel|Iris|UHD/i.test(renderer)) return 'medium';
    if (/NVIDIA|AMD|Radeon|GeForce/i.test(renderer)) return 'high';
  }

  return 'medium';
}
