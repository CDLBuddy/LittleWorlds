/**
 * Pine World - Trail ribbon creation
 * Creates the visual dirt path with texture coordinates and edge definition
 */

import { Color3, Mesh, MeshBuilder, type Scene, StandardMaterial, Vector3, Vector4 } from '@babylonjs/core';
import { TRAIL_Y_OFFSET } from '../config/constants';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';
import { buildSwitchbackCenterline, getTrailWidthAt } from './buildCenterline';
import { scatterTrailEdgeRocks } from './scatterEdgeRocks';

export function createTrailRibbon(scene: Scene, bag: DisposableBag, mats: MaterialCache) {
  const centerline = buildSwitchbackCenterline();

  // Convert centerline into left/right edges with variable width
  const left: Vector3[] = [];
  const right: Vector3[] = [];
  const uvs: Vector4[] = []; // Store UVs for texture mapping

  let accumulatedDistance = 0;

  for (let i = 0; i < centerline.length; i++) {
    const p = centerline[i];
    const pPrev = centerline[Math.max(0, i - 1)];
    const pNext = centerline[Math.min(centerline.length - 1, i + 1)];

    // Calculate forward direction (tangent)
    const forward = pNext.subtract(pPrev);
    forward.y = 0;
    if (forward.lengthSquared() < 1e-6) forward.set(0, 0, -1);
    forward.normalize();

    // Perpendicular in XZ plane (right vector)
    const perp = new Vector3(-forward.z, 0, forward.x);
    perp.normalize();

    // Variable width for visual interest
    const t = i / (centerline.length - 1);
    const halfWidth = getTrailWidthAt(t);

    // Create edge points slightly above terrain to prevent z-fighting
    const leftPt = p.add(perp.scale(halfWidth));
    const rightPt = p.add(perp.scale(-halfWidth));

    left.push(leftPt);
    right.push(rightPt);

    // Calculate UV coordinates (V flows along trail, U across width)
    if (i > 0) {
      const segmentLength = p.subtract(centerline[i - 1]).length();
      accumulatedDistance += segmentLength;
    }

    // UV: U=0 at left, U=1 at right, V increases along trail
    // Scale V to create repeating texture pattern (every 10 meters)
    const v = accumulatedDistance / 10.0;
    uvs.push(new Vector4(0, v, 1, v)); // left U=0, right U=1
  }

  // Create ribbon with custom UVs
  const ribbon = bag.trackMesh(
    MeshBuilder.CreateRibbon(
      'pine_trail_ribbon',
      {
        pathArray: [left, right],
        closeArray: false,
        closePath: false,
        updatable: false,
        sideOrientation: Mesh.DOUBLESIDE,
        // Note: Ribbon doesn't directly support UV4, will set manually
      },
      scene
    )
  );

  // Apply UVs manually for texture mapping
  const positions = ribbon.getVerticesData('position');
  const uvData: number[] = [];
  
  if (positions) {
    const vertexCount = positions.length / 3;
    for (let i = 0; i < vertexCount / 2; i++) {
      const idx = Math.floor(i / 1);
      const uv = uvs[Math.min(idx, uvs.length - 1)];
      uvData.push(uv.x, uv.y); // Left edge
    }
    for (let i = 0; i < vertexCount / 2; i++) {
      const idx = Math.floor(i / 1);
      const uv = uvs[Math.min(idx, uvs.length - 1)];
      uvData.push(uv.z, uv.w); // Right edge
    }
    ribbon.setVerticesData('uv', uvData, false);
  }

  ribbon.position.y += TRAIL_Y_OFFSET;
  ribbon.isPickable = false;
  ribbon.receiveShadows = true;

  const mat = mats.get('pineTrailMat', () => {
    const m = new StandardMaterial('pineTrailMat', scene);
    // Worn dirt path with slight color variation
    m.diffuseColor = new Color3(0.45, 0.38, 0.30); // Slightly warmer, less saturated
    m.ambientColor = new Color3(0.24, 0.20, 0.16); // Brighter ambient for readability
    m.specularColor = new Color3(0.08, 0.08, 0.08); // Subtle specular (packed dirt has some shine)
    m.specularPower = 8; // Low shine
    // Optional: Add subtle bumpMap or texture here if desired
    return m;
  });

  ribbon.material = mat;

  // Add edge rocks for definition
  scatterTrailEdgeRocks(scene, bag, mats, centerline);

  return ribbon;
}
