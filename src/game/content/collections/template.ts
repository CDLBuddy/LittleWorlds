// src/game/content/collections/template.ts
import type { AreaTemplate } from './types';

/**
 * Template helper for creating area collections
 * Ensures correct structure and defaults
 */
export function createAreaTemplate(template: AreaTemplate): AreaTemplate {
  // Validate exactly 10 finds
  if (template.finds.length !== 10) {
    console.error(`[AreaTemplate] ${template.areaId} must have exactly 10 finds, got ${template.finds.length}`);
  }

  // Validate 2 finds per hiding type
  const hidingCounts = template.finds.reduce((acc, find) => {
    acc[find.hidingType] = (acc[find.hidingType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const expectedTypes = ['ground', 'tree', 'water', 'rock', 'plant'];
  expectedTypes.forEach(type => {
    if (hidingCounts[type] !== 2) {
      console.error(`[AreaTemplate] ${template.areaId} must have exactly 2 ${type} finds, got ${hidingCounts[type] || 0}`);
    }
  });

  return template;
}
