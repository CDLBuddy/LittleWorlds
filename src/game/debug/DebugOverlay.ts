/**
 * Debug Overlay - FPS counter, wake state, player position (dev only)
 */

import { Vector3 } from '@babylonjs/core';

export class DebugOverlay {
  private container: HTMLDivElement;
  private fpsElement: HTMLDivElement;
  private positionElement: HTMLDivElement;
  private wakeStateElement: HTMLDivElement;
  private fpsHistory: number[] = [];
  private readonly FPS_SAMPLE_SIZE = 30;

  constructor() {
    // Create container
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: #0f0;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      padding: 10px;
      border-radius: 5px;
      pointer-events: none;
      z-index: 1000;
    `;

    // FPS display
    this.fpsElement = document.createElement('div');
    this.fpsElement.textContent = 'FPS: --';
    this.container.appendChild(this.fpsElement);

    // Position display
    this.positionElement = document.createElement('div');
    this.positionElement.textContent = 'Pos: (0, 0, 0)';
    this.container.appendChild(this.positionElement);

    // Wake state display
    this.wakeStateElement = document.createElement('div');
    this.wakeStateElement.textContent = 'Wake: none';
    this.container.appendChild(this.wakeStateElement);

    document.body.appendChild(this.container);
  }

  updateFPS(fps: number) {
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.FPS_SAMPLE_SIZE) {
      this.fpsHistory.shift();
    }

    const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    const color = avgFps >= 55 ? '#0f0' : avgFps >= 30 ? '#ff0' : '#f00';
    this.fpsElement.innerHTML = `FPS: <span style="color: ${color}">${Math.round(avgFps)}</span>`;
  }

  updatePosition(position: Vector3) {
    this.positionElement.textContent = 
      `Pos: (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`;
  }

  updateWakeState(count: number, nearestId?: string) {
    if (count === 0) {
      this.wakeStateElement.textContent = 'Wake: none';
    } else {
      this.wakeStateElement.textContent = `Wake: ${count} active${nearestId ? ` (${nearestId})` : ''}`;
    }
  }

  dispose() {
    this.container.remove();
  }
}
