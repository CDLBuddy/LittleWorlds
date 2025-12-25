#!/usr/bin/env node

/**
 * Asset validation - fails CI if assets are too big or have wrong names
 * Run: node tools/validate-assets.mjs
 */

import { stat } from 'fs/promises';
import { join, dirname } from 'path';
import { globby } from 'globby';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const MAX_FILE_SIZE_MB = 5;
const ASSETS_DIR = join(rootDir, 'public/assets');

async function validateAssets() {
  console.log('Validating assets...');

  try {
    const files = await globby('**/*', {
      cwd: ASSETS_DIR,
      onlyFiles: true,
      absolute: true,
      gitignore: true,
    });
    
    let hasErrors = false;

    for (const file of files) {
      const stats = await stat(file);
      const sizeMB = stats.size / (1024 * 1024);

      if (sizeMB > MAX_FILE_SIZE_MB) {
        console.error(`✗ File too large: ${file} (${sizeMB.toFixed(2)} MB)`);
        hasErrors = true;
      }

      // Check naming conventions
      if (file.includes(' ')) {
        console.error(`✗ File has spaces in name: ${file}`);
        hasErrors = true;
      }
    }

    if (hasErrors) {
      console.error('\nValidation failed!');
      process.exit(1);
    } else {
      console.log(`✓ All ${files.length} assets validated successfully`);
    }
  } catch (error) {
    console.error('Validation error:', error);
    process.exit(1);
  }
}

validateAssets();
