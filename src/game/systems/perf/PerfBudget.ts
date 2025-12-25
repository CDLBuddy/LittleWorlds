/**
 * Performance Budget - dynamic scaling (fps-based)
 */

export interface PerformanceBudget {
  targetFps: number;
  minFps: number;
  currentFps: number;
  frameTimeBudget: number;
}

export class PerfBudget {
  private budget: PerformanceBudget;
  private fpsHistory: number[] = [];
  private historySize = 60;

  constructor(targetFps = 60, minFps = 30) {
    this.budget = {
      targetFps,
      minFps,
      currentFps: targetFps,
      frameTimeBudget: 1000 / targetFps,
    };
  }

  recordFrame(fps: number): void {
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.historySize) {
      this.fpsHistory.shift();
    }
    
    this.budget.currentFps = this.getAverageFps();
  }

  getAverageFps(): number {
    if (this.fpsHistory.length === 0) return this.budget.targetFps;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }

  isUnderBudget(): boolean {
    return this.budget.currentFps < this.budget.minFps;
  }

  shouldScaleDown(): boolean {
    return this.budget.currentFps < this.budget.minFps * 1.1;
  }

  shouldScaleUp(): boolean {
    return this.budget.currentFps > this.budget.targetFps * 0.95;
  }

  getBudget(): PerformanceBudget {
    return { ...this.budget };
  }
}
