/**
 * Spawn State - Pending Spawn Management
 * 
 * Module-level state to carry spawn information across world transitions.
 * Used during the brief window between area request and world creation.
 * 
 * Flow:
 *   1. Gate interaction triggers area request with fromGateId
 *   2. GameApp computes entryGateId and calls setPendingSpawn()
 *   3. World factory calls consumePendingSpawn() to get entry gate
 *   4. World uses entryGateId to look up spawn point in registry
 */

import type { AreaId } from '../content/areas';
import type { InteractableId } from '../content/interactableIds';

/**
 * Pending spawn information
 */
export interface PendingSpawn {
  toArea: AreaId;
  entryGateId?: InteractableId;  // Optional: undefined means default spawn
}

/**
 * Module-level pending spawn state
 * Cleared after consumption
 */
let pendingSpawn: PendingSpawn | null = null;

/**
 * Set pending spawn information before world transition
 * 
 * @param spawn - Area and optional entry gate ID
 */
export function setPendingSpawn(spawn: PendingSpawn): void {
  pendingSpawn = spawn;
  console.log('[SpawnState] Pending spawn set:', spawn);
}

/**
 * Consume pending spawn information and clear state
 * Should be called by world factories immediately after creation
 * 
 * @returns Pending spawn info, or null if none set
 */
export function consumePendingSpawn(): PendingSpawn | null {
  const spawn = pendingSpawn;
  pendingSpawn = null;  // Clear after consumption
  
  if (spawn) {
    console.log('[SpawnState] Pending spawn consumed:', spawn);
  }
  
  return spawn;
}

/**
 * Get pending spawn without consuming (for debugging)
 */
export function peekPendingSpawn(): PendingSpawn | null {
  return pendingSpawn;
}

/**
 * Clear pending spawn without consuming (for cleanup/reset)
 */
export function clearPendingSpawn(): void {
  pendingSpawn = null;
  console.log('[SpawnState] Pending spawn cleared');
}
