import { DUSK } from '../config/constants';

export function makeExclusionPredicate() {
  // Corridor from south gate → oak → north gate
  // + keep POIs and oak base readable
  const corridorHalfWidth = 5.5;

  // POI radii (simple circles)
  const oakR = 7.0;
  const photoR = 5.5;
  const benchR = 5.0;
  const totemR = 4.0;

  // Gate clear areas
  const gateR = 7.0;

  return (x: number, z: number) => {
    // Corridors (south->center and center->north)
    const inCorridor = Math.abs(x) < corridorHalfWidth && Math.abs(z) < DUSK.HALF; // main vertical corridor
    // We want corridor *mostly* clear but not the entire map; limit it to a strip
    const corridorStrip = inCorridor && (z > -52 && z < 55);

    // Circles around POIs
    const nearOak = (x * x + z * z) < oakR * oakR;
    const dxPhoto = x - DUSK.PHOTO_ROCK_POS.x;
    const dzPhoto = z - DUSK.PHOTO_ROCK_POS.z;
    const nearPhoto = (dxPhoto * dxPhoto + dzPhoto * dzPhoto) < photoR * photoR;

    const dxBench = x - DUSK.WORKBENCH_POS.x;
    const dzBench = z - DUSK.WORKBENCH_POS.z;
    const nearBench = (dxBench * dxBench + dzBench * dzBench) < benchR * benchR;

    const dxTotem = x - DUSK.TOTEM_POS.x;
    const dzTotem = z - DUSK.TOTEM_POS.z;
    const nearTotem = (dxTotem * dxTotem + dzTotem * dzTotem) < totemR * totemR;

    const dxNorthGate = x - DUSK.NORTH_GATE_POS.x;
    const dzNorthGate = z - DUSK.NORTH_GATE_POS.z;
    const nearNorthGate = (dxNorthGate * dxNorthGate + dzNorthGate * dzNorthGate) < gateR * gateR;

    const dxSouthGate = x - DUSK.SOUTH_GATE_POS.x;
    const dzSouthGate = z - DUSK.SOUTH_GATE_POS.z;
    const nearSouthGate = (dxSouthGate * dxSouthGate + dzSouthGate * dzSouthGate) < gateR * gateR;

    // Entry glade: keep a bit clearer too
    const dxEntry = x - DUSK.ENTRY_GLADE_POS.x;
    const dzEntry = z - DUSK.ENTRY_GLADE_POS.z;
    const nearEntry = (dxEntry * dxEntry + dzEntry * dzEntry) < 6.5 * 6.5;

    return corridorStrip || nearOak || nearPhoto || nearBench || nearTotem || nearNorthGate || nearSouthGate || nearEntry;
  };
}
