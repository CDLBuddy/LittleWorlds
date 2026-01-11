import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Scalar,
  Mesh,
  type AbstractMesh,
  Vector3,
  Quaternion,
} from '@babylonjs/core';
import { DUSK } from '../config/constants';
import { createRng } from '../utils/rng';
import {
  applyThinInstances,
  type ThinInstanceTransform,
} from '../../../shared/thinInstances';

// Phase 2: Enable thin instances for tall grass
const USE_THIN_INSTANCES = true;

export function createTallGrass(
  scene: Scene,
  parent: TransformNode,
  isExcluded: (x: number, z: number) => boolean
) {
  const rng = createRng(0xD05C6A55); // grass seed

  // Simple stylized grass "card": just a plane (no alpha texture needed for now).
  const blade: Mesh = MeshBuilder.CreatePlane('dusk_grass_blade', { width: 0.65, height: 4.2 }, scene);
  blade.isPickable = false;
  blade.checkCollisions = false;
  blade.parent = parent;

  const mat = new StandardMaterial('dusk_grass_mat', scene);
  mat.diffuseColor = new Color3(0.20, 0.36, 0.18);
  mat.emissiveColor = new Color3(0.02, 0.03, 0.02);
  mat.specularColor = new Color3(0, 0, 0);
  mat.backFaceCulling = false;
  blade.material = mat;

  // Base hidden; instances do the work
  blade.isVisible = false;

  const instances: AbstractMesh[] = [];
  const inner = DUSK.HALF - DUSK.PERIMETER_BAND;

  if (USE_THIN_INSTANCES) {
    // Phase 2: Thin instance path
    const transforms: ThinInstanceTransform[] = [];

    for (let i = 0; i < DUSK.GRASS_COUNT; i++) {
      // Place in the perimeter band: max(|x|,|z|) in [inner..half]
      let x = 0;
      let z = 0;

      // Try a few times to avoid exclusions without spinning forever
      for (let k = 0; k < 6; k++) {
        // pick a side
        const side = (rng() * 4) | 0;
        const along = Scalar.Lerp(-DUSK.HALF + 1.5, DUSK.HALF - 1.5, rng());
        const inset = Scalar.Lerp(0, DUSK.PERIMETER_BAND - 1.5, rng());

        if (side === 0) {
          // north edge (z negative)
          x = along;
          z = -DUSK.HALF + 1.5 + inset;
        } else if (side === 1) {
          // south edge
          x = along;
          z = DUSK.HALF - 1.5 - inset;
        } else if (side === 2) {
          // west edge
          x = -DUSK.HALF + 1.5 + inset;
          z = along;
        } else {
          // east edge
          x = DUSK.HALF - 1.5 - inset;
          z = along;
        }

        // keep a loose inner boundary too, so band stays a band
        if (Math.max(Math.abs(x), Math.abs(z)) < inner) continue;
        if (isExcluded(x, z)) continue;
        break;
      }

      if (isExcluded(x, z)) continue;

      // Random yaw + slight lean (using quaternion for full rotation)
      const yaw = rng() * Math.PI * 2;
      const rotX = (rng() - 0.5) * 0.10;
      const rotZ = (rng() - 0.5) * 0.10;
      const rotation = Quaternion.RotationYawPitchRoll(yaw, rotX, rotZ);

      // Height variety
      const s = Scalar.Lerp(0.75, 1.25, rng());
      const scaleY = Scalar.Lerp(0.85, 1.45, rng());
      const scale = new Vector3(s, scaleY, s);

      transforms.push({
        position: new Vector3(x, 0, z),
        rotation,
        scale,
      });
    }

    // Apply all transforms in one batch
    applyThinInstances(blade, transforms);
    // CRITICAL: Must be visible for thin instances to render
    blade.isVisible = true;
    blade.parent = parent;
    blade.isPickable = false;
    blade.checkCollisions = false;
  } else {
    // Legacy instance path (kept for rollback if needed)
    for (let i = 0; i < DUSK.GRASS_COUNT; i++) {
      // Place in the perimeter band: max(|x|,|z|) in [inner..half]
      let x = 0;
      let z = 0;

      // Try a few times to avoid exclusions without spinning forever
      for (let k = 0; k < 6; k++) {
        // pick a side
        const side = (rng() * 4) | 0;
        const along = Scalar.Lerp(-DUSK.HALF + 1.5, DUSK.HALF - 1.5, rng());
        const inset = Scalar.Lerp(0, DUSK.PERIMETER_BAND - 1.5, rng());

        if (side === 0) {
          // north edge (z negative)
          x = along;
          z = -DUSK.HALF + 1.5 + inset;
        } else if (side === 1) {
          // south edge
          x = along;
          z = DUSK.HALF - 1.5 - inset;
        } else if (side === 2) {
          // west edge
          x = -DUSK.HALF + 1.5 + inset;
          z = along;
        } else {
          // east edge
          x = DUSK.HALF - 1.5 - inset;
          z = along;
        }

        // keep a loose inner boundary too, so band stays a band
        if (Math.max(Math.abs(x), Math.abs(z)) < inner) continue;
        if (isExcluded(x, z)) continue;
        break;
      }

      if (isExcluded(x, z)) continue;

      const inst = blade.createInstance(`dusk_grass_${i}`);
      inst.isPickable = false;
      inst.checkCollisions = false;
      inst.parent = parent;
      inst.position.set(x, 0, z);

      // Random yaw + slight lean
      inst.rotation.y = rng() * Math.PI * 2;
      inst.rotation.x = (rng() - 0.5) * 0.10;
      inst.rotation.z = (rng() - 0.5) * 0.10;

      // Height variety
      const s = Scalar.Lerp(0.75, 1.25, rng());
      inst.scaling.set(s, Scalar.Lerp(0.85, 1.45, rng()), s);

      instances.push(inst);
      inst.freezeWorldMatrix();
    }
  }

  return {
    dispose: () => {
      if (!USE_THIN_INSTANCES) {
        for (const inst of instances) inst.dispose();
      }
      blade.dispose();
      mat.dispose();
    },
  };
}
