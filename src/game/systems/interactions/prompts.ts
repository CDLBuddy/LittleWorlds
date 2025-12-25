/**
 * Interaction prompts - icon prompts, sparkle cues, haptics
 */

export interface Prompt {
  text: string;
  icon?: string;
  showSparkles?: boolean;
}

export class PromptManager {
  private currentPrompt: Prompt | null = null;

  show(prompt: Prompt): void {
    this.currentPrompt = prompt;
    
    if (prompt.showSparkles) {
      // TODO: Trigger sparkle effect
    }
    
    // Haptic feedback on supported devices
    this.triggerHaptic('light');
  }

  hide(): void {
    this.currentPrompt = null;
  }

  getCurrentPrompt(): Prompt | null {
    return this.currentPrompt;
  }

  private triggerHaptic(type: 'light' | 'medium' | 'heavy'): void {
    if ('vibrate' in navigator) {
      const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 50;
      navigator.vibrate(duration);
    }
  }
}
