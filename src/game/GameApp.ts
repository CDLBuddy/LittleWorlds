import { Engine, Scene, AbstractMesh, TransformNode } from '@babylonjs/core';
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
import type { RoleId, AreaId } from './content/areas';
import { ProgressionSystem } from './systems/progression/ProgressionSystem';
import { AutosaveSystem } from './systems/autosave/AutosaveSystem';
import { saveFacade } from './systems/saves/saveFacade';
import * as sessionFacade from './session/sessionFacade';
import { CharacterSwitchSystem } from './systems/characters/CharacterSwitchSystem';
import { CheatSystem, createDefaultCheats } from './debug/cheats';

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
  private player: TransformNode | null = null;
  private companion: Companion | null = null;
  private campfire: typeof import('@game/entities/props/Campfire').Campfire.prototype | null = null;
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
  private playerEntity: Player | null = null;
  private boyPlayer: Player | null = null;
  private girlPlayer: Player | null = null;
  private progressionSystem: ProgressionSystem | null = null;
  private autosaveSystem: AutosaveSystem | null = null;
  private characterSwitchSystem: CharacterSwitchSystem | null = null;
  private startParams: { roleId: RoleId; areaId: AreaId; fromArea?: AreaId };

  constructor(canvas: HTMLCanvasElement, private bus: typeof eventBus, startParams: { roleId: RoleId; areaId: AreaId; fromArea?: AreaId }) {
    this.startParams = startParams;
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
        // Handle gate area request
        this.onAreaRequest(event.areaId);
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
        if (event.complete && this.player) {
          // Notify progression system
          if (this.progressionSystem) {
            this.progressionSystem.handleTaskEvent(event.taskId, true);
          }
          // Spawn confetti at player position
          this.fxSystem?.spawnConfetti(this.player.position.clone());
          // Play success sound
          this.audioSystem?.playSfx(SFX_KEYS.SUCCESS, { volume: 0.8 });
          // Trigger celebrate camera briefly
          this.cameraRig?.setMode('CELEBRATE');
          // Emit task complete event with position
          this.bus.emit({
            type: 'game/taskComplete',
            taskId: event.taskId,
            position: {
              x: this.player.position.x,
              y: this.player.position.y,
              z: this.player.position.z,
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
    const newActivePlayer = roleId === 'boy' ? this.boyPlayer : this.girlPlayer;
    if (newActivePlayer && this.playerController) {
      this.playerController.setPlayerEntity(newActivePlayer);
      console.log(`[GameApp] PlayerController now controlling: ${roleId}`);
    }
    
    // Camera will automatically follow the active player in update loop
  }
  
  private onAreaRequest(areaId: string) {
    console.log('[GameApp] Area request:', areaId);
    
    // Get current role from TaskSystem (not startParams)
    const currentRole = this.taskSystem?.getCurrentRole() || 'boy';
    
    // Check if area is unlocked for current role
    const unlockedAreas = saveFacade.getUnlockedAreas(currentRole);
    console.log('[GameApp] Unlocked areas for role:', currentRole, unlockedAreas);
    
    if (unlockedAreas.includes(areaId as AreaId)) {
      // Save inventory before transitioning
      const inventory = this.taskSystem?.getInventory() || [];
      saveFacade.setInventory(currentRole, inventory);
      
      // Area unlocked - transition (get current area from session, not startParams)
      const currentArea = sessionFacade.getSession().areaId;
      console.log('[GameApp] Area unlocked, transitioning from', currentArea, 'to:', areaId);
      sessionFacade.setArea(areaId as AreaId, currentArea ?? undefined);
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
    console.log('[GameApp] Starting...');
    this.isRunning = true;
    
    // Initialize audio system
    this.audioSystem = new AudioSystem();
    
    // Load audio assets
    await this.loadAudioAssets();

    // Create world based on areaId with lazy loading for performance
    let world: {
      player: TransformNode;
      playerEntity: Player;
      boyPlayer?: Player;
      girlPlayer?: Player;
      companion: Companion;
      interactables: Array<{ id: string; mesh: AbstractMesh; interact: () => void; dispose: () => void }>;
      campfire?: any;
      dispose: () => void;
    };
    
    if (this.startParams.areaId === 'backyard') {
      console.log('[GameApp] Loading BackyardWorld (lazy)...');
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
    this.player = world.player;
    this.playerEntity = world.playerEntity;
    this.boyPlayer = world.boyPlayer || null;
    this.girlPlayer = world.girlPlayer || null;
    this.companion = world.companion;
    this.campfire = world.campfire || null;
    this.interactables = world.interactables;
    
    // Create camera rig
    const canvas = this.engine.getRenderingCanvas();
    if (canvas) {
      this.cameraRig = new CameraRig(this.scene, canvas);
    }
    
    // Create FX system
    this.fxSystem = new FxSystem(this.scene);
    
    console.log('[GameApp] World loaded:', {
      companion: this.companion.mesh.position,
      interactables: this.interactables.length
    });

    // Create player controller
    this.playerController = new PlayerController(this.scene, world.player);
    if (this.playerEntity) {
      this.playerController.setPlayerEntity(this.playerEntity);
    }

    // Create task system
    this.taskSystem = new TaskSystem(this.bus);
    
    // Determine starting role (prioritize startParams, fallback to lastSelectedRole)
    const saveData = saveFacade.loadMain();
    const startRole = this.startParams.roleId || saveData.lastSelectedRole || 'boy';
    
    // Load saved inventory for starting role and set role
    const savedInventory = saveFacade.getInventory(startRole);
    this.taskSystem.switchCharacter(startRole, savedInventory);
    console.log(`[GameApp] Started as ${startRole} with inventory:`, savedInventory);
    
    // Emit appReady event so UI can safely request inventory
    this.bus.emit({ type: 'game/appReady', roleId: startRole });
    console.log(`[GameApp] Emitted game/appReady with role: ${startRole}`);
    
    // Create character switch system (orchestrates switching)
    this.characterSwitchSystem = new CharacterSwitchSystem(this.bus, this.taskSystem);
    console.log('[GameApp] CharacterSwitchSystem initialized');
    
    // Wire up player references for visual switching
    if (this.boyPlayer && this.girlPlayer && this.characterSwitchSystem) {
      this.characterSwitchSystem.setPlayers(this.boyPlayer, this.girlPlayer);
      console.log('[GameApp] Wired boy/girl player references to CharacterSwitchSystem');
    }
    
    // Create interaction system
    this.interactionSystem = new InteractionSystem(this.taskSystem, this.bus);
    
    // Register interactables
    world.interactables.forEach((interactable) => {
      this.interactionSystem!.registerInteractable(interactable);
    });
    
    // Enable dynamic registration for late-loading assets
    if ('registerDynamic' in world && typeof world.registerDynamic === 'function') {
      world.registerDynamic((interactable: { id: string; mesh: AbstractMesh; interact: () => void; dispose: () => void }) => {
        this.interactionSystem!.registerInteractable(interactable);
        console.log(`[GameApp] Dynamically registered interactable: ${interactable.id}`);
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
        } as any);
      }
    }

    // Create progression system and start
    const useDevBootFallback = import.meta.env.DEV && !['backyard', 'woodline'].includes(this.startParams.areaId);
    console.log('[GameApp] ProgressionSystem devBootFallback:', useDevBootFallback);
    this.progressionSystem = new ProgressionSystem(
      this.taskSystem,
      startRole, // Use determined start role
      this.startParams.areaId,
      { devBootFallback: useDevBootFallback }
    );
    this.progressionSystem.start();
    
    // Create autosave system (after task system is ready)
    this.autosaveSystem = new AutosaveSystem(
      this.bus,
      this.taskSystem,
      startRole, // Use determined start role
      this.startParams.areaId
    );
    this.autosaveSystem.start();
    console.log('[GameApp] Autosave system started');

    // Create wake radius system
    this.wakeRadiusSystem = new WakeRadiusSystem(this.scene, this.bus);
    this.wakeRadiusSystem.setTaskSystem(this.taskSystem);

    // Create debug overlay (dev only)
    if (import.meta.env.DEV) {
      this.debugOverlay = new DebugOverlay(this.scene);
      this.companionDebugHelper = new CompanionDebugHelper();
      if (this.companion) {
        this.companionDebugHelper.setCompanion(this.companion);
      }
      this.playerDebugHelper = new PlayerDebugHelper(this.scene);
      if (this.playerEntity) {
        this.playerDebugHelper.setPlayer(this.playerEntity);
      }

      // Create world editor (disabled by default)
      this.worldEditor = new WorldEditor(this.scene, this.startParams.areaId);

      // Toggle world editor with F2 key
      this.worldEditorKeyHandler = (e: KeyboardEvent) => {
        if (e.key === 'F2' && this.worldEditor) {
          this.worldEditor.toggle();
        }
      };
      window.addEventListener('keydown', this.worldEditorKeyHandler);

      // Setup cheat system
      const cheatSystem = new CheatSystem();
      cheatSystem.setTaskSystem(this.taskSystem);
      const cheats = createDefaultCheats(cheatSystem);
      cheats.forEach(cheat => cheatSystem.registerCheat(cheat));
      
      // Expose to window for console access
      (window as any).__cheats = cheatSystem;
      (window as any).giveitem = (itemId: string) => cheatSystem.giveItem(itemId);
      (window as any).givefind = (areaId: string, findId: string) => cheatSystem.giveFind(areaId, findId);
      (window as any).setfindcount = (areaId: string, count: number) => cheatSystem.setFindCount(areaId, count);
      (window as any).unlockpostcard = (areaId: string) => cheatSystem.unlockPostcard(areaId);
      (window as any).unlocktrophy = (areaId: string) => cheatSystem.unlockTrophy(areaId);

      console.log('[GameApp] Press F2 to toggle World Editor');
      console.log('[GameApp] Cheats available:');
      console.log('  - giveitem("itemId")');
      console.log('  - givefind("areaId", "findId")');
      console.log('  - setfindcount("areaId", count)');
      console.log('  - unlockpostcard("areaId")');
      console.log('  - unlocktrophy("areaId")');
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
    console.log('[GameApp] Audio assets loaded');
  }

  /**
   * Per-frame update
   */
  private update(dt: number) {
    // Update player controller
    this.playerController?.update(dt);

    // Determine active player for camera/systems
    const activePlayer = this.boyPlayer?.isActive ? this.boyPlayer.mesh : this.girlPlayer?.isActive ? this.girlPlayer.mesh : this.player;

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
      // Optionally pass companion position as interest point when leading
      const interestPos = (this.companion && this.cameraRig) ? undefined : undefined;
      this.cameraRig.update(activePlayer.position, interestPos, dt, yawDelta);
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
    if (this.player) {
      this.player.position.set(0, 0.9, 0);
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
    this.player = null;

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
