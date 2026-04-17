import { useEffect, useState } from "react";
import Header from "./components/Header";
import CategoryBar from "./components/CategoryBar";
import ItemGrid from "./components/ItemGrid";
import CartDrawer from "./components/CartDrawer";
import AddonModal from "./components/AddonModal";
import {
  CATEGORY_LIST,
  ITEM_ADDONS,
  ITEMS_BY_CATEGORY,
} from "./Utils/Constant";

function App() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [addonCache, setAddonCache] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemAddons, setSelectedItemAddons] = useState([]);
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [loadingAddons, setLoadingAddons] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(CATEGORY_LIST, { method: "POST" });
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setCategories(data.data);
          setSelectedCategory(data.data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;

    const fetchItems = async () => {
      setLoadingItems(true);
      try {
        const res = await fetch(ITEMS_BY_CATEGORY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category_id: selectedCategory }),
        });
        const data = await res.json();
        if (data.success) {
          setItems(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch items:", err);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [selectedCategory]);

  const buildCartItem = (item, selectedAddons = []) => {
    const addonIds = selectedAddons.map((addon) => addon.id).sort((a, b) => a - b);
    const cartKey = `${item.id}:${addonIds.join("-") || "base"}`;
    const addonTotal = selectedAddons.reduce(
      (sum, addon) => sum + Number(addon.addon_price || 0),
      0
    );

    return {
      ...item,
      cart_key: cartKey,
      selected_addons: selectedAddons,
      addon_total: addonTotal,
      qty: 1,
    };
  };

  const addConfiguredItemToCart = (item, selectedAddons = []) => {
    const cartItem = buildCartItem(item, selectedAddons);

    setCart((prev) => {
      const existing = prev.find((entry) => entry.cart_key === cartItem.cart_key);
      if (existing) {
        return prev.map((entry) =>
          entry.cart_key === cartItem.cart_key
            ? { ...entry, qty: entry.qty + 1 }
            : entry
        );
      }
      return [...prev, cartItem];
    });
  };

  const closeAddonModal = () => {
    setAddonModalOpen(false);
    setSelectedItem(null);
    setSelectedItemAddons([]);
    setLoadingAddons(false);
  };

  const handleAddonConfirm = (selectedAddons) => {
    if (selectedItem) {
      addConfiguredItemToCart(selectedItem, selectedAddons);
    }
    closeAddonModal();
  };

  const openAddonsForItem = async (item) => {
    if (item.cart_key) {
      return;
    }

    setSelectedItem(item);
    setLoadingAddons(true);

    try {
      if (addonCache[item.id]) {
        const cachedAddons = addonCache[item.id];
        if (cachedAddons.length > 0) {
          setSelectedItemAddons(cachedAddons);
          setAddonModalOpen(true);
        } else {
          closeAddonModal();
        }
        return;
      }

      const res = await fetch(ITEM_ADDONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item.id }),
      });
      const data = await res.json();
      const addons = data.success ? data.data || [] : [];

      setAddonCache((prev) => ({ ...prev, [item.id]: addons }));

      if (addons.length > 0) {
        setSelectedItemAddons(addons);
        setAddonModalOpen(true);
      } else {
        closeAddonModal();
      }
    } catch (err) {
      console.error("Failed to fetch item addons:", err);
      closeAddonModal();
    } finally {
      setLoadingAddons(false);
    }
  };

  const addToCart = (item) => {
    if (item.cart_key) {
      addConfiguredItemToCart(item, item.selected_addons || []);
      return;
    }

    addConfiguredItemToCart(item, []);
  };

  const removeFromCart = (itemId, cartKey = null) => {
    setCart((prev) => {
      const existing = cartKey
        ? prev.find((entry) => entry.cart_key === cartKey)
        : [...prev].reverse().find((entry) => entry.id === itemId);

      if (!existing) {
        return prev;
      }

      if (existing.qty > 1) {
        return prev.map((entry) =>
          entry.cart_key === existing.cart_key
            ? { ...entry, qty: entry.qty - 1 }
            : entry
        );
      }

      return prev.filter((entry) => entry.cart_key !== existing.cart_key);
    });
  };

  const cartCount = cart.reduce((sum, entry) => sum + entry.qty, 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)",
        fontFamily: "'Segoe UI', 'Inter', -apple-system, sans-serif",
        color: "#e0e0e0",
        margin: 0,
        padding: 0,
      }}
    >
      <Header cartCount={cartCount} onCartClick={() => setCartOpen(true)} />
      <CategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
        loading={loadingCategories}
      />
      <ItemGrid
        items={items}
        loading={loadingItems}
        onAddToCart={addToCart}
        onOpenAddons={openAddonsForItem}
        cart={cart}
        onRemoveFromCart={removeFromCart}
      />
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onAdd={addToCart}
          onRemove={removeFromCart}
        />
      )}
      {addonModalOpen && selectedItem && (
        <AddonModal
          item={selectedItem}
          addons={selectedItemAddons}
          loading={loadingAddons}
          onClose={closeAddonModal}
          onConfirm={handleAddonConfirm}
        />
      )}
    </div>
  );
}

export default App;
