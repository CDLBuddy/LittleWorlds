/**
 * Player animations - idle/walk/use
 */

export enum PlayerAnimation {
  Idle = 'idle',
  Walk = 'walk',
  Use = 'use',
  PickUp = 'pickup',
}

export class AnimationController {
  private currentAnimation: PlayerAnimation = PlayerAnimation.Idle;

  play(animation: PlayerAnimation): void {
    if (this.currentAnimation === animation) return;
    
    this.currentAnimation = animation;
    // TODO: Play animation on mesh
    console.log(`Playing animation: ${animation}`);
  }

  getCurrentAnimation(): PlayerAnimation {
    return this.currentAnimation;
  }
}
