/**
 * Route guards for navigation control
 * Can be used to check if user has selected a profile, etc.
 */

export function requireProfile(): boolean {
  // TODO: Check if a profile is selected
  return true;
}

export function canAccessGame(): boolean {
  // TODO: Check if game can be started
  return requireProfile();
}
