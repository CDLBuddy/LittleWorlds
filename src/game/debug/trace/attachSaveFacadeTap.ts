/**
 * attachSaveFacadeTap - DEV-only tap for saveFacade to log all save writes
 * 
 * Logs every save write with:
 * - Method name (syncInventory, markTaskComplete, etc.)
 * - roleId parameter
 * - Payload summary
 * - Call stack (truncated, for identifying caller)
 * 
 * Phase 2.9: Added panic rules to detect role violations outside of switch window
 */

import { trace } from './trace';
import { captureSnapshot } from './snapshot.js';
import { switchContext } from '../../systems/characters/SwitchContext.js';

type SaveFacadeType = {
  syncInventory: (roleId: 'boy' | 'girl', inventory: string[]) => unknown;
  markTaskComplete: (roleId: 'boy' | 'girl', taskId: string) => unknown;
  syncLastArea: (roleId: 'boy' | 'girl', areaId: string) => unknown;
  setInventory: (roleId: 'boy' | 'girl', inventory: string[]) => unknown;
  markAreaComplete: (roleId: 'boy' | 'girl', areaId: string, nextAreaId?: string) => unknown;
  setLastSelectedRole: (roleId: 'boy' | 'girl') => unknown;
};

/**
 * Attach taps to saveFacade methods to log all writes
 */
export function attachSaveFacadeTap(saveFacade: SaveFacadeType): void {
  if (!import.meta.env.DEV) return;

  // Wrap syncInventory
  const originalSyncInventory = saveFacade.syncInventory.bind(saveFacade);
  saveFacade.syncInventory = function (roleId: 'boy' | 'girl', inventory: string[]) {
    const stack = captureStack('syncInventory');
    const snapshot = captureSnapshot();
    
    // Check for role mismatch
    const mismatch = snapshot.taskRole !== roleId || snapshot.autosaveRole !== roleId;
    
    // PANIC RULE 1: If mismatch AND not switching → corruption in progress! (Phase 2.9)
    if (mismatch && !switchContext.isSwitching()) {
      trace.error('save', `🔥🔥🔥 syncInventory ROLE CORRUPTION DETECTED (NOT SWITCHING)`, {
        paramRoleId: roleId,
        inventoryCount: inventory.length,
        snapshot,
        stack,
        switchSeq: switchContext.getSeq(),
      });
      // Optional: throw to halt execution
      // throw new Error(`Role corruption: syncInventory(${roleId}) called when systems are ${snapshot.taskRole}/${snapshot.autosaveRole}`);
    } else if (mismatch) {
      // Mismatch during switch is expected
      trace.info('save', `syncInventory(${roleId}, ${inventory.length} items) [SWITCHING - EXPECTED MISMATCH]`, {
        roleId,
        inventoryCount: inventory.length,
        snapshot,
        stack,
        switchSeq: switchContext.getSeq(),
      });
    } else {
      trace.info('save', `syncInventory(${roleId}, ${inventory.length} items)`, {
        roleId,
        inventoryCount: inventory.length,
        snapshot,
        stack,
      });
    }

    return originalSyncInventory(roleId, inventory);
  };

  // Wrap markTaskComplete
  const originalMarkTaskComplete = saveFacade.markTaskComplete.bind(saveFacade);
  saveFacade.markTaskComplete = function (roleId: 'boy' | 'girl', taskId: string) {
    const stack = captureStack('markTaskComplete');
    const snapshot = captureSnapshot();
    
    // Check for role mismatch
    const mismatch = snapshot.progressRole !== roleId;
    
    // PANIC RULE 2: If mismatch AND not switching → corruption in progress! (Phase 2.9)
    if (mismatch && !switchContext.isSwitching()) {
      trace.error('save', `🔥🔥🔥 markTaskComplete ROLE CORRUPTION DETECTED (NOT SWITCHING)`, {
        paramRoleId: roleId,
        taskId,
        snapshot,
        stack,
        switchSeq: switchContext.getSeq(),
      });
      // Optional: throw to halt execution
      // throw new Error(`Role corruption: markTaskComplete(${roleId}, ${taskId}) called when progression is ${snapshot.progressRole}`);
    } else if (mismatch) {
      // Mismatch during switch is expected
      trace.info('save', `markTaskComplete(${roleId}, ${taskId}) [SWITCHING - EXPECTED MISMATCH]`, {
        roleId,
        taskId,
        snapshot,
        stack,
        switchSeq: switchContext.getSeq(),
      });
    } else {
      trace.info('save', `markTaskComplete(${roleId}, ${taskId})`, {
        roleId,
        taskId,
        snapshot,
        stack,
      });
    }

    return originalMarkTaskComplete(roleId, taskId);
  };

  // Wrap syncLastArea
  const originalSyncLastArea = saveFacade.syncLastArea.bind(saveFacade);
  saveFacade.syncLastArea = function (roleId: 'boy' | 'girl', areaId: string) {
    const stack = captureStack('syncLastArea');
    const snapshot = captureSnapshot();
    
    trace.info('save', `syncLastArea(${roleId}, ${areaId})`, {
      roleId,
      areaId,
      snapshot,
      stack,
    });

    return originalSyncLastArea(roleId, areaId);
  };

  // Wrap setInventory
  const originalSetInventory = saveFacade.setInventory.bind(saveFacade);
  saveFacade.setInventory = function (roleId: 'boy' | 'girl', inventory: string[]) {
    const stack = captureStack('setInventory');
    const snapshot = captureSnapshot();
    
    trace.info('save', `setInventory(${roleId}, ${inventory.length} items)`, {
      roleId,
      inventoryCount: inventory.length,
      snapshot,
      stack,
    });

    return originalSetInventory(roleId, inventory);
  };

  // Wrap markAreaComplete
  const originalMarkAreaComplete = saveFacade.markAreaComplete.bind(saveFacade);
  saveFacade.markAreaComplete = function (roleId: 'boy' | 'girl', areaId: string, nextAreaId?: string) {
    const stack = captureStack('markAreaComplete');
    const snapshot = captureSnapshot();
    
    trace.info('save', `markAreaComplete(${roleId}, ${areaId} → ${nextAreaId ?? 'none'})`, {
      roleId,
      areaId,
      nextAreaId,
      snapshot,
      stack,
    });

    return originalMarkAreaComplete(roleId, areaId, nextAreaId);
  };

  // Wrap setLastSelectedRole
  const originalSetLastSelectedRole = saveFacade.setLastSelectedRole.bind(saveFacade);
  saveFacade.setLastSelectedRole = function (roleId: 'boy' | 'girl') {
    const stack = captureStack('setLastSelectedRole');
    const snapshot = captureSnapshot();
    
    trace.info('save', `setLastSelectedRole(${roleId})`, {
      roleId,
      snapshot,
      stack,
    });

    return originalSetLastSelectedRole(roleId);
  };

  //console.log('[attachSaveFacadeTap] saveFacade taps attached');
}

/**
 * Capture a truncated stack trace for caller identification
 */
function captureStack(_methodName: string): string {
  const stack = new Error().stack || '';
  const lines = stack.split('\n');
  
  // Find the line after this function and the tap wrapper
  const relevantLines = lines.slice(3, 6); // Skip Error, captureStack, wrapper
  
  return relevantLines
    .map(line => line.trim())
    .filter(line => !line.includes('attachSaveFacadeTap'))
    .join(' → ');
}
