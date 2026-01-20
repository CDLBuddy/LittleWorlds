/**
 * Phase 1 Validation Tests
 * Tests for Tool Registry & Data integration
 */

import { 
  INTERACTIVE_TOOLS, 
  getInteractiveToolsFromInventory, 
  hasRequiredAmmo,
  isInteractiveTool,
  validateAllTools,
  type ToolDef,
} from '../tools';

/**
 * Run validation tests
 * Call this during development to verify tool system
 */
export function runPhase1Tests(): void {
  console.group('🧪 Phase 1: Tool Registry Tests');
  
  // Test 1: Tool registry exists and has expected tools
  console.log('\n✓ Test 1: Tool registry structure');
  console.assert(!!INTERACTIVE_TOOLS.slingshot, 'Slingshot tool exists');
  console.assert(!!INTERACTIVE_TOOLS.axe, 'Axe tool exists');
  console.assert(!!INTERACTIVE_TOOLS.multitool, 'Multitool tool exists');
  console.log('  - All expected tools found in registry');
  
  // Test 2: Slingshot is properly configured
  console.log('\n✓ Test 2: Slingshot configuration');
  const slingshot = INTERACTIVE_TOOLS.slingshot;
  console.assert(slingshot.isInteractive === true, 'Slingshot is interactive');
  console.assert(slingshot.type === 'ranged', 'Slingshot is ranged type');
  console.assert(slingshot.projectile?.ammoType === 'steel_balls', 'Slingshot uses steel_balls');
  console.assert(slingshot.projectile?.cooldown === 0.6, 'Cooldown is 0.6s');
  console.log('  - Slingshot configured correctly');
  
  // Test 3: Get interactive tools from inventory
  console.log('\n✓ Test 3: Get interactive tools from inventory');
  const testInventory = ['slingshot', 'steel_balls', 'axe', 'stick', 'stone'];
  const tools = getInteractiveToolsFromInventory(testInventory);
  console.assert(tools.length === 1, 'Found 1 interactive tool'); // Only slingshot is interactive
  console.assert(tools.includes('slingshot'), 'Slingshot in results');
  console.assert(!tools.includes('axe'), 'Axe not included (not interactive yet)');
  console.log('  - Correctly filtered:', tools);
  
  // Test 4: Empty inventory returns no tools
  console.log('\n✓ Test 4: Empty inventory');
  const emptyTools = getInteractiveToolsFromInventory([]);
  console.assert(emptyTools.length === 0, 'Empty inventory returns no tools');
  console.log('  - Empty inventory handled correctly');
  
  // Test 5: Non-tool items filtered out
  console.log('\n✓ Test 5: Non-tool items filtered');
  const mixedInventory = ['stick', 'stone', 'fish', 'rope'];
  const noTools = getInteractiveToolsFromInventory(mixedInventory);
  console.assert(noTools.length === 0, 'No tools found in material-only inventory');
  console.log('  - Non-tool items correctly excluded');
  
  // Test 6: Ammo requirement checking
  console.log('\n✓ Test 6: Ammo requirement checking');
  const withAmmo = ['slingshot', 'steel_balls'];
  const withoutAmmo = ['slingshot'];
  console.assert(
    hasRequiredAmmo('slingshot', withAmmo) === true,
    'Slingshot has ammo when steel_balls present'
  );
  console.assert(
    hasRequiredAmmo('slingshot', withoutAmmo) === false,
    'Slingshot missing ammo when steel_balls absent'
  );
  console.log('  - Ammo requirements validated correctly');
  
  // Test 7: isInteractiveTool type guard
  console.log('\n✓ Test 7: Type guard function');
  console.assert(isInteractiveTool('slingshot') === true, 'Slingshot is interactive tool');
  console.assert(isInteractiveTool('axe') === false, 'Axe not interactive yet');
  console.assert(isInteractiveTool('stick') === false, 'Stick not a tool');
  console.assert(isInteractiveTool('nonexistent') === false, 'Invalid ID returns false');
  console.log('  - Type guard working correctly');
  
  // Test 8: Validate all tools
  console.log('\n✓ Test 8: Tool definition validation');
  validateAllTools();
  console.log('  - All tools validated (check console for errors)');
  
  // Test 9: Projectile config exists for ranged tools
  console.log('\n✓ Test 9: Projectile configuration');
  const rangedTools = Object.values(INTERACTIVE_TOOLS).filter((t): t is ToolDef => t.type === 'ranged');
  for (const tool of rangedTools) {
    if (tool.isInteractive) {
      console.assert(!!tool.projectile, `${tool.id} has projectile config`);
      console.assert((tool.projectile?.speed || 0) > 0, `${tool.id} has valid speed`);
      console.assert((tool.projectile?.range || 0) > 0, `${tool.id} has valid range`);
    }
  }
  console.log('  - All ranged tools have valid projectile configs');
  
  // Test 10: Model paths exist for interactive tools
  console.log('\n✓ Test 10: Model paths defined');
  const interactiveTools = Object.values(INTERACTIVE_TOOLS).filter((t): t is ToolDef => t.isInteractive);
  for (const tool of interactiveTools) {
    console.assert(!!tool.modelPath, `${tool.id} has modelPath`);
  }
  console.log('  - All interactive tools have model paths');
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Phase 1 validation complete!');
  console.log(`   Found ${Object.keys(INTERACTIVE_TOOLS).length} tools`);
  console.log(`   ${interactiveTools.length} are currently interactive`);
  console.log('='.repeat(50));
  
  console.groupEnd();
}

/**
 * Example usage scenarios
 */
export function demonstratePhase1Usage(): void {
  console.group('📚 Phase 1: Usage Examples');
  
  // Example 1: Check what tools a player has
  console.log('\n📦 Example 1: Player inventory check');
  const playerInventory = ['slingshot', 'steel_balls', 'stick', 'axe'];
  const availableTools = getInteractiveToolsFromInventory(playerInventory);
  console.log('  Player inventory:', playerInventory);
  console.log('  Available tools:', availableTools);
  console.log('  → Player can equip:', availableTools.join(', ') || 'none');
  
  // Example 2: Can player use slingshot?
  console.log('\n🎯 Example 2: Can use slingshot?');
  const hasSlingshot = availableTools.includes('slingshot');
  const hasAmmo = hasRequiredAmmo('slingshot', playerInventory);
  console.log('  Has slingshot:', hasSlingshot);
  console.log('  Has ammo:', hasAmmo);
  console.log('  → Can fire slingshot:', hasSlingshot && hasAmmo);
  
  // Example 3: Get tool details for UI
  console.log('\n🖼️  Example 3: Tool details for UI');
  if (hasSlingshot) {
    const tool = INTERACTIVE_TOOLS.slingshot;
    console.log('  Tool:', tool.name);
    console.log('  Icon:', tool.icon);
    console.log('  Type:', tool.type);
    console.log('  Cooldown:', tool.projectile?.cooldown + 's');
    console.log('  Max Range:', tool.projectile?.range + ' units');
  }
  
  // Example 4: Different inventory scenarios
  console.log('\n🔄 Example 4: Different scenarios');
  const scenarios = [
    { inv: ['slingshot', 'steel_balls'], desc: 'Full loadout' },
    { inv: ['slingshot'], desc: 'Tool but no ammo' },
    { inv: ['steel_balls'], desc: 'Ammo but no tool' },
    { inv: ['stick', 'stone'], desc: 'No tools' },
    { inv: [], desc: 'Empty inventory' },
  ];
  
  for (const scenario of scenarios) {
    const tools = getInteractiveToolsFromInventory(scenario.inv);
    const canUse = tools.length > 0 && hasRequiredAmmo(tools[0], scenario.inv);
    console.log(`  ${scenario.desc}:`, canUse ? '✓ Ready' : '✗ Cannot use');
  }
  
  console.log('\n' + '='.repeat(50));
  console.groupEnd();
}
