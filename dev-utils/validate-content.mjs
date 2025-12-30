#!/usr/bin/env node
/**
 * Content Validation Tool
 * 
 * Validates integrity of game content:
 * - Areas reference valid tasks
 * - Tasks have valid targetId (InteractableId)
 * - Icons resolve correctly
 * - No orphaned references
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(__dirname, '..', 'src', 'game');

let errorCount = 0;
let warningCount = 0;

function error(message) {
  console.error(`❌ ERROR: ${message}`);
  errorCount++;
}

function warning(message) {
  console.warn(`⚠️  WARNING: ${message}`);
  warningCount++;
}

function success(message) {
  console.log(`✓ ${message}`);
}

/**
 * Load and parse a TypeScript content module
 */
async function loadModule(relativePath) {
  try {
    const fullPath = join(srcRoot, relativePath);
    const content = await readFile(fullPath, 'utf-8');
    return content;
  } catch (err) {
    error(`Failed to load ${relativePath}: ${err.message}`);
    return null;
  }
}

/**
 * Extract all InteractableId values from enum/type
 */
function extractInteractableIds(content) {
  const ids = new Set();
  
  // Match enum InteractableId { ... }
  const enumMatch = content.match(/enum\s+InteractableId\s*{([^}]+)}/);
  if (enumMatch) {
    const members = enumMatch[1].match(/(\w+)\s*=/g);
    if (members) {
      members.forEach(m => {
        const id = m.match(/(\w+)\s*=/)[1];
        ids.add(id);
      });
    }
  }
  
  // Match type InteractableId = 'value1' | 'value2'
  const typeMatch = content.match(/type\s+InteractableId\s*=\s*([^;]+);/);
  if (typeMatch) {
    const values = typeMatch[1].match(/'([^']+)'/g);
    if (values) {
      values.forEach(v => {
        ids.add(v.replace(/'/g, ''));
      });
    }
  }
  
  return ids;
}

/**
 * Extract task IDs from tasks.ts
 */
function extractTaskIds(content) {
  const ids = new Set();
  const regex = /id:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    ids.add(match[1]);
  }
  return ids;
}

/**
 * Extract icon keys from icons.ts
 */
function extractIconKeys(content) {
  const keys = new Set();
  // Match ICONS object properties
  const regex = /(\w+):\s*{/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1]);
  }
  return keys;
}

/**
 * Validate areas reference valid tasks
 */
async function validateAreas() {
  console.log('\n📋 Validating Areas...');
  
  const areasContent = await loadModule('content/areas.ts');
  const tasksContent = await loadModule('content/tasks.ts');
  
  if (!areasContent || !tasksContent) {
    error('Cannot validate areas without both areas.ts and tasks.ts');
    return;
  }
  
  const taskIds = extractTaskIds(tasksContent);
  success(`Found ${taskIds.size} task definitions`);
  
  // Extract taskIds from areas
  const areaTaskRegex = /taskIds:\s*\[([^\]]+)\]/g;
  let match;
  let areaCount = 0;
  
  while ((match = areaTaskRegex.exec(areasContent)) !== null) {
    areaCount++;
    const taskList = match[1];
    const referencedTasks = taskList.match(/'([^']+)'/g);
    
    if (referencedTasks) {
      referencedTasks.forEach(task => {
        const taskId = task.replace(/'/g, '');
        if (!taskIds.has(taskId)) {
          error(`Area references unknown task: "${taskId}"`);
        }
      });
    }
  }
  
  success(`Validated ${areaCount} areas`);
}

/**
 * Validate tasks have valid targetId
 */
async function validateTasks() {
  console.log('\n🎯 Validating Tasks...');
  
  const tasksContent = await loadModule('content/tasks.ts');
  const interactablesContent = await loadModule('content/interactableIds.ts');
  
  if (!tasksContent) {
    error('Cannot validate tasks without tasks.ts');
    return;
  }
  
  if (!interactablesContent) {
    warning('interactableIds.ts not found, skipping targetId validation');
    return;
  }
  
  const interactableIds = extractInteractableIds(interactablesContent);
  success(`Found ${interactableIds.size} interactable IDs`);
  
  // Extract targetId from tasks
  const targetIdRegex = /targetId:\s*['"]([^'"]+)['"]/g;
  let match;
  let taskCount = 0;
  
  while ((match = targetIdRegex.exec(tasksContent)) !== null) {
    taskCount++;
    const targetId = match[1];
    if (!interactableIds.has(targetId)) {
      error(`Task references unknown interactable: "${targetId}"`);
    }
  }
  
  success(`Validated ${taskCount} task targetIds`);
}

/**
 * Validate icon keys resolve
 */
async function validateIcons() {
  console.log('\n🎨 Validating Icons...');
  
  const iconsContent = await loadModule('content/icons.ts');
  const tasksContent = await loadModule('content/tasks.ts');
  const itemsContent = await loadModule('content/items.ts');
  
  if (!iconsContent) {
    error('Cannot validate icons without icons.ts');
    return;
  }
  
  const iconKeys = extractIconKeys(iconsContent);
  success(`Found ${iconKeys.size} icon definitions`);
  
  // Check tasks
  if (tasksContent) {
    const taskIconRegex = /icon:\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = taskIconRegex.exec(tasksContent)) !== null) {
      const iconKey = match[1];
      if (!iconKeys.has(iconKey)) {
        error(`Task references unknown icon: "${iconKey}"`);
      }
    }
  }
  
  // Check items
  if (itemsContent) {
    const itemIconRegex = /icon:\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = itemIconRegex.exec(itemsContent)) !== null) {
      const iconKey = match[1];
      // Items often use direct file paths, which is acceptable if they start with /assets or ui/
      if (!iconKeys.has(iconKey) && !iconKey.startsWith('/assets') && !iconKey.startsWith('ui/')) {
        warning(`Item uses unconventional icon reference: "${iconKey}"`);
      }
    }
  }
  
  success('Icon references validated');
}

/**
 * Validate content version consistency
 */
async function validateVersion() {
  console.log('\n📦 Validating Content Version...');
  
  const versionContent = await loadModule('content/version.ts');
  if (!versionContent) {
    error('Cannot validate version without version.ts');
    return;
  }
  
  // Extract version number
  const versionMatch = versionContent.match(/export const CONTENT_VERSION\s*=\s*(\d+);/);
  if (!versionMatch) {
    error('Could not find CONTENT_VERSION export in version.ts');
    return;
  }
  
  const expectedVersion = parseInt(versionMatch[1], 10);
  success(`Expected content version: ${expectedVersion}`);
  
  // Check each content file exports the version
  const contentFiles = ['content/tasks.ts', 'content/areas.ts', 'content/icons.ts'];
  
  for (const file of contentFiles) {
    const content = await loadModule(file);
    if (!content) {
      error(`Cannot load ${file} for version check`);
      continue;
    }
    
    // Check for version export
    if (!content.includes('import { CONTENT_VERSION }')) {
      error(`${file} does not import CONTENT_VERSION`);
    }
    
    if (!content.includes('export { CONTENT_VERSION }')) {
      error(`${file} does not re-export CONTENT_VERSION`);
    }
  }
  
  success('Content version consistency validated');
}

/**
 * Main validation flow
 */
async function main() {
  console.log('🔍 Content Validation Starting...\n');
  console.log('═'.repeat(50));
  
  await validateVersion();
  await validateAreas();
  await validateTasks();
  await validateIcons();
  
  console.log('\n' + '═'.repeat(50));
  console.log('\n📊 Validation Summary:');
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Warnings: ${warningCount}`);
  
  if (errorCount === 0 && warningCount === 0) {
    console.log('\n✅ All content validation passed!\n');
    process.exit(0);
  } else if (errorCount === 0) {
    console.log('\n⚠️  Validation passed with warnings\n');
    process.exit(0);
  } else {
    console.log('\n❌ Validation failed with errors\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
