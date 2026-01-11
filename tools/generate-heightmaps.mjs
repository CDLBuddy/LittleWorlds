/**
 * Generate heightmap textures for terrain
 * 
 * Run with: npm run generate:heightmaps
 * or: node tools/generate-heightmaps.mjs
 */

import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '../public/assets/heightmaps');

/**
 * Generate Pine world heightmap
 * South→north slope with natural hills and smooth edges
 */
async function generatePineHeightmap() {
  const width = 512;  // Power of 2 for GPU
  const height = 512;
  
  const pixels = Buffer.alloc(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Normalized coordinates (0..1)
      const nx = x / width;
      const ny = y / height;
      
      // 1. Base slope: south (high) to north (low)
      const baseSlope = ny * 0.6; // 60% of range for slope
      
      // 2. Gentle rolling hills (2-3 waves across terrain)
      const hill1 = Math.sin(nx * Math.PI * 2.5) * Math.cos(ny * Math.PI * 1.8) * 0.12;
      const hill2 = Math.cos(nx * Math.PI * 3.2 + 0.5) * Math.sin(ny * Math.PI * 2.3) * 0.08;
      
      // 3. Fine detail noise for natural variation
      const noise = Math.sin(nx * 23.7) * Math.cos(ny * 19.3) * 0.03;
      const noise2 = Math.sin(nx * 41.2 + 1.3) * Math.cos(ny * 37.8 + 2.1) * 0.02;
      
      // 4. Subtle center path (slightly lower elevation for walking)
      const distFromCenterX = Math.abs(nx - 0.5) * 2; // 0 at center, 1 at edges
      const pathInfluence = Math.max(0, 1 - distFromCenterX * 3); // Narrow path
      const pathDepth = pathInfluence * -0.04; // Slight depression
      
      // 5. Smooth edges to prevent cliff effect
      const edgeFadeX = Math.min(nx / 0.1, (1 - nx) / 0.1, 1); // Fade near x boundaries
      const edgeFadeY = Math.min(ny / 0.08, (1 - ny) / 0.08, 1); // Fade near y boundaries
      const edgeFade = Math.min(edgeFadeX, edgeFadeY);
      
      // Combine all components
      let combined = baseSlope + hill1 + hill2 + noise + noise2 + pathDepth;
      combined = combined * edgeFade; // Apply edge smoothing
      
      // Clamp to 0..1 and convert to 0..255
      const clamped = Math.max(0, Math.min(1, combined));
      const value = Math.floor(clamped * 255);
      
      pixels[y * width + x] = value;
    }
  }
  
  await sharp(pixels, {
    raw: {
      width,
      height,
      channels: 1,
    },
  })
    .png()
    .toFile(join(assetsDir, 'pine.png'));
  
  console.log('✓ Generated pine.png (linear south→north gradient)');
}

/**
 * Generate example heightmap with hills
 * Uncomment the function call in main() to use this
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateHillyHeightmap(name) {
  const width = 512;
  const height = 512;
  
  const pixels = Buffer.alloc(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Create some gentle hills using sine waves
      const nx = x / width;
      const ny = y / height;
      
      const hill1 = Math.sin(nx * Math.PI * 2) * Math.sin(ny * Math.PI * 2);
      const hill2 = Math.sin(nx * Math.PI * 4 + 1) * Math.sin(ny * Math.PI * 3);
      
      const combined = (hill1 * 0.7 + hill2 * 0.3 + 1) / 2; // 0..1
      const value = Math.floor(combined * 255);
      
      pixels[y * width + x] = value;
    }
  }
  
  await sharp(pixels, {
    raw: {
      width,
      height,
      channels: 1,
    },
  })
    .png()
    .toFile(join(assetsDir, `${name}.png`));
  
  console.log(`✓ Generated ${name}.png (hilly terrain)`);
}

// Main execution
async function main() {
  try {
    await mkdir(assetsDir, { recursive: true });
    console.log('🗺️  Generating heightmaps...\n');
    
    await generatePineHeightmap();
    
    console.log('\n✅ Heightmap generation complete!');
    console.log(`📁 Files saved to: ${assetsDir}`);
  } catch (error) {
    console.error('❌ Error generating heightmaps:', error);
    process.exit(1);
  }
}

main();
