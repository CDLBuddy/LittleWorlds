/**
 * Input System - touch + optional keyboard/gamepad
 */

import { Scene } from '@babylonjs/core';

export interface InputState {
  moveX: number;
  moveZ: number;
  interact: boolean;
  pause: boolean;
}

export class InputSystem {
  private inputState: InputState = {
    moveX: 0,
    moveZ: 0,
    interact: false,
    pause: false,
  };

  constructor(_scene: Scene) {
    this.setupInputListeners();
  }

  private setupInputListeners(): void {
    // TODO: Setup touch, keyboard, gamepad listeners
  }

  update(): InputState {
    // Reset single-frame inputs
    this.inputState.interact = false;
    this.inputState.pause = false;
    
    return { ...this.inputState };
  }

  dispose(): void {
    // TODO: Remove listeners
  }
}
