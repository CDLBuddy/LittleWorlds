/**
 * Phase 2.7.7: Switch Debug Overlay
 * 
 * Real-time visualization of character switch state for catching desync bugs
 */

import type { TaskSystem } from '@game/systems/tasks/TaskSystem';
import type { ProgressionSystem } from '@game/systems/progression/ProgressionSystem';
import type { WorldResult } from '@game/worlds/types';

export class SwitchDebugOverlay {
  private container: HTMLDivElement | null = null;
  
  constructor() {
    if (!import.meta.env.DEV) return;
    
    this.container = document.createElement('div');
    this.container.id = 'switch-debug-overlay';
    this.container.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.85);
      color: #0f0;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #0f0;
      z-index: 9999;
      pointer-events: none;
      min-width: 280px;
      box-shadow: 0 4px 8px rgba(0, 255, 0, 0.2);
    `;
    document.body.appendChild(this.container);
  }
  
  update(
    taskSystem: TaskSystem,
    world: WorldResult,
    progressionSystem: ProgressionSystem
  ): void {
    if (!import.meta.env.DEV || !this.container) return;
    
    try {
      const activePlayer = world.getActivePlayer();
      const activeRole = activePlayer.getRoleId();
      const activeMesh = world.getActiveMesh();
      const inventory = taskSystem.getInventory();
      const taskSystemRole = taskSystem.getCurrentRole();
      const progressionSystemRole = progressionSystem.getRoleId();
      const currentStep = taskSystem.getCurrentStep();
      
      // Check for desyncs
      const desyncs: string[] = [];
      if (taskSystemRole !== activeRole) {
        desyncs.push(`TaskSystem role mismatch (${taskSystemRole} ≠ ${activeRole})`);
      }
      if (progressionSystemRole !== activeRole) {
        desyncs.push(`ProgressionSystem role mismatch (${progressionSystemRole} ≠ ${activeRole})`);
      }
      
      const desyncStatus = desyncs.length > 0 
        ? `<div style="color:#ff0000;font-weight:bold;">⚠ DESYNC DETECTED</div>${desyncs.map(d => `<div style="color:#ff6666;">• ${d}</div>`).join('')}`
        : `<div style="color:#0f0;">✓ All Systems Synchronized</div>`;
      
      this.container.innerHTML = `
        <div style="font-weight:bold;color:#0ff;margin-bottom:8px;border-bottom:1px solid #0ff;padding-bottom:4px;">
          🔍 Switch Debug (F3)
        </div>
        ${desyncStatus}
        <div style="margin-top:8px;line-height:1.6;">
          <div><strong>Active Role:</strong> <span style="color:#ff0;">${activeRole}</span></div>
          <div><strong>Player Mesh:</strong> ${activeMesh.name}</div>
          <div><strong>Boy Active:</strong> ${world.boyPlayer.isActive ? '✓' : '✗'}</div>
          <div><strong>Girl Active:</strong> ${world.girlPlayer.isActive ? '✓' : '✗'}</div>
          <div style="margin-top:6px;border-top:1px dashed #0f0;padding-top:6px;">
            <strong>Inventory:</strong> ${inventory.length} items
          </div>
          <div><strong>Current Step:</strong> ${currentStep ? currentStep.id : '<span style="color:#888;">none</span>'}</div>
          <div style="margin-top:6px;border-top:1px dashed #0f0;padding-top:6px;font-size:10px;color:#888;">
            <div>TaskSystem: ${taskSystemRole}</div>
            <div>ProgressionSystem: ${progressionSystemRole}</div>
          </div>
        </div>
      `;
    } catch (error) {
      if (this.container) {
        this.container.innerHTML = `
          <div style="color:#ff0000;">
            <strong>⚠ Error updating overlay</strong><br/>
            ${error instanceof Error ? error.message : 'Unknown error'}
          </div>
        `;
      }
    }
  }
  
  toggle(): void {
    if (!this.container) return;
    this.container.style.display = this.container.style.display === 'none' ? 'block' : 'none';
  }
  
  dispose(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }
}
