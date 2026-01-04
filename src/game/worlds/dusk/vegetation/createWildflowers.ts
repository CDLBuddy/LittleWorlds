import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Scalar,
  Mesh,
  type AbstractMesh,
} from '@babylonjs/core';
import { DUSK } from '../config/constants';
import { createRng } from '../utils/rng';

export function createWildflowers(
  scene: Scene,
  parent: TransformNode,
  isExcluded: (x: number, z: number) => boolean
) {
  const rng = createRng(0xDF10E125);

  const flowerTypes: Array<{ name: string; color: Color3 }> = [
    { name: 'susan', color: new Color3(0.95, 0.78, 0.20) }, // black-eyed susan-ish
    { name: 'cone', color: new Color3(0.62, 0.35, 0.72) }, // coneflower-ish
    { name: 'milk', color: new Color3(0.88, 0.80, 0.92) }, // milkweed-ish
    { name: 'lace', color: new Color3(0.93, 0.93, 0.93) }, // queen anne's lace-ish
    { name: 'rod', color: new Color3(0.98, 0.86, 0.22) }, // goldenrod-ish
  ];

  const bases: Array<{ base: Mesh; mat: StandardMaterial; inst: AbstractMesh[] }> = [];

  for (const ft of flowerTypes) {
    const base: Mesh = MeshBuilder.CreateCylinder(
      `dusk_flower_${ft.name}_base`,
      { height: 0.9, diameterTop: 0.08, diameterBottom: 0.05, tessellation: 6 },
      scene
    );
    base.isPickable = false;
    base.checkCollisions = false;
    base.isVisible = false;
    base.parent = parent;

    const mat = new StandardMaterial(`dusk_flower_${ft.name}_mat`, scene);
    mat.diffuseColor = ft.color;
    mat.emissiveColor = ft.color.scale(0.12);
    mat.specularColor = new Color3(0, 0, 0);
    base.material = mat;

    bases.push({ base, mat, inst: [] });
  }

  const safeInner = DUSK.HALF - (DUSK.PERIMETER_BAND + 3);

  for (let typeIndex = 0; typeIndex < bases.length; typeIndex++) {
    const group = bases[typeIndex];

    for (let i = 0; i < DUSK.FLOWER_COUNT_PER_TYPE; i++) {
      let x = 0;
      let z = 0;

      // attempt placements
      for (let k = 0; k < 10; k++) {
        x = Scalar.Lerp(-safeInner, safeInner, rng());
        z = Scalar.Lerp(-safeInner, safeInner, rng());
        if (isExcluded(x, z)) continue;

        // cluster bias: more flowers around edges of clearing
        const r = Math.sqrt(x * x + z * z);
        if (r < 9 && rng() < 0.85) continue; // keep oak base cleaner

        break;
      }

      if (isExcluded(x, z)) continue;

      const inst = group.base.createInstance(`dusk_flower_${typeIndex}_${i}`);
      inst.isPickable = false;
      inst.checkCollisions = false;
      inst.parent = parent;
      inst.position.set(x, 0.0, z);
      inst.rotation.y = rng() * Math.PI * 2;

      const s = Scalar.Lerp(0.75, 1.35, rng());
      inst.scaling.set(s, Scalar.Lerp(0.85, 1.65, rng()), s);

      group.inst.push(inst);
      inst.freezeWorldMatrix();
    }
  }

  return {
    dispose: () => {
      for (const g of bases) {
        for (const inst of g.inst) inst.dispose();
        g.base.dispose();
        g.mat.dispose();
      }
    },
  };
}
