/**
 * Input bindings for keyboard/gamepad
 */

export interface KeyBinding {
  key: string;
  action: string;
}

export const DEFAULT_KEY_BINDINGS: KeyBinding[] = [
  { key: 'w', action: 'move_forward' },
  { key: 's', action: 'move_back' },
  { key: 'a', action: 'move_left' },
  { key: 'd', action: 'move_right' },
  { key: 'e', action: 'interact' },
  { key: ' ', action: 'interact' },
  { key: 'Escape', action: 'pause' },
];

export class InputBindings {
  private bindings = new Map<string, string>();

  constructor(bindings: KeyBinding[] = DEFAULT_KEY_BINDINGS) {
    bindings.forEach((binding) => {
      this.bindings.set(binding.key.toLowerCase(), binding.action);
    });
  }

  getAction(key: string): string | undefined {
    return this.bindings.get(key.toLowerCase());
  }

  setBinding(key: string, action: string): void {
    this.bindings.set(key.toLowerCase(), action);
  }
}
