import { Engine, Scene, AbstractMesh } from '@babylonjs/core';
import { eventBus } from './shared/events';
import { createBootWorld } from './worlds/BootWorld';
import { PlayerController } from './entities/player/controller';
import { WakeRadiusSystem, type Wakeable } from './systems/interactions/wakeRadius';
import { DebugOverlay } from './debug/DebugOverlay';
import type { Companion } from './entities/companion/Companion';
import { TaskSystem } from './systems/tasks/TaskSystem';
import { InteractionSystem } from './systems/interactions/InteractionSystem';
import { campfire_v1 } from './content/tasks';

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
  private player: AbstractMesh | null = null;
  private companion: Companion | null = null;
  private debugOverlay: DebugOverlay | null = null;
  private interactables: Array<{ id: string; mesh: AbstractMesh }> = [];
  private eventUnsubscribe: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, private bus: typeof eventBus) {
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
    
    // Subscribe to UI events
    this.eventUnsubscribe = this.bus.on((event) => {
      if (event.type === 'ui/callCompanion') {
        this.onCompanionCall();
      }
    });
  }
  
  private onCompanionCall() {
    console.log('[GameApp] Companion call button pressed');
    
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

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Create the boot world
    const world = createBootWorld(this.scene, this.bus);
    this.worldDispose = world.dispose;
    this.player = world.player;
    this.companion = world.companion;
    this.interactables = world.interactables;
    
    console.log('[GameApp] World loaded:', {
      companion: this.companion.mesh.position,
      interactables: this.interactables.length
    });

    // Create player controller
    this.playerController = new PlayerController(this.scene, world.player);

    // Create task system
    this.taskSystem = new TaskSystem(this.bus);
    
    // Create interaction system
    this.interactionSystem = new InteractionSystem(this.taskSystem, this.bus);
    
    // Register interactables
    world.interactables.forEach((interactable) => {
      this.interactionSystem!.registerInteractable(interactable);
    });
    
    // Wire interactable callbacks to task system
    world.interactables.forEach((interactable) => {
      interactable.interact = () => {
        console.log(`Interacted with ${interactable.id}`);
      };
    });

    // Start the first task
    this.taskSystem.startTask(campfire_v1);

    // Create wake radius system
    this.wakeRadiusSystem = new WakeRadiusSystem(this.scene, this.bus);
    this.wakeRadiusSystem.setTaskSystem(this.taskSystem);

    // Create debug overlay (dev only)
    if (import.meta.env.DEV) {
      this.debugOverlay = new DebugOverlay();
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

    // Start render loop
    this.engine.runRenderLoop(() => {
      if (this.isRunning) {
        const dt = this.engine.getDeltaTime() / 1000;
        this.update(dt);
        this.scene.render();
      }
    });

    // Emit ready event
    this.bus.emit({ type: 'game/ready' });
  }

  /**
   * Per-frame update
   */
  private update(dt: number) {
    // Update player controller
    this.playerController?.update(dt);

    // Update companion AI
    if (this.companion && this.player) {
      this.companion.update(dt, this.player.position);
    }

    // Update interaction system
    if (this.interactionSystem && this.player) {
      this.interactionSystem.update(this.player.position, dt);
    }

    // Update wake radius system
    if (this.player && this.wakeRadiusSystem) {
      this.wakeRadiusSystem.update(this.player.position);
    }

    // Update debug overlay (dev only)
    if (this.debugOverlay && this.player) {
      this.debugOverlay.updateFPS(this.engine.getFps());
      this.debugOverlay.updatePosition(this.player.position);
      const targetId = this.taskSystem?.getCurrentTargetId();
      if (targetId) {
        this.debugOverlay.updateWakeState(1, targetId);
      }
    }
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

    // Clean up companion
    this.companion?.dispose();
    this.companion = null;

    // Clean up task system
    this.taskSystem?.dispose();
    this.taskSystem = null;

    // Clean up interaction system
    this.interactionSystem?.dispose();
    this.interactionSystem = null;
    this.interactables = [];

    // Clean up wake radius system
    this.wakeRadiusSystem?.dispose();
    this.wakeRadiusSystem = null;
    this.player = null;

    // Clean up debug overlay
    this.debugOverlay?.dispose();
    this.debugOverlay = null;

    // Clean up world
    this.worldDispose?.();
    this.worldDispose = null;

    // Remove listeners
    window.removeEventListener('resize', this.resizeHandler);
    
    // Unsubscribe from events
    this.eventUnsubscribe?.();
    this.eventUnsubscribe = null;

    // Dispose scene and engine
    this.scene.dispose();
    this.engine.dispose();
  }
}
