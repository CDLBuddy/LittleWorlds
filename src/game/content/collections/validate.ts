// src/game/content/collections/validate.ts
/**
 * Validation for collections data (DEV only)
 */

import { COLLECTIONS } from './index';
import type { AreaTemplate } from './types';

export function validateCollections(): void {
  if (!import.meta.env.DEV) return; // Only run in dev

  console.log('[Collections] Validating area templates...');

  Object.entries(COLLECTIONS).forEach(([areaId, template]) => {
    validateAreaTemplate(areaId, template);
  });

  console.log('[Collections] ✓ Validation complete');
}

function validateAreaTemplate(areaId: string, template: AreaTemplate): void {
  const errors: string[] = [];

  // Check exactly 10 finds
  if (template.finds.length !== 10) {
    errors.push(`Must have exactly 10 finds, got ${template.finds.length}`);
  }

  // Check 2 per hiding type
  const hidingCounts = template.finds.reduce((acc, find) => {
    acc[find.hidingType] = (acc[find.hidingType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const expectedTypes = ['ground', 'tree', 'water', 'rock', 'plant'];
  expectedTypes.forEach(type => {
    const count = hidingCounts[type] || 0;
    if (count !== 2) {
      errors.push(`Must have exactly 2 '${type}' finds, got ${count}`);
    }
  });

  // Check unique IDs
  const findIds = template.finds.map(f => f.id);
  const uniqueIds = new Set(findIds);
  if (uniqueIds.size !== findIds.length) {
    errors.push('Duplicate find IDs detected');
  }

  // Check trophy and postcard exist
  if (!template.trophy.id) errors.push('Trophy missing ID');
  if (!template.postcard.id) errors.push('Postcard missing ID');

  if (errors.length > 0) {
    console.error(`[Collections] ❌ ${areaId}:`, errors);
  } else {
    console.log(`[Collections] ✓ ${areaId} valid`);
  }
}
