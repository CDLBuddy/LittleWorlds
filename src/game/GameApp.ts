// GameApp.ts - Main game application orchestrator
import { Engine, Scene, AbstractMesh, TransformNode, Vector3 } from '@babylonjs/core';
import { eventBus } from './shared/events';
import { createBootWorld } from './worlds/BootWorld';
import { Player } from './entities/player/Player';
import { PlayerController } from './entities/player/controller';
import { WakeRadiusSystem, type Wakeable } from './systems/interactions/wakeRadius';
import { DebugOverlay } from './debug/DebugOverlay';
import type { Companion } from './entities/companion/Companion';
import { TaskSystem } from './systems/tasks/TaskSystem';
import { InteractionSystem } from './systems/interactions/InteractionSystem';
import { AudioSystem, type LoopHandle } from './systems/audio/AudioSystem';
import { AMBIENT_KEYS, SFX_KEYS } from './systems/audio/sfx';
import { AUDIO } from './assets/manifest';
import { CameraRig } from './systems/camera/CameraRig';
import { FxSystem } from './systems/fx/FxSystem';
import { CompanionDebugHelper } from './debug/CompanionDebugHelper';
import { PlayerDebugHelper } from './debug/PlayerDebugHelper';
import { WorldEditor } from './debug/WorldEditor';
import { SwitchDebugOverlay } from './debug/SwitchDebugOverlay';
import type { RoleId } from './content/areas';
import { isAreaId, type AreaId } from './content/areas';
import { ProgressionSystem } from './systems/progression/ProgressionSystem';
import { AutosaveSystem } from './systems/autosave/AutosaveSystem';
import { saveFacade } from './systems/saves/saveFacade';
import * as sessionFacade from './session/sessionFacade';
import { CharacterSwitchSystem } from './systems/characters/CharacterSwitchSystem';
import { CheatSystem, createDefaultCheats } from './debug/cheats';
import type { WorldResult } from './worlds/types';
import { GATE_PAIR } from './content/gatePairs';
import { setPendingSpawn } from './worlds/spawnState';
import type { InteractableId } from './content/interactableIds';
import { validateSpawnSystem } from './worlds/validateSpawnSystem';

/**
 * GameApp - Main orchestrator for the Babylon.js game
 * Manages engine, scene, and all game systems
 */
export class GameApp {
  private engine: Engine;
  private scene: Scene;
  private isRunning = false;
  private resizeHandler: () => void;
  private worldDispose: (() => void) | null = null;
  private playerController: PlayerController | null = null;
  private wakeRadiusSystem: WakeRadiusSystem | null = null;
  private taskSystem: TaskSystem | null = null;
  private interactionSystem: InteractionSystem | null = null;
  private companion: Companion | null = null;
  private campfire: { update?: (dt: number) => void } | null = null;
  private debugOverlay: DebugOverlay | null = null;
  private interactables: Array<{ id: string; mesh: AbstractMesh }> = [];
  private eventUnsubscribe: (() => void) | null = null;
  private audioSystem: AudioSystem | null = null;
  private ambientLoop: LoopHandle | null = null;
  private lastLeadSfxTime = 0; // Throttle companion lead SFX
  private cameraRig: CameraRig | null = null;
  private fxSystem: FxSystem | null = null;
  private companionDebugHelper: CompanionDebugHelper | null = null;
  private playerDebugHelper: PlayerDebugHelper | null = null;
  private worldEditor: WorldEditor | null = null;
  private worldEditorKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  private switchDebugOverlay: SwitchDebugOverlay | null = null;
  private currentWorld: WorldResult | null = null;
  private progressionSystem: ProgressionSystem | null = null;
  private autosaveSystem: AutosaveSystem | null = null;
  private characterSwitchSystem: CharacterSwitchSystem | null = null;
  private startParams: { roleId: RoleId; areaId: AreaId; fromArea?: AreaId };

  constructor(canvas: HTMLCanvasElement, private bus: typeof eventBus, startParams: { roleId: RoleId; areaId: AreaId; fromArea?: AreaId }) {
    this.startParams = startParams;
    
    // DEV: Validate spawn system integrity at startup
    if (import.meta.env.DEV) {
      validateSpawnSystem();
    }
    
    // Initialize Babylon engine with iPad-friendly settings
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: false,
      stencil: false,
      antialias: true,
    });

    // Create scene
    this.scene = new Scene(this.engine);

    // Handle window resize
    this.resizeHandler = () => {
      this.engine.resize();
    };
    window.addEventListener('resize', this.resizeHandler);
    
    // Subscribe to UI events and game events for SFX
    this.eventUnsubscribe = this.bus.on((event) => {
      if (event.type === 'ui/callCompanion') {
        this.onCompanionCall();
      } else if (event.type === 'ui/audio/unlock') {
        this.audioSystem?.unlock();
      } else if (event.type === 'ui/audio/volume') {
        this.audioSystem?.setVolume(event.bus, event.value);
      } else if (event.type === 'ui/restart') {
        this.onRestart();
      } else if (event.type === 'game/areaRequest') {
        // Handle gate area request with optional gate tracking
        this.onAreaRequest(event.areaId, event.fromArea, event.fromGateId);
      } else if (event.type === 'game/companion/state') {
        // Play SFX based on companion state
        if (event.state === 'LeadToTarget') {
          // Throttle: only play lead SFX once every 2 seconds
          const now = Date.now();
          if (now - this.lastLeadSfxTime > 2000) {
            this.audioSystem?.playSfx(SFX_KEYS.COMPANION_LEAD, { volume: 0.6 });
            this.lastLeadSfxTime = now;
          }
          // Switch camera to LEAD mode for better view
          this.cameraRig?.setMode('LEAD');
        } else if (event.state === 'FollowPlayer') {
          // Back to normal follow
          this.cameraRig?.setMode('FOLLOW');
        } else if (event.state === 'Celebrate') {
          // Celebration camera
          this.cameraRig?.setMode('CELEBRATE');
        }
      } else if (event.type === 'game/task') {
        // Check for task completion
        if (event.complete && this.currentWorld) {
          const activePlayerMesh = this.getActivePlayerMesh();
          // Notify progression system (Phase 2.9: pass role-stamped roleId)
          if (this.progressionSystem) {
            // event.roleId is guaranteed to exist on game/task events (Phase 2.9)
            this.progressionSystem.handleTaskEvent(event.taskId, true, event.roleId);
          }
          // Spawn confetti at player position
          this.fxSystem?.spawnConfetti(activePlayerMesh.position.clone());
          // Play success sound
          this.audioSystem?.playSfx(SFX_KEYS.SUCCESS, { volume: 0.8 });
          // Trigger celebrate camera briefly
          this.cameraRig?.setMode('CELEBRATE');
          // Emit task complete event with position
          this.bus.emit({
            type: 'game/taskComplete',
            taskId: event.taskId,
            position: {
              x: activePlayerMesh.position.x,
              y: activePlayerMesh.position.y,
              z: activePlayerMesh.position.z,
            },
          });
        }
      } else if (event.type === 'game/interact') {
        // Play SFX based on what was interacted with
        this.onInteract(event.targetId);
      } else if (event.type === 'game/characterSwitch') {
        // Handle visual character switch
        this.onCharacterSwitch(event.roleId);
      }
    });
  }
  
  private onCompanionCall() {
    console.log('[GameApp] Companion call button pressed');
    
    // Play call SFX
    this.audioSystem?.playSfx(SFX_KEYS.COMPANION_CALL, { volume: 0.7 });
    
    if (!this.companion) {
      console.warn('[GameApp] No companion available');
      return;
    }
    
    if (!this.taskSystem) {
      console.warn('[GameApp] No task system available');
      return;
    }
    
    const targetId = this.taskSystem.getCurrentTargetId();
    console.log('[GameApp] Current task target:', targetId);
    
    if (!targetId) {
      console.warn('[GameApp] No task target available');
      return;
    }
    
    // Find target interactable from stored array
    const interactable = this.interactables.find(i => i.id === targetId);
    if (interactable) {
      console.log('[GameApp] Leading companion to:', targetId, 'at position:', interactable.mesh.position);
      this.companion.transitionTo('LeadToTarget', interactable.mesh.position, targetId);
    } else {
      console.warn('[GameApp] Could not find interactable with id:', targetId);
      console.log('[GameApp] Available interactables:', this.interactables.map(i => i.id));
    }
  }
  
  private onCharacterSwitch(roleId: RoleId): void {
    console.log('[GameApp] Handling character switch to:', roleId);
    
    // Update PlayerController to control the new active player
    if (this.playerController && this.currentWorld) {
      const newActivePlayer = this.currentWorld.getActivePlayer();
      this.playerController.setPlayerEntity(newActivePlayer);
      console.log(`[GameApp] PlayerController now controlling: ${roleId}`);
    }
    
    // Camera will automatically follow the active player in update loop
  }
  
  private onAreaRequest(areaId: string, fromArea?: string, fromGateId?: string) {
    console.log('[GameApp] Area request:', areaId, 'from gate:', fromGateId);
    
    // Validate areaId at boundary
    if (!isAreaId(areaId)) {
      console.error('[GameApp] ❌ Invalid areaId:', areaId);
      if (import.meta.env.DEV) {
        throw new Error(`Invalid area ID: ${areaId}`);
      }
      return;
    }
    
    // areaId is now narrowed to AreaId type by the type guard above
    
    // Get current role from TaskSystem (not startParams)
    const currentRole = this.taskSystem?.getCurrentRole() || 'boy';
    
    // Check if area is unlocked for current role
    const unlockedAreas = saveFacade.getUnlockedAreas(currentRole);
    console.log('[GameApp] Unlocked areas for role:', currentRole, unlockedAreas);
    
    if (unlockedAreas.includes(areaId)) {
      // Save inventory before transitioning
      const inventory = this.taskSystem?.getInventory() || [];
      saveFacade.setInventory(currentRole, inventory);
      
      // Update session to maintain current role across area transition
      sessionFacade.setRole(currentRole);
      
      // Area unlocked - compute entry gate and set pending spawn
      const currentAreaRaw: string | undefined = sessionFacade.getSession().areaId ?? fromArea;
      // Runtime type guard to validate area ID from session
      const currentArea: AreaId | undefined = isAreaId(currentAreaRaw) 
        ? currentAreaRaw 
        : (fromArea && isAreaId(fromArea) ? fromArea : undefined);
      
      // If fromGateId provided, compute entryGateId via GATE_PAIR
      let entryGateId: InteractableId | undefined;
      if (fromGateId) {
        entryGateId = GATE_PAIR[fromGateId as InteractableId];
        if (!entryGateId) {
          console.error('[GameApp] ❌ No gate pair found for:', fromGateId, '- Add to GATE_PAIR mapping!');
          if (import.meta.env.DEV) {
            throw new Error(`Missing gate pair for ${fromGateId}`);
          }
        } else {
          console.log('[GameApp] Computed entry gate:', entryGateId);
        }
      } else if (import.meta.env.DEV && fromArea) {
        console.warn('[GameApp] ⚠️ Gate transition without fromGateId - falling back to default spawn');
      }
      
      // Set pending spawn for world to consume (areaId already validated above)
      setPendingSpawn({
        toArea: areaId,
        entryGateId,
      });
      
      console.log('[GameApp] Area unlocked, transitioning from', currentArea, 'to:', areaId, 'as:', currentRole);
      sessionFacade.setArea(areaId, currentArea);
      // GameHost will remount automatically
    } else {
      // Area locked - show soft block
      console.log('[GameApp] Area locked, showing toast');
      this.bus.emit({ 
        type: 'ui/toast', 
        level: 'info', 
        message: 'Keep exploring to go deeper.' 
      });
    }
  }
  
  private onInteract(targetId: string) {
    // Play appropriate SFX based on target
    if (targetId === 'axe') {
      this.audioSystem?.playSfx(SFX_KEYS.SUCCESS, { volume: 0.5 });
    } else if (targetId === 'logPile') {
      this.audioSystem?.playSfx(SFX_KEYS.CHOP, { volume: 0.7 });
    } else if (targetId === 'campfire') {
      this.audioSystem?.playSfx(SFX_KEYS.FIRE_IGNITE, { volume: 0.8 });
    }
  }

  /**
   * Start the game loop
   */
  async start() {
    if (this.isRunning) {
      console.warn('[GameApp] Already running, ignoring start() call');
      return;
    }
    // console.log('[GameApp] Starting...');
    this.isRunning = true;
    
    // Initialize audio system
    this.audioSystem = new AudioSystem();
    
    // Load audio assets
    await this.loadAudioAssets();

    // Create world based on areaId with lazy loading for performance
    let world: WorldResult & {
      companion: Companion;
      interactables: Array<{ id: string; mesh: AbstractMesh; interact: () => void; dispose: () => void }>;
      campfire?: unknown;
      dispose: () => void;
    };
    
    if (this.startParams.areaId === 'backyard') {
      // console.log('[GameApp] Loading BackyardWorld (lazy)...');
      const { createBackyardWorld } = await import('./worlds/backyard/BackyardWorld');
      world = createBackyardWorld(this.scene, this.bus, this.startParams.roleId, this.startParams.fromArea);
    } else if (this.startParams.areaId === 'woodline') {
      console.log('[GameApp] Loading WoodlineWorld (lazy)...');
      const { createWoodlineWorld } = await import('./worlds/woodline/WoodlineWorld');
      world = createWoodlineWorld(this.scene, this.bus, this.startParams.roleId, this.startParams.fromArea);
    } else if (this.startParams.areaId === 'creek') {
      console.log('[GameApp] Loading CreekWorld (lazy)...');
      const { createCreekWorld } = await import('./worlds/creek/CreekWorld');
      world = createCreekWorld(this.scene, this.bus, this.startParams.roleId, this.startParams.fromArea);
    } else if (this.startParams.areaId === 'pine') {
      console.log('[GameApp] Loading PineWorld (lazy)...');
      const { createPineWorld } = await import('./worlds/pine/PineWorld');
      world = createPineWorld(this.scene, this.bus, this.startParams.roleId, this.startParams.fromArea);
    } else if (this.startParams.areaId === 'dusk') {
      console.log('[GameApp] Loading DuskWorld (lazy)...');
      const { createDuskWorld } = await import('./worlds/dusk/DuskWorld');
      world = createDuskWorld(this.scene, this.bus, this.startParams.roleId, this.startParams.fromArea);
    } else if (this.startParams.areaId === 'night') {
      console.log('[GameApp] Loading NightWorld (lazy)...');
      const { createNightWorld } = await import('./worlds/night/NightWorld');
      world = createNightWorld(this.scene, this.bus, this.startParams.roleId, this.startParams.fromArea);
    } else if (this.startParams.areaId === 'beach') {
      console.log('[GameApp] Loading BeachWorld (lazy)...');
      const { createBeachWorld } = await import('./worlds/beach/BeachWorld');
      world = createBeachWorld(this.scene, this.bus, this.startParams.roleId, this.startParams.fromArea);
    } else {
      // Fallback to BootWorld for debug/dev only (not lazy-loaded since it's dev-only)
      console.log('[GameApp] Loading BootWorld (debug fallback)');
      world = createBootWorld(this.scene, this.bus, this.startParams.roleId);
    }
    
    this.worldDispose = world.dispose;
    this.currentWorld = world; // Store WorldResult reference
    this.companion = world.companion;
    this.campfire = (world.campfire as { update?: (dt: number) => void }) || null;
    this.interactables = world.interactables;
    
    // Create camera rig
    const canvas = this.engine.getRenderingCanvas();
    if (canvas) {
      this.cameraRig = new CameraRig(this.scene, canvas);
    }
    
    // Create FX system
    this.fxSystem = new FxSystem(this.scene);
    
    // console.log('[GameApp] World loaded:', {
    //   companion: this.companion.mesh.position,
    //   interactables: this.interactables.length
    // });

    // Create player controller
    this.playerController = new PlayerController(this.scene, this.getActivePlayerMesh());
    this.playerController.setPlayerEntity(this.getActivePlayerEntity());
    
    // Snap camera behind player's spawn forward direction (after target is established)
    // and reset yaw baseline so first frame delta = 0
    if (this.cameraRig) {
      const activePlayerMesh = this.getActivePlayerMesh();
      // Do one update to establish target
      this.cameraRig.update(activePlayerMesh.position, undefined, 1/60, 0);
      // Now snap to spawn forward
      const spawnForward = new Vector3(world.spawnForward.x, world.spawnForward.y, world.spawnForward.z);
      this.cameraRig.snapBehindForward(spawnForward);
      // Reset yaw delta baseline to prevent first-frame rotation
      this.playerController.resetYawBaseline();
    }

    // Create task system
    this.taskSystem = new TaskSystem(this.bus);
    
    // Determine starting role (prioritize startParams, fallback to lastSelectedRole)
    const saveData = saveFacade.loadMain();
    const startRole = this.startParams.roleId || saveData.lastSelectedRole || 'boy';
    
    // Load saved inventory for starting role and set role
    const savedInventory = saveFacade.getInventory(startRole);
    this.taskSystem.switchCharacter(startRole, savedInventory);
    // console.log(`[GameApp] Started as ${startRole} with inventory:`, savedInventory);
    
    // Emit appReady event so UI can safely request inventory
    this.bus.emit({ type: 'game/appReady', roleId: startRole });
    // console.log(`[GameApp] Emitted game/appReady with role: ${startRole}`);
    
    // Create character switch system (orchestrates switching)
    this.characterSwitchSystem = new CharacterSwitchSystem(this.bus, this.taskSystem);
    // console.log('[GameApp] CharacterSwitchSystem initialized');
    
    // Wire up player references for visual switching
    if (this.currentWorld && this.characterSwitchSystem) {
      this.characterSwitchSystem.setPlayers(this.currentWorld.boyPlayer, this.currentWorld.girlPlayer);
      this.characterSwitchSystem.setWorld(this.currentWorld);
      // console.log('[GameApp] Wired boy/girl player references and world to CharacterSwitchSystem');
    }
    
    // Create interaction system
    this.interactionSystem = new InteractionSystem(this.taskSystem, this.bus);
    
    // Register interactables
    world.interactables.forEach((interactable) => {
      this.interactionSystem!.registerInteractable(interactable);
    });
    
    // Enable dynamic registration for late-loading assets
    if ('registerDynamic' in world && typeof world.registerDynamic === 'function') {
      (world.registerDynamic as (callback: (interactable: { id: string; mesh: AbstractMesh; interact: () => void; dispose: () => void }) => void) => void)((interactable: { id: string; mesh: AbstractMesh; interact: () => void; dispose: () => void }) => {
        this.interactionSystem!.registerInteractable(interactable);
        // console.log(`[GameApp] Dynamically registered interactable: ${interactable.id}`);
      });
    }
    
    // Store original interact functions and wrap them with logging
    world.interactables.forEach((interactable) => {
      const originalInteract = interactable.interact;
      interactable.interact = () => {
        console.log(`Interacted with ${interactable.id}`);
        originalInteract();
      };
    });

    // DEV-only: Validate world manifest exists for current area
    if (import.meta.env.DEV) {
      const { WORLD_MANIFESTS } = await import('./worlds/worldManifest');
      if (!WORLD_MANIFESTS[this.startParams.areaId]) {
        console.warn(`[GameApp] ⚠️  Area '${this.startParams.areaId}' has no world manifest`);
        this.bus.emit({ 
          type: 'ui/toast', 
          level: 'warning', 
          message: `Dev: Area ${this.startParams.areaId} missing manifest` 
        });
      }
    }

    // Create progression system and start
    const useDevBootFallback = import.meta.env.DEV && !['backyard', 'woodline'].includes(this.startParams.areaId);
    // console.log('[GameApp] ProgressionSystem devBootFallback:', useDevBootFallback);
    this.progressionSystem = new ProgressionSystem(
      this.taskSystem,
      startRole, // Use determined start role
      this.startParams.areaId,
      { devBootFallback: useDevBootFallback }
    );
    this.progressionSystem.start();
    
    // Wire progression system to character switch system for task reloading
    if (this.characterSwitchSystem && this.progressionSystem) {
      this.characterSwitchSystem.setProgressionSystem(this.progressionSystem);
      // console.log('[GameApp] Wired ProgressionSystem to CharacterSwitchSystem');
    }
    
    // Wire interaction system to character switch system for clearing dwell state
    if (this.characterSwitchSystem && this.interactionSystem) {
      this.characterSwitchSystem.setInteractionSystem(this.interactionSystem);
      // console.log('[GameApp] Wired InteractionSystem to CharacterSwitchSystem');
    }
    
    // Create autosave system (after task system is ready)
    this.autosaveSystem = new AutosaveSystem(
      this.bus,
      this.taskSystem,
      startRole, // Use determined start role
      this.startParams.areaId
    );
    this.autosaveSystem.start();
    // console.log('[GameApp] Autosave system started');

    // Wire autosave system to character switch system for role updates
    if (this.characterSwitchSystem && this.autosaveSystem) {
      this.characterSwitchSystem.setAutosaveSystem(this.autosaveSystem);
      // console.log('[GameApp] Wired AutosaveSystem to CharacterSwitchSystem');
    }

    // Create wake radius system
    this.wakeRadiusSystem = new WakeRadiusSystem(this.scene, this.bus);
    this.wakeRadiusSystem.setTaskSystem(this.taskSystem);

    // Create debug overlay (dev only)
    if (import.meta.env.DEV) {
      // === DEV TRACE HARNESS (Phase 2.8) ===
      // console.log('[GameApp] Initializing Phase 2.8 trace harness...');
      
      // Import trace utilities
      const { trace } = await import('./debug/trace/trace');
      const { traceBuffer } = await import('./debug/trace/TraceBuffer');
      const { attachEventBusTap } = await import('./debug/trace/attachEventBusTap');
      const { attachSaveFacadeTap } = await import('./debug/trace/attachSaveFacadeTap');
      const { setSnapshotRefs, captureSnapshot, isSnapshotConsistent, getSnapshotMismatches } = await import('./debug/trace/snapshot');
      
      // Set snapshot system references
      if (this.taskSystem && this.currentWorld && this.progressionSystem && this.autosaveSystem) {
        setSnapshotRefs(
          this.taskSystem,
          this.currentWorld,
          this.progressionSystem,
          this.autosaveSystem as unknown as { roleId?: 'boy' | 'girl' }
        );
      }
      
      // Attach taps to EventBus and saveFacade
      attachEventBusTap(this.bus);
      attachSaveFacadeTap(saveFacade as Parameters<typeof attachSaveFacadeTap>[0]);
      
      // Expose globals for console access
      (window as { __trace?: typeof trace }).__trace = trace;
      (window as { __traceDump?: (count?: number, category?: 'event' | 'save' | 'switch' | 'system' | 'error') => unknown }).__traceDump = (count?: number, category?: 'event' | 'save' | 'switch' | 'system' | 'error') => {
        const entries = category ? traceBuffer.getByCategory(category, count) : traceBuffer.getLast(count);
        console.group(`📊 Trace Dump (${entries.length} entries)`);
        entries.forEach((entry, _idx) => {
          const time = new Date(entry.t).toLocaleTimeString('en-US', { hour12: false });
          const icon = entry.level === 'error' ? '🔥' : entry.level === 'warn' ? '⚠️' : '📝';
          console.log(`${icon} [${time}] [${entry.cat}] ${entry.msg}`, entry.data ?? '');
        });
        console.groupEnd();
        return entries;
      };
      
      (window as { __traceClear?: () => void }).__traceClear = () => {
        traceBuffer.clear();
        console.log('🧹 Trace buffer cleared');
      };
      
      (window as { __traceStats?: () => unknown }).__traceStats = () => {
        const stats = traceBuffer.getStats();
        console.log('📊 Trace buffer stats:', stats);
        return stats;
      };
      
      (window as { __snapshot?: () => unknown }).__snapshot = () => {
        const snap = captureSnapshot();
        const consistent = isSnapshotConsistent(snap);
        const mismatches = getSnapshotMismatches(snap);
        console.group('📸 Role Snapshot');
        console.log('TaskSystem role:', snap.taskRole);
        console.log('World role:', snap.worldRole);
        console.log('ProgressionSystem role:', snap.progressRole);
        console.log('AutosaveSystem role:', snap.autosaveRole);
        console.log('Inventory count:', snap.inventoryCount);
        console.log('Current task:', snap.currentTaskId);
        console.log('---');
        console.log(consistent ? '✅ All roles consistent' : '❌ ROLE DESYNC DETECTED');
        if (mismatches.length > 0) {
          console.error('Mismatches:', mismatches);
        }
        console.groupEnd();
        return snap;
      };
      
      // console.log('[GameApp] ✅ Trace harness initialized');
      // console.log('[GameApp] Available commands:');
      // console.log('  - __traceDump(count?, category?) — Show last N trace entries');
      // console.log('  - __traceClear() — Clear trace buffer');
      // console.log('  - __traceStats() — Show buffer stats');
      // console.log('  - __snapshot() — Capture current role state across all systems');
      // console.log('  - window.__traceConfig — Toggle console logging per category');
      
      // === END TRACE HARNESS ===
      
      this.debugOverlay = new DebugOverlay(this.scene);
      // Set player mesh for position tracking in perf overlay
      if (this.currentWorld) {
        const activePlayer = this.getActivePlayerEntity();
        if (activePlayer?.mesh && 'sourceMesh' in activePlayer.mesh) {
          this.debugOverlay.setPlayerMesh(activePlayer.mesh as any);
        }
      }
      this.companionDebugHelper = new CompanionDebugHelper();
      if (this.companion) {
        this.companionDebugHelper.setCompanion(this.companion);
      }
      this.playerDebugHelper = new PlayerDebugHelper(this.scene);
      if (this.currentWorld) {
        this.playerDebugHelper.setPlayer(this.getActivePlayerEntity());
      }

      // Create world editor (disabled by default)
      this.worldEditor = new WorldEditor(this.scene, this.startParams.areaId);

      // Toggle world editor with F2 key, debug overlay with F3
      this.worldEditorKeyHandler = (e: KeyboardEvent) => {
        if (e.key === 'F2' && this.worldEditor) {
          this.worldEditor.toggle();
        } else if (e.key === 'F3' && this.switchDebugOverlay) {
          this.switchDebugOverlay.toggle();
        }
      };
      window.addEventListener('keydown', this.worldEditorKeyHandler);
      
      // Create switch debug overlay
      this.switchDebugOverlay = new SwitchDebugOverlay();
      // console.log('[GameApp] Switch Debug Overlay created (F3 to toggle)');

      // Setup cheat system
      const cheatSystem = new CheatSystem();
      cheatSystem.setTaskSystem(this.taskSystem);
      const cheats = createDefaultCheats(cheatSystem);
      cheats.forEach(cheat => cheatSystem.registerCheat(cheat));
      
      // Expose to window for console access
      (window as { __cheats?: CheatSystem }).__cheats = cheatSystem;
      (window as { giveitem?: (itemId: string) => void }).giveitem = (itemId: string) => cheatSystem.giveItem(itemId);
      (window as { givefind?: (areaId: string, findId: string) => void }).givefind = (areaId: string, findId: string) => cheatSystem.giveFind(areaId, findId);
      (window as { setfindcount?: (areaId: string, count: number) => void }).setfindcount = (areaId: string, count: number) => cheatSystem.setFindCount(areaId, count);
      (window as { unlockpostcard?: (areaId: string) => void }).unlockpostcard = (areaId: string) => cheatSystem.unlockPostcard(areaId);
      (window as { unlocktrophy?: (areaId: string) => void }).unlocktrophy = (areaId: string) => cheatSystem.unlockTrophy(areaId);

      // console.log('[GameApp] Press F2 to toggle World Editor');
      // console.log('[GameApp] Cheats available:');
      // console.log('  - giveitem("itemId")');
      // console.log('  - givefind("areaId", "findId")');
      // console.log('  - setfindcount("areaId", count)');
      // console.log('  - unlockpostcard("areaId")');
      // console.log('  - unlocktrophy("areaId")');
    }

    // Add interactables as wakeables
    if (this.wakeRadiusSystem) {
      world.interactables.forEach((interactable) => {
        // Start interactables disabled (asleep)
        interactable.mesh.setEnabled(false);
        
        const wakeable: Wakeable = {
          id: interactable.id,
          mesh: interactable.mesh,
          asleep: true,
          wake: () => {
            console.log('[WakeRadius] Waking:', interactable.id);
            interactable.mesh.setEnabled(true);
            wakeable.asleep = false;
          },
          sleep: () => {
            console.log('[WakeRadius] Sleeping:', interactable.id);
            interactable.mesh.setEnabled(false);
            wakeable.asleep = true;
          },
        };
        this.wakeRadiusSystem!.addWakeable(wakeable);
      });
    }

    // Start ambient loop
    if (this.audioSystem) {
      this.ambientLoop = this.audioSystem.playLoop(AMBIENT_KEYS.FOREST, { 
        volume: 0.3, 
        fadeIn: 2.0 
      });
    }

    // Start render loop
    const renderCallback = () => {
      if (this.isRunning && !this.scene.isDisposed && !this.engine.isDisposed) {
        const dt = this.engine.getDeltaTime() / 1000;
        this.update(dt);
        this.scene.render();
      }
    };
    
    this.engine.runRenderLoop(renderCallback);

    // Emit ready event
    this.bus.emit({ type: 'game/ready' });
  }
  
  /**
   * Load all audio assets
   */
  private async loadAudioAssets(): Promise<void> {
    if (!this.audioSystem) return;
    
    const audioPromises: Promise<void>[] = [];
    
    // Load all audio files from manifest
    Object.entries(AUDIO).forEach(([key, path]) => {
      audioPromises.push(this.audioSystem!.loadAudio(key, path));
    });
    
    await Promise.all(audioPromises);
    // console.log('[GameApp] Audio assets loaded');
  }

  /**
   * Get the currently active player entity using WorldResult contract
   */
  private getActivePlayerEntity(): Player {
    if (!this.currentWorld) {
      throw new Error('[GameApp] No world loaded');
    }
    return this.currentWorld.getActivePlayer();
  }

  /**
   * Get the currently active player mesh using WorldResult contract
   */
  private getActivePlayerMesh(): TransformNode {
    if (!this.currentWorld) {
      throw new Error('[GameApp] No world loaded');
    }
    return this.currentWorld.getActiveMesh();
  }

  private update(dt: number) {
    // Update player controller
    this.playerController?.update(dt);

    // Determine active player for camera/systems
    const activePlayer = this.getActivePlayerMesh();

    // Update companion AI
    if (this.companion && activePlayer) {
      // Validate player position before passing to companion
      const pos = activePlayer.position;
      if (!isNaN(pos.x) && !isNaN(pos.y) && !isNaN(pos.z)) {
        this.companion.update(dt, pos);
      }
    }
    
    // Update camera rig
    if (this.cameraRig && activePlayer) {
      // Get player yaw delta for keyboard rotation (A/D keys)
      const yawDelta = this.playerController?.getYawDelta() ?? 0;
      // Get movement intent for soft recenter logic
      const moveIntent = this.playerController?.getMoveIntent();
      // Optionally pass companion position as interest point when leading
      const interestPos = (this.companion && this.cameraRig) ? undefined : undefined;
      this.cameraRig.update(activePlayer.position, interestPos, dt, yawDelta, moveIntent);
    }
    
    // Update campfire VFX (if it has an update method)
    if (this.campfire && typeof this.campfire.update === 'function') {
      this.campfire.update(dt);
    }

    // Update interaction system
    if (this.interactionSystem && activePlayer) {
      this.interactionSystem.update(activePlayer.position, dt);
    }

    // Update wake radius system
    if (activePlayer && this.wakeRadiusSystem) {
      this.wakeRadiusSystem.update(activePlayer.position);
    }

    // Update debug overlay (dev only)
    if (this.debugOverlay && activePlayer) {
      this.debugOverlay.updateFPS(this.engine.getFps());
      this.debugOverlay.updatePosition(activePlayer.position);
      const targetId = this.taskSystem?.getCurrentTargetId();
      if (targetId) {
        this.debugOverlay.updateWakeState(1, targetId);
      }
    }
    
    // Update switch debug overlay (DEV only)
    if (import.meta.env.DEV && this.switchDebugOverlay && this.currentWorld && this.taskSystem && this.progressionSystem) {
      this.switchDebugOverlay.update(this.taskSystem, this.currentWorld, this.progressionSystem);
    }
  }

  
  private onRestart() {
    console.log('[GameApp] Restarting game');
    
    // Reset task system and progression
    if (this.taskSystem) {
      this.taskSystem.dispose();
      this.taskSystem = new TaskSystem(this.bus);
      
      // Recreate progression system
      this.progressionSystem = new ProgressionSystem(
        this.taskSystem,
        this.startParams.roleId,
        this.startParams.areaId,
        { devBootFallback: true }
      );
      this.progressionSystem.start();
    }
    
    // Reset player position
    if (this.currentWorld) {
      const activePlayerMesh = this.getActivePlayerMesh();
      activePlayerMesh.position.set(0, 0.9, 0);
    }
    
    // Reset companion to follow
    if (this.companion) {
      this.companion.mesh.position.set(3, 0.4, 2);
      this.companion.transitionTo('FollowPlayer');
    }
    
    // Reset camera
    this.cameraRig?.setMode('FOLLOW');
    
    console.log('[GameApp] Game restarted');
  }

  /**
   * Stop the game loop
   */
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    // Stop render loop
    this.engine.stopRenderLoop();

    // Clean up player controller
    this.playerController?.dispose();
    this.playerController = null;

    // Clean up camera rig
    this.cameraRig?.dispose();
    this.cameraRig = null;
    
    // Clean up FX system
    this.fxSystem?.dispose();
    this.fxSystem = null;

    // Clean up companion
    this.companion?.dispose();
    this.companion = null;
    
    // Clean up campfire
    this.campfire = null;

    // Clean up task system
    this.taskSystem?.dispose();
    this.taskSystem = null;

    // Clean up character switch system
    this.characterSwitchSystem?.dispose();
    this.characterSwitchSystem = null;

    // Clean up interaction system
    this.interactionSystem?.dispose();
    this.interactionSystem = null;
    this.interactables = [];
    
    // Clean up autosave system (includes final save)
    this.autosaveSystem?.dispose();
    this.autosaveSystem = null;

    // Clean up wake radius system
    this.wakeRadiusSystem?.dispose();
    this.wakeRadiusSystem = null;

    // Clean up debug overlay
    this.debugOverlay?.dispose();
    this.debugOverlay = null;
    
    // Clean up companion debug helper
    this.companionDebugHelper?.dispose();
    this.companionDebugHelper = null;
    
    // Clean up player debug helper
    this.playerDebugHelper?.dispose();
    this.playerDebugHelper = null;
    
    // Clean up world editor
    if (this.worldEditor) {
      this.worldEditor.dispose();
      this.worldEditor = null;
    }
    if (this.worldEditorKeyHandler) {
      window.removeEventListener('keydown', this.worldEditorKeyHandler);
      this.worldEditorKeyHandler = null;
    }
    
    // Clean up switch debug overlay
    if (this.switchDebugOverlay) {
      this.switchDebugOverlay.dispose();
      this.switchDebugOverlay = null;
    }
    
    // Stop ambient loop
    this.ambientLoop?.stop(1.0);
    this.ambientLoop = null;
    
    // Clean up audio system
    this.audioSystem?.dispose();
    this.audioSystem = null;

    // Clean up world
    this.worldDispose?.();
    this.worldDispose = null;

    // Remove listeners
    window.removeEventListener('resize', this.resizeHandler);
    
    // Unsubscribe from events
    this.eventUnsubscribe?.();
    this.eventUnsubscribe = null;

    // Stop render loop before disposing engine
    this.engine.stopRenderLoop();
    
    // Dispose scene and engine
    this.scene.dispose();
    this.engine.dispose();
  }
}
