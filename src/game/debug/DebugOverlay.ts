/**
 * Debug Overlay - FPS counter, wake state, player position, perf metrics (dev only)
 */

import { Vector3, Scene } from '@babylonjs/core';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { snapshotPerf } from './perfSnapshot';

export class DebugOverlay {
  private container: HTMLDivElement;
  private fpsElement: HTMLDivElement;
  private positionElement: HTMLDivElement;
  private wakeStateElement: HTMLDivElement;
  private perfElement: HTMLDivElement;
  private fpsHistory: number[] = [];
  private readonly FPS_SAMPLE_SIZE = 30;
  private scene: Scene | null = null;
  private playerMesh: AbstractMesh | null = null;
  private perfUpdateTimer: ReturnType<typeof setInterval> | null = null;

  constructor(scene?: Scene) {
    this.scene = scene || null;
    
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

    // Performance metrics display
    this.perfElement = document.createElement('div');
    this.perfElement.style.marginTop = '8px';
    this.perfElement.style.borderTop = '1px solid #0f0';
    this.perfElement.style.paddingTop = '8px';
    this.perfElement.innerHTML = '<div>Perf: --</div>';
    this.container.appendChild(this.perfElement);

    document.body.appendChild(this.container);

    // Start performance snapshot updates (every 1 second)
    if (this.scene) {
      this.perfUpdateTimer = setInterval(() => this.updatePerfMetrics(), 1000);
    }
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

  setPlayerMesh(mesh: AbstractMesh) {
    this.playerMesh = mesh;
  }

  private updatePerfMetrics() {
    if (!this.scene) return;

    const perf = snapshotPerf(this.scene, this.playerMesh || undefined);
    const meshColor = perf.meshesActive > 200 ? '#f00' : perf.meshesActive > 100 ? '#ff0' : '#0f0';
    
    this.perfElement.innerHTML = `
      <div>Meshes: <span style="color: ${meshColor}">${perf.meshesRendered}</span>/${perf.meshesActive} (${perf.instanceCount} inst)</div>
      <div>Materials: ${perf.materials} | Textures: ${perf.textures}</div>
    `;
  }

  dispose() {
    if (this.perfUpdateTimer) {
      clearInterval(this.perfUpdateTimer);
      this.perfUpdateTimer = null;
    }
    this.container.remove();
  }
}
