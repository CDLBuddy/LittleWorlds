/**
 * Gesture recognition - tap/hold/drag, big-kid friendly
 */

export type GestureType = 'tap' | 'hold' | 'drag' | 'swipe';

export interface Gesture {
  type: GestureType;
  position: { x: number; y: number };
  delta?: { x: number; y: number };
  duration?: number;
}

export class GestureRecognizer {
  private startPos = { x: 0, y: 0 };
  private startTime = 0;
  private isTracking = false;

  onTouchStart(x: number, y: number): void {
    this.startPos = { x, y };
    this.startTime = Date.now();
    this.isTracking = true;
  }

  onTouchMove(x: number, y: number): Gesture | null {
    if (!this.isTracking) return null;

    const delta = {
      x: x - this.startPos.x,
      y: y - this.startPos.y,
    };

    const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
    
    if (distance > 10) {
      return {
        type: 'drag',
        position: { x, y },
        delta,
      };
    }

    return null;
  }

  onTouchEnd(x: number, y: number): Gesture | null {
    if (!this.isTracking) return null;
    this.isTracking = false;

    const duration = Date.now() - this.startTime;
    const delta = {
      x: x - this.startPos.x,
      y: y - this.startPos.y,
    };
    const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);

    if (distance < 10 && duration < 300) {
      return { type: 'tap', position: { x, y } };
    }

    if (distance < 10 && duration >= 300) {
      return { type: 'hold', position: { x, y }, duration };
    }

    if (distance > 50) {
      return { type: 'swipe', position: { x, y }, delta };
    }

    return null;
  }
}
