#!/usr/bin/env node
/**
 * Content Validation Script
 * Validates areas, tasks, items, interactables, and world manifests
 * Run with: npm run validate:content
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function success(msg) {
  console.log(`${colors.green}✅${colors.reset} ${msg}`);
}

function warn(msg) {
  console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`);
}

function error(msg) {
  console.log(`${colors.red}❌${colors.reset} ${msg}`);
}

function info(msg) {
  console.log(`${colors.cyan}ℹ${colors.reset}  ${msg}`);
}

// Load content files dynamically
async function loadContentModule(path) {
  const modulePath = `file:///${join(projectRoot, path).replace(/\\/g, '/')}`;
  try {
    return await import(modulePath);
  } catch (err) {
    error(`Failed to load module: ${path}`);
    console.error(err);
    process.exitCode = 1;
    return null;
  }
}

async function main() {
  console.log(`\n${colors.cyan}=== Content Validation ===${colors.reset}\n`);

  let hasErrors = false;
  let hasWarnings = false;

  // Load content modules
  info('Loading content modules...');
  const areas = await loadContentModule('src/game/content/areas.ts');
  const tasks = await loadContentModule('src/game/content/tasks.ts');
  const items = await loadContentModule('src/game/content/items.ts');
  const interactableIds = await loadContentModule('src/game/content/interactableIds.ts');
  const worldManifest = await loadContentModule('src/game/worlds/worldManifest.ts');

  if (!areas || !tasks || !items || !interactableIds || !worldManifest) {
    error('Failed to load required modules');
    process.exit(1);
  }

  const { AREAS } = areas;
  const { TASKS_BY_ID } = tasks;
  const { ITEMS } = items;
  const { ALL_INTERACTABLE_IDS } = interactableIds;
  const { WORLD_MANIFESTS } = worldManifest;

  // === VALIDATE AREAS ===
  console.log(`\n${colors.cyan}--- Validating Areas ---${colors.reset}`);

  for (const [areaId, area] of Object.entries(AREAS)) {
    // Check tasksByRole exists
    if (!area.tasksByRole) {
      error(`Area '${areaId}' missing tasksByRole`);
      hasErrors = true;
      continue;
    }

    // Check boy and girl keys exist
    if (!area.tasksByRole.boy) {
      error(`Area '${areaId}' missing tasksByRole.boy`);
      hasErrors = true;
    }
    if (!area.tasksByRole.girl) {
      error(`Area '${areaId}' missing tasksByRole.girl`);
      hasErrors = true;
    }

    // Validate all task IDs exist
    for (const role of ['boy', 'girl']) {
      const taskIds = area.tasksByRole[role] || [];
      for (const taskId of taskIds) {
        if (!TASKS_BY_ID[taskId]) {
          error(`Area '${areaId}' references non-existent task: '${taskId}' (role: ${role})`);
          hasErrors = true;
        }
      }
    }
  }

  if (!hasErrors) {
    success('All areas valid');
  }

  // === VALIDATE TASKS ===
  console.log(`\n${colors.cyan}--- Validating Tasks ---${colors.reset}`);

  const referencedTasks = new Set();
  for (const area of Object.values(AREAS)) {
    if (area.tasksByRole) {
      [...(area.tasksByRole.boy || []), ...(area.tasksByRole.girl || [])].forEach(id => referencedTasks.add(id));
    }
  }

  for (const [taskId, task] of Object.entries(TASKS_BY_ID)) {
    // Check if task is referenced by any area
    if (!referencedTasks.has(taskId)) {
      warn(`Task '${taskId}' is defined but not used in any area`);
      hasWarnings = true;
    }

    // Validate steps
    if (!task.steps || task.steps.length === 0) {
      error(`Task '${taskId}' has no steps`);
      hasErrors = true;
      continue;
    }

    for (const step of task.steps) {
      // Validate targetId is a known interactable
      if (!ALL_INTERACTABLE_IDS.includes(step.targetId)) {
        error(`Task '${taskId}' step '${step.id}' uses unknown targetId: '${step.targetId}'`);
        hasErrors = true;
      }

      // Validate requiresItems
      if (step.requiresItems) {
        for (const itemId of step.requiresItems) {
          if (!ITEMS[itemId]) {
            error(`Task '${taskId}' step '${step.id}' requires unknown item: '${itemId}'`);
            hasErrors = true;
          }
        }
      }

      // Validate grantsItems
      if (step.grantsItems) {
        for (const itemId of step.grantsItems) {
          if (!ITEMS[itemId]) {
            error(`Task '${taskId}' step '${step.id}' grants unknown item: '${itemId}'`);
            hasErrors = true;
          }
        }
      }

      // Validate consumesItems
      if (step.consumesItems) {
        for (const itemId of step.consumesItems) {
          if (!ITEMS[itemId]) {
            error(`Task '${taskId}' step '${step.id}' consumes unknown item: '${itemId}'`);
            hasErrors = true;
          }
        }
      }
    }
  }

  if (!hasErrors) {
    success('All tasks valid');
  }

  // === VALIDATE WORLD MANIFESTS ===
  console.log(`\n${colors.cyan}--- Validating World Manifests ---${colors.reset}`);

  for (const [areaId, area] of Object.entries(AREAS)) {
    const manifest = WORLD_MANIFESTS[areaId];

    if (!manifest) {
      error(`Area '${areaId}' has no world manifest`);
      hasErrors = true;
      continue;
    }

    // Collect all targetIds used by tasks in this area
    const usedTargetIds = new Set();
    for (const role of ['boy', 'girl']) {
      const taskIds = area.tasksByRole[role] || [];
      for (const taskId of taskIds) {
        const task = TASKS_BY_ID[taskId];
        if (task) {
          for (const step of task.steps) {
            usedTargetIds.add(step.targetId);
          }
        }
      }
    }

    // Check if all used targetIds are in manifest
    for (const targetId of usedTargetIds) {
      if (!manifest.interactables.includes(targetId)) {
        error(`Area '${areaId}' tasks use targetId '${targetId}' but it's not in world manifest`);
        hasErrors = true;
      }
    }

    // Check for unused interactables in manifest (warning only)
    for (const interactableId of manifest.interactables) {
      if (!usedTargetIds.has(interactableId)) {
        warn(`Area '${areaId}' world manifest declares '${interactableId}' but no tasks use it`);
        hasWarnings = true;
      }
    }
  }

  if (!hasErrors) {
    success('All world manifests valid');
  }

  // === VALIDATE ITEMS ===
  console.log(`\n${colors.cyan}--- Validating Items ---${colors.reset}`);

  const usedItems = new Set();
  for (const task of Object.values(TASKS_BY_ID)) {
    for (const step of task.steps) {
      (step.requiresItems || []).forEach(id => usedItems.add(id));
      (step.grantsItems || []).forEach(id => usedItems.add(id));
      (step.consumesItems || []).forEach(id => usedItems.add(id));
    }
  }

  for (const itemId of Object.keys(ITEMS)) {
    if (!usedItems.has(itemId)) {
      warn(`Item '${itemId}' is defined but never used in any task`);
      hasWarnings = true;
    }
  }

  if (!hasErrors) {
    success('All items valid');
  }

  // === SUMMARY ===
  console.log(`\n${colors.cyan}=== Validation Summary ===${colors.reset}`);

  if (hasErrors) {
    error('Validation failed with errors');
    process.exitCode = 1;
  } else if (hasWarnings) {
    warn('Validation passed with warnings');
  } else {
    success('All content valid!');
  }

  console.log('');
}

main().catch(err => {
  console.error('Validation script crashed:', err);
  process.exit(1);
});
