/**
 * Global game constants
 */

export const CONSTANTS = {
  // World
  WORLD_SIZE: 100,
  GRAVITY: -9.81,

  // Player
  PLAYER_SPEED: 2.5,
  PLAYER_HEIGHT: 1.2,
  PLAYER_RADIUS: 0.3,

  // Camera
  CAMERA_DISTANCE: 5,
  CAMERA_HEIGHT: 2,
  CAMERA_SMOOTH: 0.1,

  // Interaction
  INTERACTION_RADIUS: 2,
  PROMPT_DISTANCE: 3,

  // Performance
  TARGET_FPS: 60,
  MIN_FPS: 30,
} as const;
