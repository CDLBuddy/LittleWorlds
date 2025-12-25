interface InventoryBubblesProps {
  items?: string[];
}

export default function InventoryBubbles({ items = [] }: InventoryBubblesProps) {
  return (
    <div className="inventory-bubbles">
      {items.map((item, index) => (
        <div key={index} className="inventory-bubble">
          {item}
        </div>
      ))}
    </div>
  );
}
