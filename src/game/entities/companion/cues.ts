/**
 * Companion cues - barks/meows, tail wag, sparkles
 */

export interface CompanionCue {
  type: 'bark' | 'meow' | 'tail_wag' | 'sparkle';
  duration: number;
}

export class CueSystem {
  private activeCues: CompanionCue[] = [];

  trigger(cue: CompanionCue): void {
    this.activeCues.push(cue);
    
    // Auto-remove after duration
    setTimeout(() => {
      this.remove(cue);
    }, cue.duration * 1000);
  }

  remove(cue: CompanionCue): void {
    const index = this.activeCues.indexOf(cue);
    if (index !== -1) {
      this.activeCues.splice(index, 1);
    }
  }

  getActiveCues(): CompanionCue[] {
    return [...this.activeCues];
  }
}
