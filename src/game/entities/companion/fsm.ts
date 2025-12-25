/**
 * Companion FSM - Follow/Lead/Investigate/Celebrate states
 */

export enum CompanionState {
  Follow = 'follow',
  Lead = 'lead',
  Investigate = 'investigate',
  Celebrate = 'celebrate',
  Idle = 'idle',
}

export class CompanionFSM {
  private currentState: CompanionState = CompanionState.Follow;
  private stateTime = 0;

  update(deltaTime: number): void {
    this.stateTime += deltaTime;
    
    // TODO: State transitions
  }

  setState(state: CompanionState): void {
    if (this.currentState === state) return;
    
    console.log(`Companion state: ${this.currentState} -> ${state}`);
    this.currentState = state;
    this.stateTime = 0;
  }

  getState(): CompanionState {
    return this.currentState;
  }
}
