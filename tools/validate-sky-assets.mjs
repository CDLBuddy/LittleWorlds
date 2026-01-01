#!/usr/bin/env node

/**
 * Validate sky assets referenced in presets
 * Ensures all panorama images exist and have correct 2:1 aspect ratio
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Parse skyPresets.ts to extract URLs (simple regex approach)
const PRESETS_FILE = path.join(PROJECT_ROOT, 'src', 'game', 'systems', 'sky', 'skyPresets.ts');

async function validateSkyAssets() {
  console.log('🔍 Validating sky assets...\n');

  let errors = 0;
  let warnings = 0;

  // Read presets file
  const presetsContent = fs.readFileSync(PRESETS_FILE, 'utf-8');

  // Extract URLs with regex: url: 'assets/sky/...' OR url: skyUrl('worldId')
  // First, try direct URL strings
  const urlRegex = /url:\s*['"]([^'"]+)['"]/g;
  const urls = [];
  let match;
  while ((match = urlRegex.exec(presetsContent)) !== null) {
    urls.push(match[1]);
  }
  
  // Also extract skyUrl() function calls: skyUrl('worldId')
  const skyUrlRegex = /skyUrl\(['"]([^'"]+)['"]\)/g;
  while ((match = skyUrlRegex.exec(presetsContent)) !== null) {
    const worldId = match[1];
    urls.push(`assets/sky/${worldId}/sky.png`);
  }

  const uniqueUrls = [...new Set(urls)];
  
  // Check for duplicate references
  if (urls.length !== uniqueUrls.length) {
    console.warn(`⚠️  Warning: ${urls.length - uniqueUrls.length} duplicate sky references detected (some worlds share the same image)\n`);
    warnings++;
  }
  
  console.log(`📋 Found ${uniqueUrls.length} unique sky texture references\n`);

  for (const url of uniqueUrls) {
    // Convert preset URL to file path
    const relativePath = url.replace('assets/', '');
    const filePath = path.join(PROJECT_ROOT, 'public', 'assets', relativePath);

    // Check existence
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing: ${url}`);
      console.error(`   Expected at: ${filePath}\n`);
      errors++;
      continue;
    }

    // Check aspect ratio (2:1 for equirectangular)
    try {
      const metadata = await sharp(filePath).metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        console.warn(`⚠️  Cannot determine dimensions: ${url}\n`);
        warnings++;
        continue;
      }

      const aspectRatio = width / height;
      const expected = 2.0;
      const tolerance = 0.01; // Allow 1% deviation

      if (Math.abs(aspectRatio - expected) > tolerance) {
        console.error(`❌ Wrong aspect ratio: ${url}`);
        console.error(`   Expected 2:1 (${width}x${height / 2}), got ${width}x${height} (${aspectRatio.toFixed(2)}:1)\n`);
        errors++;
      } else {
        console.log(`✅ ${url} (${width}x${height})`);
      }
    } catch (err) {
      console.error(`❌ Failed to read image: ${url}`);
      console.error(`   ${err.message}\n`);
      errors++;
    }
  }

  // Summary
  console.log('\n══════════════════════════════════════════════════\n');
  console.log(`📊 Validation Summary:`);
  console.log(`   Textures checked: ${uniqueUrls.length}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Warnings: ${warnings}`);

  if (errors > 0) {
    console.log('\n❌ Sky asset validation failed\n');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️  Sky asset validation passed with warnings\n');
  } else {
    console.log('\n✅ Sky asset validation passed\n');
  }
}

// Run validation
validateSkyAssets().catch((err) => {
  console.error('Fatal error during validation:', err);
  process.exit(1);
});
