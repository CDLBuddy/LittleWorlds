import type { Scene, TransformNode } from '@babylonjs/core';
import { createPhotographyRock } from './photographyRock';
import { createLanternWorkbench } from './lanternWorkbench';
import { createLanternTotem } from './lanternTotem';

export function createProps(scene: Scene, parent: TransformNode) {
  const photoRock = createPhotographyRock(scene, parent);
  const workbench = createLanternWorkbench(scene, parent);
  const totem = createLanternTotem(scene, parent);

  return {
    dispose: () => {
      photoRock.dispose();
      workbench.dispose();
      totem.dispose();
    },
  };
}
