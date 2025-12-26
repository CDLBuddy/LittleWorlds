/**
 * Debug helpers for companion model scaling and rotation
 * DEV only - not included in production builds
 */

import type { Companion } from '@game/entities/companion/Companion';

export class CompanionDebugHelper {
  private companion: Companion | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  
  constructor() {
    if (import.meta.env.PROD) return;
    
    this.setupKeyboardControls();
    console.log('[CompanionDebug] Controls active:');
    console.log('  [ / ] - Decrease/Increase scale (0.1)');
    console.log('  ; / \' - Rotate left/right (5°)');
    console.log('  i - Log current transform');
  }
  
  setCompanion(companion: Companion): void {
    this.companion = companion;
    console.log('[CompanionDebug] Companion set for debugging');
  }
  
  private setupKeyboardControls(): void {
    this.keyHandler = (e: KeyboardEvent) => {
      if (!this.companion) return;
      
      const modelRoot = (this.companion as any).modelRoot;
      if (!modelRoot) {
        console.warn('[CompanionDebug] Model not loaded yet');
        return;
      }
      
      switch (e.key) {
        case '[':
          // Decrease scale
          modelRoot.scaling.scaleInPlace(0.9);
          this.logTransform(modelRoot);
          break;
          
        case ']':
          // Increase scale
          modelRoot.scaling.scaleInPlace(1.1);
          this.logTransform(modelRoot);
          break;
          
        case ';':
          // Rotate left
          modelRoot.rotation.y -= Math.PI / 36; // 5 degrees
          this.logTransform(modelRoot);
          break;
          
        case "'":
          // Rotate right
          modelRoot.rotation.y += Math.PI / 36; // 5 degrees
          this.logTransform(modelRoot);
          break;
          
        case 'i':
        case 'I':
          // Log info
          this.logTransform(modelRoot);
          break;
      }
    };
    
    window.addEventListener('keydown', this.keyHandler);
  }
  
  private logTransform(node: any): void {
    console.log('[CompanionDebug] Transform:', {
      scale: node.scaling.toString(),
      rotation: `(${node.rotation.x.toFixed(2)}, ${node.rotation.y.toFixed(2)}, ${node.rotation.z.toFixed(2)})`,
      rotationDeg: `${(node.rotation.y * 180 / Math.PI).toFixed(1)}°`,
      position: node.position.toString()
    });
  }
  
  dispose(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    this.companion = null;
  }
}
