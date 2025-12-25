/**
 * Player inventory - simple "holding" system
 */

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
}

export class Inventory {
  private items: InventoryItem[] = [];
  private maxSlots = 4;

  addItem(item: InventoryItem): boolean {
    if (this.items.length >= this.maxSlots) {
      return false;
    }
    this.items.push(item);
    return true;
  }

  removeItem(itemId: string): boolean {
    const index = this.items.findIndex((i) => i.id === itemId);
    if (index === -1) return false;
    
    this.items.splice(index, 1);
    return true;
  }

  hasItem(itemId: string): boolean {
    return this.items.some((i) => i.id === itemId);
  }

  getItems(): InventoryItem[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
  }
}
