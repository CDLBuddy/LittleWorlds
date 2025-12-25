#!/usr/bin/env node

/**
 * Clean build outputs using Node.js built-in fs APIs
 * Replaces rimraf to eliminate deprecated dependency
 */

import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const dirsToClean = [
  'dist',
  'dist-ssr',
  'build',
  '.vite',
  'coverage',
  'node_modules/.vite',
];

async function clean() {
  console.log('Cleaning build outputs...');

  for (const dir of dirsToClean) {
    const fullPath = join(rootDir, dir);
    try {
      await rm(fullPath, { recursive: true, force: true });
      console.log(`✓ Removed: ${dir}`);
    } catch (error) {
      // Ignore errors if directory doesn't exist
      if (error.code !== 'ENOENT') {
        console.warn(`⚠ Could not remove ${dir}:`, error.message);
      }
    }
  }

  console.log('Clean complete!');
}

clean().catch((error) => {
  console.error('Clean failed:', error);
  process.exit(1);
});
