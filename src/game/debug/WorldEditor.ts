/**
 * WorldEditor - DEV-only tool for placing and positioning objects in the world
 * 
 * Features:
 * - Click ground to place position markers
 * - Select meshes and move them with keyboard
 * - Output positions as copy-paste ready code
 * - Visual gizmos for rotation/scale
 * 
 * Usage:
 *   const editor = new WorldEditor(scene);
 *   editor.enable();
 */

import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3, AbstractMesh, PointerEventTypes, KeyboardEventTypes, PickingInfo, Observer, PointerInfo, KeyboardInfo, LinesMesh } from '@babylonjs/core';

interface PositionMarker {
  mesh: AbstractMesh;
  position: Vector3;
  label: string;
  category: 'tree' | 'interactable' | 'prop' | 'general';
}

interface HistoryEntry {
  type: 'place' | 'delete' | 'move';
  marker?: PositionMarker;
  oldPosition?: Vector3;
  newPosition?: Vector3;
}

export class WorldEditor {
  private scene: Scene;
  private enabled = false;
  private markers: PositionMarker[] = [];
  private selectedMesh: AbstractMesh | null = null;
  private selectedMarker: PositionMarker | null = null;
  private pointerObserver: Observer<PointerInfo> | null = null;
  private keyObserver: Observer<KeyboardInfo> | null = null;
  private overlayDiv: HTMLDivElement | null = null;
  private commandsDiv: HTMLDivElement | null = null;
  private markerCount = 0;
  private gridSnap = false;
  private gridSize = 5;
  private currentCategory: 'tree' | 'interactable' | 'prop' | 'general' = 'general';
  private history: HistoryEntry[] = [];
  private historyIndex = -1;
  private gridHelper: LinesMesh | null = null;
  private lastClickTime = 0;
  private firstDistanceMarker: PositionMarker | null = null;
  private distanceLine: LinesMesh | null = null;
  private commandsVisible = true;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;

    // Create UI overlays
    this.createOverlay();
    this.createCommandPanel();
    this.loadSession();

    // Listen for clicks on ground to place markers
    this.pointerObserver = this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
        if (pointerInfo.event.button === 0 && pointerInfo.event.ctrlKey) {
          // Ctrl+Click to place marker
          this.handlePlaceMarker(pointerInfo.pickInfo);
        } else if (pointerInfo.event.button === 0 && pointerInfo.event.shiftKey) {
          // Shift+Click to select existing mesh or measure distance
          this.handleShiftClick(pointerInfo.pickInfo);
        } else if (pointerInfo.event.button === 0) {
          // Regular click - check for double-click on marker
          this.handleMarkerClick(pointerInfo.pickInfo);
        }
      }
    });

    // Listen for keyboard input
    this.keyObserver = this.scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type === KeyboardEventTypes.KEYDOWN && kbInfo.event) {
        const key = kbInfo.event.key.toLowerCase();
        
        // Category selection (1-4)
        if (key >= '1' && key <= '4') {
          const categories = ['general', 'tree', 'interactable', 'prop'] as const;
          this.currentCategory = categories[parseInt(key) - 1];
          this.updateStatus(`Category: ${this.currentCategory}`);
          console.log(`[WorldEditor] Category: ${this.currentCategory}`);
          return;
        }

        // Toggle grid snapping (G)
        if (key === 'g') {
          this.gridSnap = !this.gridSnap;
          this.updateStatus(`Grid snap: ${this.gridSnap ? `ON (${this.gridSize}u)` : 'OFF'}`);
          console.log(`[WorldEditor] Grid snap: ${this.gridSnap}`);
          if (this.gridSnap && !this.gridHelper) {
            this.createGridHelper();
          } else if (!this.gridSnap && this.gridHelper) {
            this.gridHelper.dispose();
            this.gridHelper = null;
          }
          return;
        }

        // Toggle command panel (H)
        if (key === 'h') {
          this.commandsVisible = !this.commandsVisible;
          if (this.commandsDiv) {
            this.commandsDiv.style.display = this.commandsVisible ? 'block' : 'none';
          }
          return;
        }

        // Duplicate marker/mesh (D)
        if (key === 'd' && this.selectedMarker) {
          this.handleDuplicate();
          return;
        }

        // Delete individual marker (Delete/Backspace)
        if ((key === 'delete' || key === 'backspace') && this.selectedMarker) {
          this.handleDeleteMarker(this.selectedMarker);
          return;
        }

        // Snap to ground (T)
        if (key === 't' && (this.selectedMesh || this.selectedMarker)) {
          if (this.selectedMarker) {
            const oldPos = this.selectedMarker.position.clone();
            this.selectedMarker.position.y = 0;
            this.selectedMarker.mesh.position.y = 0;
            this.addToHistory({ type: 'move', marker: this.selectedMarker, oldPosition: oldPos, newPosition: this.selectedMarker.position });
            this.updateStatus(`Snapped ${this.selectedMarker.label} to ground`);
          } else if (this.selectedMesh) {
            this.selectedMesh.position.y = 0;
            this.updateStatus(`Snapped ${this.selectedMesh.name} to ground`);
          }
          return;
        }

        // Scale adjustment (Z/X)
        if (key === 'z' && this.selectedMesh) {
          this.selectedMesh.scaling.scaleInPlace(0.9);
          this.updateStatus(`Scale: ${this.selectedMesh.scaling.x.toFixed(2)}`);
          return;
        }
        if (key === 'x' && this.selectedMesh) {
          this.selectedMesh.scaling.scaleInPlace(1.1);
          this.updateStatus(`Scale: ${this.selectedMesh.scaling.x.toFixed(2)}`);
          return;
        }

        // Undo/Redo (Ctrl+Z / Ctrl+Y)
        if (kbInfo.event.ctrlKey && key === 'z') {
          this.undo();
          return;
        }
        if (kbInfo.event.ctrlKey && key === 'y') {
          this.redo();
          return;
        }

        // Save session (Ctrl+S)
        if (kbInfo.event.ctrlKey && key === 's') {
          kbInfo.event.preventDefault();
          this.saveSession();
          return;
        }

        // Movement/Rotation for selected mesh
        if (this.selectedMesh) {
          this.handleKeyboardMove(key);
        }

        // Copy/Clear commands
        if (key === 'c' && !kbInfo.event.ctrlKey) {
          this.copyPositionsAsCode();
        }
      }
    });

    console.log('[WorldEditor] Enabled - Press H to toggle help panel');
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;

    if (this.pointerObserver) {
      this.scene.onPointerObservable.remove(this.pointerObserver);
      this.pointerObserver = null;
    }

    if (this.keyObserver) {
      this.scene.onKeyboardObservable.remove(this.keyObserver);
      this.keyObserver = null;
    }

    if (this.overlayDiv) {
      this.overlayDiv.remove();
      this.overlayDiv = null;
    }

    if (this.commandsDiv) {
      this.commandsDiv.remove();
      this.commandsDiv = null;
    }

    if (this.gridHelper) {
      this.gridHelper.dispose();
      this.gridHelper = null;
    }

    if (this.distanceLine) {
      this.distanceLine.dispose();
      this.distanceLine = null;
    }

    this.clearMarkers();
    console.log('[WorldEditor] Disabled');
  }

  private createOverlay() {
    this.overlayDiv = document.createElement('div');
    this.overlayDiv.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      pointer-events: none;
      z-index: 1000;
      min-width: 250px;
    `;

    this.overlayDiv.innerHTML = `
      <div style="color: #ff0; margin-bottom: 5px; font-weight: bold;">📍 STATUS</div>
      <div>Category: <span id="editor-category" style="color: #fff;">${this.currentCategory}</span></div>
      <div>Grid Snap: <span id="editor-gridsnap" style="color: #fff;">${this.gridSnap ? 'ON' : 'OFF'}</span></div>
      <div>Markers: <span id="editor-markers" style="color: #fff;">${this.markers.length}</span></div>
      <div style="margin-top: 5px; color: #fff; border-top: 1px solid #333; padding-top: 5px;" id="editor-status">Ready</div>
    `;

    document.body.appendChild(this.overlayDiv);
  }

  private updateOverlay() {
    if (!this.overlayDiv) return;
    
    const categoryEl = this.overlayDiv.querySelector('#editor-category');
    const gridSnapEl = this.overlayDiv.querySelector('#editor-gridsnap');
    const markersEl = this.overlayDiv.querySelector('#editor-markers');
    
    if (categoryEl) categoryEl.textContent = this.currentCategory;
    if (gridSnapEl) gridSnapEl.textContent = this.gridSnap ? 'ON' : 'OFF';
    if (markersEl) markersEl.textContent = String(this.markers.length);
  }

  private updateStatus(message: string) {
    if (this.overlayDiv) {
      const statusEl = this.overlayDiv.querySelector('#editor-status');
      if (statusEl) {
        statusEl.textContent = message;
      }
    }
    this.updateOverlay();
  }

  private handlePlaceMarker(pickInfo: PickingInfo | null) {
    if (!pickInfo || !pickInfo.hit || !pickInfo.pickedPoint) return;

    const position = pickInfo.pickedPoint.clone();
    
    // Apply grid snapping if enabled
    if (this.gridSnap) {
      position.x = Math.round(position.x / this.gridSize) * this.gridSize;
      position.z = Math.round(position.z / this.gridSize) * this.gridSize;
    }
    
    const markerIndex = this.markers.length + 1;
    const label = `${this.currentCategory}_${markerIndex}`;

    // Create visual marker with category color
    const marker = MeshBuilder.CreateSphere(`marker_${this.markerCount++}`, { diameter: 0.5 }, this.scene);
    marker.position = position;

    const mat = new StandardMaterial(`${label}_mat`, this.scene);
    mat.diffuseColor = this.getCategoryColor(this.currentCategory);
    mat.emissiveColor = this.getCategoryColor(this.currentCategory).scale(0.5);
    marker.material = mat;

    const markerData: PositionMarker = { mesh: marker, position, label, category: this.currentCategory };
    this.markers.push(markerData);
    this.addToHistory({ type: 'place', marker: markerData });

    console.log(`[WorldEditor] Placed ${label} at:`, position);
    console.log(`  new Vector3(${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}),`);
    
    this.updateStatus(`Placed ${label} at (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`);
  }

  private handleSelectMesh(pickInfo: PickingInfo | null) {
    if (!pickInfo || !pickInfo.hit || !pickInfo.pickedMesh) return;

    // Deselect previous
    if (this.selectedMesh && this.selectedMesh.material) {
      (this.selectedMesh.material as StandardMaterial).emissiveColor = new Color3(0, 0, 0);
    }

    this.selectedMesh = pickInfo.pickedMesh;
    this.selectedMarker = null;

    // Highlight selected
    if (this.selectedMesh.material) {
      (this.selectedMesh.material as StandardMaterial).emissiveColor = new Color3(0.3, 0.3, 0);
    }

    console.log(`[WorldEditor] Selected: ${this.selectedMesh.name}`);
    console.log(`  Position: (${this.selectedMesh.position.x.toFixed(1)}, ${this.selectedMesh.position.y.toFixed(1)}, ${this.selectedMesh.position.z.toFixed(1)})`);
    console.log(`  Rotation: (${this.selectedMesh.rotation.x.toFixed(2)}, ${this.selectedMesh.rotation.y.toFixed(2)}, ${this.selectedMesh.rotation.z.toFixed(2)})`);
    console.log(`  Scaling: (${this.selectedMesh.scaling.x.toFixed(2)}, ${this.selectedMesh.scaling.y.toFixed(2)}, ${this.selectedMesh.scaling.z.toFixed(2)})`);
    
    this.updateStatus(`Selected: ${this.selectedMesh.name}`);
  }

  private handleKeyboardMove(key: string) {
    if (!this.selectedMesh) return;

    const moveSpeed = 1.0;
    const rotateSpeed = 0.1;

    switch (key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.selectedMesh.position.z -= moveSpeed;
        break;
      case 's':
      case 'arrowdown':
        this.selectedMesh.position.z += moveSpeed;
        break;
      case 'a':
      case 'arrowleft':
        this.selectedMesh.position.x -= moveSpeed;
        break;
      case 'd':
      case 'arrowright':
        this.selectedMesh.position.x += moveSpeed;
        break;
      case 'r':
        this.selectedMesh.position.y += moveSpeed;
        break;
      case 'f':
        this.selectedMesh.position.y -= moveSpeed;
        break;
      case 'q':
        this.selectedMesh.rotation.y -= rotateSpeed;
        break;
      case 'e':
        this.selectedMesh.rotation.y += rotateSpeed;
        break;
      default:
        return; // Don't update status for unhandled keys
    }

    // Update status for movement
    const pos = this.selectedMesh.position;
    const rot = this.selectedMesh.rotation;
    console.log(`[WorldEditor] ${this.selectedMesh.name} at: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}) rot: ${rot.y.toFixed(2)}`);
    this.updateStatus(`${this.selectedMesh.name}: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`);
  }

  private copyPositionsAsCode() {
    if (this.markers.length === 0) {
      console.log('[WorldEditor] No markers to copy');
      this.updateStatus('No markers to copy');
      return;
    }

    // Group by category
    const byCategory: Record<string, PositionMarker[]> = {
      general: [],
      tree: [],
      interactable: [],
      prop: []
    };

    this.markers.forEach(m => byCategory[m.category].push(m));

    let output = '';
    
    Object.keys(byCategory).forEach(category => {
      const items = byCategory[category];
      if (items.length > 0) {
        output += `\n// ${category.toUpperCase()} positions (${items.length}):\n`;
        output += `const ${category}Positions = [\n`;
        items.forEach(m => {
          output += `  new Vector3(${m.position.x.toFixed(1)}, ${m.position.y.toFixed(1)}, ${m.position.z.toFixed(1)}), // ${m.label}\n`;
        });
        output += '];\n';
      }
    });

    console.log('[WorldEditor] Marker positions (copy-paste ready):');
    console.log(output);

    // Copy to clipboard if available
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(output).then(() => {
        console.log('[WorldEditor] ✓ Copied to clipboard!');
        this.updateStatus(`✓ Copied ${this.markers.length} positions`);
      });
    } else {
      this.updateStatus(`${this.markers.length} positions logged`);
    }
  }

  private clearMarkers() {
    this.markers.forEach(m => m.mesh.dispose());
    this.markers = [];
    this.markerCount = 0;
    this.addToHistory({ type: 'delete' });
    console.log('[WorldEditor] Cleared all markers');
    this.updateStatus('Markers cleared');
  }

  // === NEW ENHANCED METHODS ===

  private getCategoryColor(category: string): Color3 {
    switch (category) {
      case 'tree': return new Color3(0.6, 0.2, 0.8); // Purple
      case 'interactable': return new Color3(1, 1, 0); // Yellow
      case 'prop': return new Color3(0.2, 0.8, 0.2); // Green
      default: return new Color3(1, 0, 1); // Magenta
    }
  }

  private handleShiftClick(pickInfo: PickingInfo | null) {
    if (!pickInfo || !pickInfo.hit || !pickInfo.pickedMesh) return;

    // Check if clicking on a marker for distance measurement
    const clickedMarker = this.markers.find(m => m.mesh === pickInfo.pickedMesh);
    
    if (clickedMarker) {
      if (!this.firstDistanceMarker) {
        this.firstDistanceMarker = clickedMarker;
        this.updateStatus(`Distance: Select second marker`);
      } else {
        this.measureDistance(this.firstDistanceMarker, clickedMarker);
        this.firstDistanceMarker = null;
        if (this.distanceLine) {
          this.distanceLine.dispose();
          this.distanceLine = null;
        }
      }
    } else {
      // Regular mesh selection
      this.handleSelectMesh(pickInfo);
    }
  }

  private handleMarkerClick(pickInfo: PickingInfo | null) {
    if (!pickInfo || !pickInfo.hit || !pickInfo.pickedMesh) return;

    const clickedMarker = this.markers.find(m => m.mesh === pickInfo.pickedMesh);
    if (!clickedMarker) return;

    const now = Date.now();
    const isDoubleClick = now - this.lastClickTime < 300;
    this.lastClickTime = now;

    if (isDoubleClick) {
      // Teleport camera to marker
      const camera = this.scene.activeCamera;
      if (camera) {
        camera.position = clickedMarker.position.add(new Vector3(0, 5, 10));
        this.updateStatus(`Teleported to ${clickedMarker.label}`);
      }
    } else {
      // Single click - select marker
      this.selectedMarker = clickedMarker;
      this.updateStatus(`Selected: ${clickedMarker.label}`);
    }
  }

  private handleDuplicate() {
    if (!this.selectedMarker) return;

    const newPos = this.selectedMarker.position.clone().add(new Vector3(2, 0, 2));
    
    if (this.gridSnap) {
      newPos.x = Math.round(newPos.x / this.gridSize) * this.gridSize;
      newPos.z = Math.round(newPos.z / this.gridSize) * this.gridSize;
    }

    const markerIndex = this.markers.length + 1;
    const label = `${this.selectedMarker.category}_${markerIndex}`;

    const marker = MeshBuilder.CreateSphere(`marker_${markerIndex}`, { diameter: 0.5 }, this.scene);
    marker.position = newPos;

    const mat = new StandardMaterial(`${label}_mat`, this.scene);
    mat.diffuseColor = this.getCategoryColor(this.selectedMarker.category);
    mat.emissiveColor = this.getCategoryColor(this.selectedMarker.category).scale(0.5);
    marker.material = mat;

    const markerData: PositionMarker = { mesh: marker, position: newPos, label, category: this.selectedMarker.category };
    this.markers.push(markerData);
    this.addToHistory({ type: 'place', marker: markerData });

    this.selectedMarker = markerData;
    this.updateStatus(`Duplicated to ${label}`);
  }

  private handleDeleteMarker(marker: PositionMarker) {
    const index = this.markers.indexOf(marker);
    if (index >= 0) {
      this.markers.splice(index, 1);
      marker.mesh.dispose();
      this.addToHistory({ type: 'delete', marker });
      this.selectedMarker = null;
      this.updateStatus(`Deleted ${marker.label}`);
    }
  }

  private measureDistance(marker1: PositionMarker, marker2: PositionMarker) {
    const distance = Vector3.Distance(marker1.position, marker2.position);
    console.log(`[WorldEditor] Distance: ${marker1.label} → ${marker2.label} = ${distance.toFixed(2)} units`);
    this.updateStatus(`Distance: ${distance.toFixed(2)}u`);
    
    // Draw line
    if (this.distanceLine) {
      this.distanceLine.dispose();
    }
    const points = [marker1.position, marker2.position];
    this.distanceLine = MeshBuilder.CreateLines('distanceLine', { points }, this.scene);
    this.distanceLine.color = new Color3(0, 1, 1);
  }

  private createGridHelper() {
    const gridSize = 100;
    const step = this.gridSize;
    const lines = [];

    for (let i = -gridSize; i <= gridSize; i += step) {
      lines.push([new Vector3(i, 0.1, -gridSize), new Vector3(i, 0.1, gridSize)]);
      lines.push([new Vector3(-gridSize, 0.1, i), new Vector3(gridSize, 0.1, i)]);
    }

    this.gridHelper = MeshBuilder.CreateLineSystem('gridHelper', { lines }, this.scene);
    this.gridHelper.color = new Color3(0.3, 0.3, 0.3);
    this.gridHelper.isPickable = false;
  }

  private addToHistory(entry: HistoryEntry) {
    // Clear forward history
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(entry);
    this.historyIndex++;
    
    // Limit history size
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  private undo() {
    if (this.historyIndex < 0) {
      this.updateStatus('Nothing to undo');
      return;
    }

    const entry = this.history[this.historyIndex];
    this.historyIndex--;

    if (entry.type === 'place' && entry.marker) {
      const index = this.markers.indexOf(entry.marker);
      if (index >= 0) {
        this.markers.splice(index, 1);
        entry.marker.mesh.dispose();
      }
    } else if (entry.type === 'delete' && entry.marker) {
      // Re-add marker
      this.markers.push(entry.marker);
    } else if (entry.type === 'move' && entry.marker && entry.oldPosition) {
      entry.marker.position = entry.oldPosition.clone();
      entry.marker.mesh.position = entry.oldPosition.clone();
    }

    this.updateStatus('Undo');
  }

  private redo() {
    if (this.historyIndex >= this.history.length - 1) {
      this.updateStatus('Nothing to redo');
      return;
    }

    this.historyIndex++;
    const entry = this.history[this.historyIndex];

    if (entry.type === 'place' && entry.marker) {
      this.markers.push(entry.marker);
    } else if (entry.type === 'delete' && entry.marker) {
      const index = this.markers.indexOf(entry.marker);
      if (index >= 0) {
        this.markers.splice(index, 1);
        entry.marker.mesh.dispose();
      }
    } else if (entry.type === 'move' && entry.marker && entry.newPosition) {
      entry.marker.position = entry.newPosition.clone();
      entry.marker.mesh.position = entry.newPosition.clone();
    }

    this.updateStatus('Redo');
  }

  private saveSession() {
    const data = {
      markers: this.markers.map(m => ({
        position: m.position.asArray(),
        label: m.label,
        category: m.category
      })),
      gridSnap: this.gridSnap,
      currentCategory: this.currentCategory
    };

    localStorage.setItem('worldEditor_session', JSON.stringify(data));
    this.updateStatus('Session saved');
    console.log('[WorldEditor] Session saved');
  }

  private loadSession() {
    const saved = localStorage.getItem('worldEditor_session');
    if (!saved) return;

    try {
      const data = JSON.parse(saved) as {
        markers?: Array<{
          position: [number, number, number];
          label: string;
          category: 'tree' | 'interactable' | 'prop' | 'general';
        }>;
        gridSnap?: boolean;
        currentCategory?: 'tree' | 'interactable' | 'prop' | 'general';
      };
      
      this.gridSnap = data.gridSnap || false;
      this.currentCategory = data.currentCategory || 'general';

      data.markers?.forEach((m) => {
        const position = new Vector3(m.position[0], m.position[1], m.position[2]);
        const marker = MeshBuilder.CreateSphere(m.label, { diameter: 0.5 }, this.scene);
        marker.position = position;

        const mat = new StandardMaterial(`${m.label}_mat`, this.scene);
        mat.diffuseColor = this.getCategoryColor(m.category);
        mat.emissiveColor = this.getCategoryColor(m.category).scale(0.5);
        marker.material = mat;

        this.markers.push({ mesh: marker, position, label: m.label, category: m.category });
      });

      console.log(`[WorldEditor] Loaded ${this.markers.length} markers from session`);
      this.updateStatus(`Loaded ${this.markers.length} markers`);
    } catch (e) {
      console.warn('[WorldEditor] Failed to load session', e);
    }
  }

  private createCommandPanel() {
    this.commandsDiv = document.createElement('div');
    this.commandsDiv.style.cssText = `
      position: fixed;
      top: 120px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: #0f0;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      padding: 12px;
      border-radius: 5px;
      pointer-events: none;
      z-index: 1000;
      max-width: 320px;
      max-height: 80vh;
      overflow-y: auto;
    `;

    this.commandsDiv.innerHTML = `
      <div style="color: #ff0; font-weight: bold; margin-bottom: 8px;">🛠️ WORLD EDITOR</div>
      
      <div style="color: #0ff; margin-top: 8px; font-weight: bold;">PLACEMENT</div>
      <div><span style="color: #fff;">Ctrl+Click:</span> Place marker</div>
      <div><span style="color: #fff;">1-4:</span> Category (General/Tree/Interact/Prop)</div>
      <div><span style="color: #fff;">D:</span> Duplicate selected</div>
      <div><span style="color: #fff;">Del:</span> Delete selected marker</div>
      
      <div style="color: #0ff; margin-top: 8px; font-weight: bold;">SELECTION</div>
      <div><span style="color: #fff;">Shift+Click:</span> Select mesh/marker</div>
      <div><span style="color: #fff;">Double-Click:</span> Teleport camera to marker</div>
      
      <div style="color: #0ff; margin-top: 8px; font-weight: bold;">MOVEMENT</div>
      <div><span style="color: #fff;">WASD/Arrows:</span> Move selected</div>
      <div><span style="color: #fff;">Q/E:</span> Rotate Y-axis</div>
      <div><span style="color: #fff;">R/F:</span> Move up/down</div>
      <div><span style="color: #fff;">T:</span> Snap to ground (Y=0)</div>
      
      <div style="color: #0ff; margin-top: 8px; font-weight: bold;">TRANSFORM</div>
      <div><span style="color: #fff;">Z/X:</span> Scale down/up</div>
      <div><span style="color: #fff;">G:</span> Toggle grid snap (5u)</div>
      
      <div style="color: #0ff; margin-top: 8px; font-weight: bold;">TOOLS</div>
      <div><span style="color: #fff;">Shift+Click 2 markers:</span> Measure distance</div>
      <div><span style="color: #fff;">C:</span> Copy positions as code</div>
      <div><span style="color: #fff;">Ctrl+S:</span> Save session</div>
      
      <div style="color: #0ff; margin-top: 8px; font-weight: bold;">HISTORY</div>
      <div><span style="color: #fff;">Ctrl+Z:</span> Undo</div>
      <div><span style="color: #fff;">Ctrl+Y:</span> Redo</div>
      
      <div style="color: #0ff; margin-top: 8px; font-weight: bold;">UI</div>
      <div><span style="color: #fff;">H:</span> Toggle help panel</div>
      <div><span style="color: #fff;">F2:</span> Toggle editor</div>
    `;

    document.body.appendChild(this.commandsDiv);
  }

  dispose() {
    this.disable();
    if (this.gridHelper) {
      this.gridHelper.dispose();
    }
    if (this.distanceLine) {
      this.distanceLine.dispose();
    }
    if (this.commandsDiv) {
      this.commandsDiv.remove();
    }
  }
}
