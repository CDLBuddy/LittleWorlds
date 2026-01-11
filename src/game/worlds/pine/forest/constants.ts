/**
 * Pine Forest - Tree grounding constants
 * 
 * Phase 9: Constants for footprint-based tree grounding to prevent floating on slopes.
 * These values control how trees are sampled and placed on uneven terrain.
 */

/**
 * Tree footprint radius in world units at scale=1
 * 
 * Used to sample terrain at multiple points around the tree base
 * to check for slope/unevenness before placement.
 * 
 * Tuning:
 * - Larger radius = more conservative (detects slope earlier)
 * - Smaller radius = more permissive (trees fit in tighter spots)
 */
export const TREE_FOOTPRINT_RADIUS = 0.6;

/**
 * Maximum allowed height difference across tree footprint
 * 
 * If (maxY - minY) > this threshold, tree is considered on steep/uneven terrain
 * and will attempt relocation.
 * 
 * Tuning:
 * - Lower value = stricter (more trees relocated/skipped)
 * - Higher value = more permissive (trees tolerate steeper slopes)
 */
export const TREE_MAX_SLOPE_DELTA = 0.5;

/**
 * Number of relocation attempts when tree footprint is too steep
 * 
 * When initial placement fails slope check, try this many jittered positions
 * within TREE_RELOCATE_RADIUS before giving up.
 */
export const TREE_RELOCATE_ATTEMPTS = 10;

/**
 * Search radius for relocation attempts (world units)
 * 
 * Jittered candidate positions stay within this radius of original position.
 * 
 * Tuning:
 * - Larger radius = more likely to find valid spot (but tree moves farther)
 * - Smaller radius = preserves original distribution better
 */
export const TREE_RELOCATE_RADIUS = 2.0;

/**
 * Small sink amount to prevent micro-floating (world units)
 * 
 * After grounding, tree is sunk by this amount to hide any tiny gaps
 * between trunk and terrain.
 */
export const TREE_SINK_EPS = 0.05;

/**
 * Minimum acceptable terrain normal.y for tree placement
 * 
 * Similar to Phase 8 prop slope checking. Trees on slopes steeper than
 * this threshold will be relocated or skipped.
 * 
 * Value of 0.72 = ~44° max slope (slightly steeper than props at 0.75/~41°)
 * 
 * Tuning:
 * - Higher value = flatter ground required (fewer steep placements)
 * - Lower value = more tolerant of slopes
 */
export const TREE_MIN_NORMAL_Y = 0.72;
