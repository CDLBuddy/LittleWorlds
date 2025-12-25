import { Engine, Scene, AbstractMesh } from '@babylonjs/core';
import { eventBus } from './shared/events';
import { createBootWorld } from './worlds/BootWorld';
import { PlayerController } from './entities/player/controller';
import { WakeRadiusSystem, type Wakeable } from './systems/interactions/wakeRadius';
import { DebugOverlay } from './debug/DebugOverlay';

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
  private player: AbstractMesh | null = null;
  private debugOverlay: DebugOverlay | null = null;

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
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Create the boot world
    const world = createBootWorld(this.scene);
    this.worldDispose = world.dispose;
    this.player = world.player;

    // Create player controller
    this.playerController = new PlayerController(this.scene, world.player);

    // Create wake radius system
    this.wakeRadiusSystem = new WakeRadiusSystem(this.scene, this.bus);

    // Create debug overlay (dev only)
    if (import.meta.env.DEV) {
      this.debugOverlay = new DebugOverlay();
    }

    // Add campfire as wakeable
    if (world.interactables.length > 0) {
      const campfire = world.interactables[0];
      const wakeable: Wakeable = {
        id: 'campfire',
        mesh: campfire,
        asleep: true,
        wake: () => {
          campfire.setEnabled(true);
          wakeable.asleep = false;
        },
        sleep: () => {
          campfire.setEnabled(false);
          wakeable.asleep = true;
        },
      };
      this.wakeRadiusSystem.addWakeable(wakeable);
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

    // Update wake radius system
    if (this.player && this.wakeRadiusSystem) {
      this.wakeRadiusSystem.update(this.player.position);
    }

    // Update debug overlay (dev only)
    if (this.debugOverlay && this.player) {
      this.debugOverlay.updateFPS(this.engine.getFps());
      this.debugOverlay.updatePosition(this.player.position);
      this.debugOverlay.updateWakeState(1, 'campfire');
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

    // Dispose scene and engine
    this.scene.dispose();
    this.engine.dispose();
  }
}
