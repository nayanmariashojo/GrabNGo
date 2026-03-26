import { createContext, useContext, useState } from "react";

// ---------------------------------------------------------------
// CartContext — manages the in-memory shopping cart
// ---------------------------------------------------------------
const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Cart items look like: { item_id, item_name, price, quantity }
  const [items, setItems] = useState([]);

  /** Add an item or increment its quantity if already in cart */
  const addItem = (menuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.item_id === menuItem.item_id);
      if (existing) {
        return prev.map((i) =>
          i.item_id === menuItem.item_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...menuItem, quantity: 1 }];
    });
  };

  /** Remove one unit; delete the line if quantity reaches 0 */
  const removeItem = (itemId) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.item_id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  /** Set exact quantity for a specific item */
  const setQuantity = (itemId, qty) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.item_id !== itemId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.item_id === itemId ? { ...i, quantity: qty } : i))
      );
    }
  };

  /** Remove item entirely from cart */
  const deleteItem = (itemId) => {
    setItems((prev) => prev.filter((i) => i.item_id !== itemId));
  };

  /** Total price of all items in cart */
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  /** Empty the cart (used after successful order) */
  const clearCart = () => setItems([]);

  const value = { items, addItem, removeItem, setQuantity, deleteItem, total, clearCart };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Hook to consume the CartContext */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}


