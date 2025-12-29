# World Editor Guide

## Overview

The WorldEditor is a powerful in-game development tool for placing, positioning, and managing objects in game worlds. It provides a visual interface with extensive keyboard shortcuts for rapid level design iteration.

## Getting Started

### Enable/Disable

- Press **F2** to toggle the World Editor on/off
- Press **H** to toggle the help panel visibility

### UI Elements

When enabled, you'll see:
- **Status Panel** (bottom-left): Shows current category, grid snap status, marker count, and action feedback
- **Commands Panel** (top-right): Comprehensive list of all available shortcuts (toggle with H)

## Core Features

### 1. Marker Placement

Place position markers to plan object locations:
- **Ctrl+Click** on ground: Place a new marker at cursor position
- Markers are color-coded by category (see below)
- Each marker displays its position in console for easy copy-paste

### 2. Category System

Switch between marker types using number keys **1-4**:

| Key | Category | Color | Use Case |
|-----|----------|-------|----------|
| 1 | General | Magenta | Default markers, misc objects |
| 2 | Tree | Purple | Tree positions |
| 3 | Interactable | Yellow | Clickable objects, NPCs |
| 4 | Prop | Green | Props, decorations |

Categories help organize large numbers of markers and generate grouped output code.

### 3. Selection & Manipulation

**Selecting:**
- **Shift+Click** mesh: Select existing mesh for editing
- **Shift+Click** marker: Select marker (enables distance tool, see below)
- **Double-Click** marker: Teleport camera to marker position

**Moving Selected Mesh:**
- **WASD** or **Arrow Keys**: Move horizontally
- **R/F**: Move up/down
- **Q/E**: Rotate on Y-axis

**Transforming:**
- **Z/X**: Scale down/up
- **T**: Snap to ground (sets Y=0)

### 4. Grid Snapping

- Press **G** to toggle grid snapping (5-unit intervals)
- When enabled, placed markers snap to nearest grid point
- Visual grid overlay appears when snapping is active
- Useful for precise alignment and clean layouts

### 5. Advanced Tools

**Duplication:**
- Select a marker
- Press **D** to duplicate it 2 units away
- Duplicates inherit the original's category

**Distance Measurement:**
- **Shift+Click** first marker
- **Shift+Click** second marker
- Distance displays in console and status bar
- Cyan line drawn between markers

**Individual Deletion:**
- Select a marker
- Press **Delete** or **Backspace** to remove it

### 6. History (Undo/Redo)

- **Ctrl+Z**: Undo last action (up to 50 steps)
- **Ctrl+Y**: Redo action
- Tracks: marker placement, deletion, and movement

### 7. Session Persistence

- **Ctrl+S**: Save current session to localStorage
- Sessions auto-load on World Editor enable
- Saved data includes: markers, positions, categories, grid snap state
- Useful for picking up where you left off between sessions

### 8. Export to Code

Press **C** to copy all marker positions as formatted code:
- Groups markers by category
- Generates TypeScript-ready `Vector3` arrays
- Copies to clipboard automatically
- Example output:
```typescript
// TREE positions (3):
const treePositions = [
  new Vector3(-28.0, 0.0, -28.0), // tree_1
  new Vector3(-18.0, 0.0, -30.0), // tree_2
  new Vector3(-10.0, 0.0, -25.0), // tree_3
];

// INTERACTABLE positions (2):
const interactablePositions = [
  new Vector3(5.0, 0.0, 10.0), // interactable_1
  new Vector3(15.0, 0.0, 12.0), // interactable_2
];
```

## Complete Keyboard Reference

### Placement
| Shortcut | Action |
|----------|--------|
| Ctrl+Click | Place marker at cursor |
| 1-4 | Switch category (General/Tree/Interact/Prop) |
| D | Duplicate selected marker |
| Delete/Backspace | Delete selected marker |

### Selection
| Shortcut | Action |
|----------|--------|
| Shift+Click | Select mesh or marker |
| Double-Click marker | Teleport camera to marker |

### Movement
| Shortcut | Action |
|----------|--------|
| WASD/Arrows | Move selected horizontally |
| Q/E | Rotate on Y-axis |
| R/F | Move up/down |
| T | Snap to ground (Y=0) |

### Transform
| Shortcut | Action |
|----------|--------|
| Z/X | Scale down/up |
| G | Toggle grid snap (5u) |

### Tools
| Shortcut | Action |
|----------|--------|
| Shift+Click 2 markers | Measure distance |
| C | Copy positions as code |
| Ctrl+S | Save session |

### History
| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |

### UI
| Shortcut | Action |
|----------|--------|
| H | Toggle help panel |
| F2 | Toggle editor on/off |

## Workflow Tips

### Planning a Forest Area

1. Enable editor with **F2**
2. Press **2** to switch to Tree category
3. Press **G** to enable grid snapping for clean alignment
4. **Ctrl+Click** around the map to place tree markers
5. Use **D** to duplicate markers in patterns
6. Press **C** to copy positions
7. Paste into your world file's tree loading code
8. Press **Ctrl+S** to save for later tweaking

### Positioning an Existing Mesh

1. **Shift+Click** the mesh to select it
2. Use **WASD** to move horizontally
3. Use **R/F** to adjust height
4. Use **Q/E** to rotate
5. Use **Z/X** to scale if needed
6. Check console for final position values

### Measuring Object Spacing

1. **Shift+Click** first reference point (marker)
2. **Shift+Click** second reference point
3. Distance appears in console and status bar
4. Adjust spacing based on measurement

### Organizing Complex Scenes

1. Use categories to group related objects:
   - Trees category for all vegetation
   - Interactable category for NPCs/items
   - Prop category for decoration
2. Save sessions frequently with **Ctrl+S**
3. Export code with **C** to generate grouped arrays
4. Separate groups make it easier to manage large scenes

## Technical Notes

### Integration

The WorldEditor is automatically initialized in `GameApp.ts` when `import.meta.env.DEV` is true:
```typescript
if (import.meta.env.DEV) {
  this.worldEditor = new WorldEditor(this.scene);
  this.worldEditor.enable();
}
```

### Performance

- Markers are standard Babylon.js meshes (low overhead)
- Grid helper only renders when snapping is enabled
- Session data stored in localStorage (typically <50KB)
- History limited to 50 actions to prevent memory issues

### Limitations

- Grid snap fixed at 5-unit intervals (customizable in code)
- Cannot move markers after placement (use delete + place new)
- Sessions don't save selected mesh transformations (only markers)
- Distance tool only works between markers, not arbitrary meshes

### Future Enhancements

Potential additions:
- Variable grid size selection
- Marker labels visible in 3D space
- Copy/paste rotation and scale between meshes
- Export to JSON for external tools
- Multi-select for batch operations
- Snap to existing mesh positions

## Troubleshooting

**Editor won't enable:**
- Check console for errors
- Ensure you're in DEV mode (`npm run dev`, not production build)
- Verify F2 key isn't captured by another tool

**Grid not visible:**
- Press G to toggle grid snapping on
- Grid renders at Y=0.1 height
- Ensure ground isn't obscuring grid lines

**Can't select mesh:**
- Use Shift+Click, not regular click
- Mesh must have collision/pickable enabled
- Markers themselves are selectable

**Session not loading:**
- Check browser console for JSON parse errors
- Clear localStorage if corrupt: `localStorage.removeItem('worldEditor_session')`
- Session only loads when editor is enabled

## Support

For issues or feature requests, see the project's issue tracker or contact the development team.
