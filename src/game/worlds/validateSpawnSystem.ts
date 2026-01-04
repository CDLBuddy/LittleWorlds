/**
 * Validation utilities for gate-based spawn system
 * Run these checks during development to ensure integrity
 */

import { validateGatePairs } from '../content/gatePairs';
import { validateSpawnRegistry } from './spawnRegistry';

/**
 * Run all spawn system validations
 * Call this during development or in a test
 */
export function validateSpawnSystem(): void {
  // console.log('[SpawnValidation] Running spawn system validation...');
  
  // Validate gate pairs
  const gateResult = validateGatePairs();
  if (!gateResult.valid) {
    console.error('[SpawnValidation] ❌ Gate pair validation FAILED:');
    gateResult.errors.forEach(err => console.error(`  - ${err}`));
  } // else { console.log('[SpawnValidation] ✓ Gate pairs valid'); }
  
  // Validate spawn registry
  const spawnResult = validateSpawnRegistry();
  if (!spawnResult.valid) {
    console.error('[SpawnValidation] ❌ Spawn registry validation FAILED:');
    spawnResult.errors.forEach(err => console.error(`  - ${err}`));
  } // else { console.log('[SpawnValidation] ✓ Spawn registry valid'); }
  
  // Summary
  const allValid = gateResult.valid && spawnResult.valid;
  if (allValid) {
    // console.log('[SpawnValidation] ✅ All spawn system checks passed!');
  } else {
    console.error('[SpawnValidation] ❌ Spawn system validation failed. See errors above.');
  }
  
  return;
}
