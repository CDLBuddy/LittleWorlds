/**
 * Time and frame budget utilities for fixed-step updates
 */

export class TimeManager {
  private lastTime = 0;
  private deltaTime = 0;
  private fixedTimeStep = 1 / 60;
  private accumulator = 0;
  private frameCount = 0;
  private fpsUpdateInterval = 1000;
  private lastFpsUpdate = 0;
  private currentFps = 0;

  update(currentTime: number): void {
    this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    this.accumulator += this.deltaTime;

    // FPS calculation
    this.frameCount++;
    if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.currentFps = (this.frameCount * 1000) / (currentTime - this.lastFpsUpdate);
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }
  }

  getDeltaTime(): number {
    return this.deltaTime;
  }

  getFPS(): number {
    return Math.round(this.currentFps);
  }

  shouldFixedUpdate(): boolean {
    if (this.accumulator >= this.fixedTimeStep) {
      this.accumulator -= this.fixedTimeStep;
      return true;
    }
    return false;
  }

  getFixedTimeStep(): number {
    return this.fixedTimeStep;
  }
}

export const timeManager = new TimeManager();
