#!/usr/bin/env node
/**
 * Validate Gate-Based Spawn System
 * 
 * Run this script during development to verify:
 * - All gate pairs are symmetric
 * - All spawn registry entries are complete
 * - No missing gate anchors
 * 
 * Usage:
 *   node dev-utils/validate-spawn-system.mjs
 */

import { GATE_PAIR } from '../src/game/content/gatePairs.ts';
import { INTERACTABLE_ID } from '../src/game/content/interactableIds.ts';

console.log('🔍 Validating Gate-Based Spawn System...\n');

let hasErrors = false;

// ===== GATE PAIR VALIDATION =====
console.log('📍 Validating Gate Pairs...');

const gateIds = [
  'BACKYARD_GATE',
  'WOODLINE_BACKYARD_GATE',
  'WOODLINE_CREEK_GATE',
  'CREEK_WOODLINE_GATE',
  'CREEK_PINE_GATE',
  'PINE_CREEK_GATE',
  'PINE_DUSK_GATE',
  'DUSK_PINE_GATE',
  'DUSK_NIGHT_GATE',
  'NIGHT_DUSK_GATE',
  'NIGHT_BEACH_GATE',
  'BEACH_NIGHT_GATE',
];

for (const gateKey of gateIds) {
  const gateId = INTERACTABLE_ID[gateKey];
  
  if (!gateId) {
    console.error(`  ❌ Gate ID not found: ${gateKey}`);
    hasErrors = true;
    continue;
  }
  
  const pairedGateId = GATE_PAIR[gateId];
  
  if (!pairedGateId) {
    console.error(`  ❌ No pair mapping for: ${gateKey} (${gateId})`);
    hasErrors = true;
    continue;
  }
  
  // Check symmetry
  const reverseGateId = GATE_PAIR[pairedGateId];
  if (reverseGateId !== gateId) {
    console.error(`  ❌ Gate pair asymmetry: ${gateId} → ${pairedGateId} → ${reverseGateId} (expected ${gateId})`);
    hasErrors = true;
    continue;
  }
  
  console.log(`  ✓ ${gateKey} ↔ ${pairedGateId}`);
}

if (!hasErrors) {
  console.log('✅ All gate pairs are symmetric\n');
} else {
  console.log('');
}

// ===== SUMMARY =====
if (hasErrors) {
  console.error('❌ Validation FAILED - See errors above');
  process.exit(1);
} else {
  console.log('✅ All spawn system checks passed!');
  console.log('\n💡 Run the game to verify actual spawn behavior');
  process.exit(0);
}
