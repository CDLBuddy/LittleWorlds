/**
 * PlayerDebugHelper - DEV-only keyboard controls for tweaking player model scale/rotation
 * 
 * Controls:
 * - [ : Decrease scale
 * - ] : Increase scale
 * - ; : Rotate left
 * - ' : Rotate right
 * - I : Log current transform info
 */

import { Scene, Observer, KeyboardInfo, KeyboardEventTypes } from '@babylonjs/core';
import { Player } from '@game/entities/player/Player';

export class PlayerDebugHelper {
  private keyboardObserver: Observer<KeyboardInfo> | null = null;
  private player: Player | null = null;
  
  constructor(private scene: Scene) {
    this.setupKeyboardObserver();
  }
  
  public setPlayer(player: Player): void {
    this.player = player;
    console.log('[PlayerDebug] Debug helper ready. Press I for info.');
  }
  
  private setupKeyboardObserver(): void {
    this.keyboardObserver = this.scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type !== KeyboardEventTypes.KEYDOWN || !this.player) return;
      
      // Access modelRoot via any cast (debug-only hack)
      const modelRoot = (this.player as any).mesh?.getChildren()[0];
      if (!modelRoot) return;
      
      const key = kbInfo.event.key;
      
      switch (key) {
        case '[':
          // Decrease scale
          modelRoot.scaling.scaleInPlace(0.95);
          console.log('[PlayerDebug] Scale:', modelRoot.scaling.toString());
          break;
          
        case ']':
          // Increase scale
          modelRoot.scaling.scaleInPlace(1.05);
          console.log('[PlayerDebug] Scale:', modelRoot.scaling.toString());
          break;
          
        case ';':
          // Rotate left (Y-axis)
          modelRoot.rotation.y -= Math.PI / 36; // -5 degrees
          console.log('[PlayerDebug] Rotation Y:', (modelRoot.rotation.y * 180 / Math.PI).toFixed(1), '°');
          break;
          
        case "'":
          // Rotate right (Y-axis)
          modelRoot.rotation.y += Math.PI / 36; // +5 degrees
          console.log('[PlayerDebug] Rotation Y:', (modelRoot.rotation.y * 180 / Math.PI).toFixed(1), '°');
          break;
          
        case 'i':
        case 'I':
          // Log info
          this.logInfo(modelRoot);
          break;
      }
    });
  }
  
  private logInfo(modelRoot: any): void {
    const scale = modelRoot.scaling;
    const rotation = modelRoot.rotation;
    const position = modelRoot.position;
    
    console.log('[PlayerDebug] Info:');
    console.log('  Scale:', `(${scale.x.toFixed(2)}, ${scale.y.toFixed(2)}, ${scale.z.toFixed(2)})`);
    console.log('  Rotation:', `(${(rotation.x * 180 / Math.PI).toFixed(1)}°, ${(rotation.y * 180 / Math.PI).toFixed(1)}°, ${(rotation.z * 180 / Math.PI).toFixed(1)}°)`);
    console.log('  Position:', `(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
  }
  
  dispose(): void {
    if (this.keyboardObserver) {
      this.scene.onKeyboardObservable.remove(this.keyboardObserver);
      this.keyboardObserver = null;
    }
  }
}
