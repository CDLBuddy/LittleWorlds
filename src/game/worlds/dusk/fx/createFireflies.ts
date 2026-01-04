import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Scalar,
  PointLight,
  Vector3,
  Mesh,
} from '@babylonjs/core';
import { DUSK } from '../config/constants';
import type { FireflyAgent } from '../types';
import { createRng } from '../utils/rng';

export function createFireflies(scene: Scene, parent: TransformNode) {
  const rng = createRng(0xF17EF1E5);
  const base: Mesh = MeshBuilder.CreateSphere('dusk_firefly_base', { diameter: 0.18, segments: 6 }, scene);
  base.isPickable = false;
  base.checkCollisions = false;
  base.parent = parent;

  const mat = new StandardMaterial('dusk_firefly_mat', scene);
  mat.diffuseColor = new Color3(0.12, 0.12, 0.10);
  mat.emissiveColor = new Color3(1.0, 0.86, 0.35).scale(0.85);
  mat.specularColor = new Color3(0, 0, 0);
  base.material = mat;
  base.isVisible = false;

  const agents: FireflyAgent[] = [];
  const makeAgent = (pattern: FireflyAgent['pattern'], center: Vector3, i: number) => {
    const inst = base.createInstance(`dusk_firefly_${pattern}_${i}`);
    inst.parent = parent;
    inst.isPickable = false;
    const phase = rng() * Math.PI * 2;
    const seed = rng();
    const baseScale = Scalar.Lerp(0.65, 1.15, rng());
    const jitterR = Scalar.Lerp(0.2, 3.8, rng());
    const jitterA = rng() * Math.PI * 2;
    inst.position.set(
      center.x + Math.cos(jitterA) * jitterR,
      center.y + Scalar.Lerp(-0.2, 0.6, rng()),
      center.z + Math.sin(jitterA) * jitterR
    );
    inst.scaling.setAll(baseScale);
    return {
      mesh: inst,
      pattern,
      phase,
      seed,
      baseScale,
      t: rng() * 10,
      idx: (rng() * 8) | 0,
      angle: rng() * Math.PI * 2,
    } satisfies FireflyAgent;
  };

  for (let i = 0; i < DUSK.FIREFLIES_PER_CLUSTER; i++) agents.push(makeAgent('CONSTELLATION', DUSK.CLUSTER_N, i));
  for (let i = 0; i < DUSK.FIREFLIES_PER_CLUSTER; i++) agents.push(makeAgent('RIVER', DUSK.CLUSTER_E, i));
  for (let i = 0; i < DUSK.FIREFLIES_PER_CLUSTER; i++) agents.push(makeAgent('PULSE', DUSK.CLUSTER_S, i));
  for (let i = 0; i < DUSK.FIREFLIES_PER_CLUSTER; i++) agents.push(makeAgent('SPIRAL', DUSK.CLUSTER_W, i));

  const entrySpark = base.createInstance('dusk_firefly_entry_spark');
  entrySpark.parent = parent;
  entrySpark.position.copyFrom(DUSK.ENTRY_GLADE_POS);
  entrySpark.position.y = 1.7;
  entrySpark.scaling.setAll(1.25);
  entrySpark.isPickable = false;

  const lightPool: PointLight[] = [];
  for (let i = 0; i < DUSK.FIREFLY_LIGHTS; i++) {
    const l = new PointLight(`dusk_firefly_light_${i}`, new Vector3(0, 2, 0), scene);
    l.intensity = 0.0;
    l.range = DUSK.FIREFLY_LIGHT_RANGE;
    l.diffuse = new Color3(1.0, 0.88, 0.45);
    l.specular = new Color3(0, 0, 0);
    lightPool.push(l);
  }

  let lightReassignTimer = 0;
  const dipper = [
    new Vector3(-4, 0, -2),
    new Vector3(-2, 0, -1),
    new Vector3(0, 0, 0),
    new Vector3(2, 0, 1),
    new Vector3(4, 0, 2),
    new Vector3(5.5, 0, 4),
    new Vector3(6.5, 0, 6),
    new Vector3(6.0, 0, 8),
  ];
  const river = [
    new Vector3(-8, 0, -4),
    new Vector3(-4, 0, -2),
    new Vector3(0, 0, 0),
    new Vector3(4, 0, 2),
    new Vector3(7, 0, 4),
    new Vector3(10, 0, 6),
  ];
  const tmp = new Vector3();

  function update(t: number, dt: number) {
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      a.t += dt;
      const m = a.mesh;
      const flicker = 0.65 + Math.sin(t * (1.6 + a.seed * 1.2) + a.phase) * 0.35;
      const scale = a.baseScale * Scalar.Clamp(flicker, 0.35, 1.2);
      m.scaling.set(scale, scale, scale);

      if (a.pattern === 'CONSTELLATION') {
        const center = DUSK.CLUSTER_N;
        const p = dipper[a.idx % dipper.length];
        const speed = 1.25 + a.seed * 0.35;
        tmp.set(center.x + p.x, center.y, center.z + p.z);
        const dx = tmp.x - m.position.x;
        const dz = tmp.z - m.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz) + 1e-6;
        m.position.x += (dx / dist) * speed * dt;
        m.position.z += (dz / dist) * speed * dt;
        m.position.y = center.y + Math.sin(t * 1.8 + a.phase) * DUSK.FIREFLY_HEIGHT_WOBBLE;
        if (dist < 0.4) a.idx = (a.idx + 1) % dipper.length;
      } else if (a.pattern === 'RIVER') {
        const center = DUSK.CLUSTER_E;
        const p = river[a.idx % river.length];
        const speed = 1.6 + a.seed * 0.6;
        tmp.set(center.x + p.x, center.y, center.z + p.z);
        const dx = tmp.x - m.position.x;
        const dz = tmp.z - m.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz) + 1e-6;
        m.position.x += (dx / dist) * speed * dt;
        m.position.z += (dz / dist) * speed * dt;
        m.position.x += Math.sin(t * 1.2 + a.phase) * 0.15;
        m.position.z += Math.cos(t * 1.1 + a.phase) * 0.10;
        m.position.y = center.y + Math.sin(t * 2.2 + a.phase) * (DUSK.FIREFLY_HEIGHT_WOBBLE * 0.8);
        if (dist < 0.5) a.idx = (a.idx + 1) % river.length;
      } else if (a.pattern === 'PULSE') {
        const center = DUSK.CLUSTER_S;
        const radius = 8.0;
        const slot = (i % DUSK.FIREFLIES_PER_CLUSTER) / DUSK.FIREFLIES_PER_CLUSTER;
        const ang = slot * Math.PI * 2;
        const px = center.x + Math.cos(ang) * radius;
        const pz = center.z + Math.sin(ang) * radius;
        m.position.x = Scalar.Lerp(m.position.x, px, 0.9 * dt);
        m.position.z = Scalar.Lerp(m.position.z, pz, 0.9 * dt);
        m.position.y = center.y + Math.sin(t * 2.4 + a.phase) * (DUSK.FIREFLY_HEIGHT_WOBBLE * 0.7);
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.7);
        m.scaling.setAll(scale * Scalar.Lerp(0.85, 1.15, pulse));
      } else {
        const center = DUSK.CLUSTER_W;
        a.angle += dt * (0.45 + a.seed * 0.25);
        const baseR = 7.5;
        const wobble = Math.sin(t * 0.7 + a.phase) * 1.25;
        const r = baseR + wobble;
        m.position.x = center.x + Math.cos(a.angle) * r;
        m.position.z = center.z + Math.sin(a.angle) * r;
        m.position.y = center.y + Math.sin(t * 2.0 + a.phase) * DUSK.FIREFLY_HEIGHT_WOBBLE;
      }
    }

    entrySpark.position.y = 1.7 + Math.sin(t * 2.2) * 0.35;
    const es = 0.95 + Math.sin(t * 3.0) * 0.25;
    entrySpark.scaling.setAll(es);

    lightReassignTimer += dt;
    if (lightReassignTimer > 0.22) {
      lightReassignTimer = 0;
      const cam = scene.activeCamera;
      if (!cam) {
        for (const l of lightPool) l.intensity = 0;
        return;
      }
      const cx = cam.position.x;
      const cy = cam.position.y;
      const cz = cam.position.z;
      const bestIdx: number[] = [];
      const bestDist: number[] = [];
      for (let i = 0; i < agents.length; i++) {
        const p = agents[i].mesh.position;
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dz = p.z - cz;
        const d2 = dx * dx + dy * dy + dz * dz;
        const max = DUSK.FIREFLY_LIGHTS;
        let insertAt = bestIdx.length;
        for (let k = 0; k < bestIdx.length; k++) {
          if (d2 < bestDist[k]) {
            insertAt = k;
            break;
          }
        }
        if (insertAt < max) {
          bestIdx.splice(insertAt, 0, i);
          bestDist.splice(insertAt, 0, d2);
          if (bestIdx.length > max) {
            bestIdx.pop();
            bestDist.pop();
          }
        }
      }
      for (let li = 0; li < lightPool.length; li++) {
        const l = lightPool[li];
        const idx = bestIdx[li];
        if (idx == null) {
          l.intensity = 0;
          continue;
        }
        const fm = agents[idx].mesh;
        l.position.copyFrom(fm.position);
        const s = fm.scaling.x;
        l.intensity = DUSK.FIREFLY_LIGHT_INTENSITY * Scalar.Clamp(s, 0.4, 1.25);
      }
    }
  }

  return {
    update,
    dispose: () => {
      for (const a of agents) a.mesh.dispose();
      entrySpark.dispose();
      base.dispose();
      mat.dispose();
      for (const l of lightPool) l.dispose();
    },
  };
}
