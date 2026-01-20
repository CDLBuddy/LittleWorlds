/**
 * Phase 1 Demo - Run this in browser console to test
 * 
 * To run:
 * 1. Import in GameApp.ts: import { runPhase1Demo } from './content/__tests__/phase1-demo';
 * 2. Call in browser console: window.runPhase1Demo()
 */

import { runPhase1Tests, demonstratePhase1Usage } from './phase1-tools.test';

export function runPhase1Demo(): void {
  console.clear();
  console.log('%c🚀 Phase 1: Interactive Tool System Demo', 'font-size: 20px; font-weight: bold; color: #4CAF50');
  console.log('%c══════════════════════════════════════════', 'color: #4CAF50');
  
  // Run all validation tests
  runPhase1Tests();
  
  // Show usage examples
  demonstratePhase1Usage();
  
  console.log('\n%c✨ Phase 1 Complete!', 'font-size: 18px; font-weight: bold; color: #2196F3');
  console.log('%cReady to proceed to Phase 2: Tool HUD Widget', 'color: #2196F3');
}

// Expose to window for easy testing
if (typeof window !== 'undefined') {
  (window as any).runPhase1Demo = runPhase1Demo;
}
