import { useEffect, useEffectEvent, useRef, useState } from "react";
import Header from "./components/Header";
import CategoryBar from "./components/CategoryBar";
import ItemGrid from "./components/ItemGrid";
import CartDrawer from "./components/CartDrawer";
import AddonModal from "./components/AddonModal";
import {
  fetchCategories,
  fetchItemAddons,
  fetchItemsByCategory,
} from "./services/menuApi";
import {
  applyAddonChange,
  applyCategoryChange,
  applyItemChange,
} from "./realtime/applyMenuChange";
import { useMenuUpdates } from "./realtime/useMenuUpdates";

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

  const selectedCategoryRef = useRef(selectedCategory);
  const selectedItemRef = useRef(selectedItem);
  const itemsRef = useRef(items);
  const addonCacheRef = useRef(addonCache);
  const selectedItemAddonsRef = useRef(selectedItemAddons);
  const skipNextSelectedCategoryFetchRef = useRef(false);

  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  useEffect(() => {
    selectedItemRef.current = selectedItem;
  }, [selectedItem]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    addonCacheRef.current = addonCache;
  }, [addonCache]);

  useEffect(() => {
    selectedItemAddonsRef.current = selectedItemAddons;
  }, [selectedItemAddons]);

  const loadCategories = useEffectEvent(async (preferredCategoryId = null) => {
    setLoadingCategories(true);

    try {
      const nextCategories = await fetchCategories();
      const requestedCategoryId =
        preferredCategoryId ?? selectedCategoryRef.current;
      const hasRequestedCategory = nextCategories.some(
        (category) => category.id === requestedCategoryId
      );
      const nextSelectedCategory = hasRequestedCategory
        ? requestedCategoryId
        : nextCategories[0]?.id ?? null;

      setCategories(nextCategories);
      setSelectedCategory(nextSelectedCategory);

      return nextSelectedCategory;
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategories([]);
      setSelectedCategory(null);
      return null;
    } finally {
      setLoadingCategories(false);
    }
  });

  const loadItems = useEffectEvent(async (categoryId) => {
    if (!categoryId) {
      setItems([]);
      return [];
    }

    setLoadingItems(true);

    try {
      const nextItems = await fetchItemsByCategory(categoryId);
      setItems(nextItems);
      return nextItems;
    } catch (error) {
      console.error("Failed to fetch items:", error);
      setItems([]);
      return [];
    } finally {
      setLoadingItems(false);
    }
  });

  const loadAddonsForItem = useEffectEvent(
    async (item, options = {}) => {
      const { useCache = true, openModal = true } = options;

      if (!item) {
        return [];
      }

      setLoadingAddons(true);

      try {
        if (useCache && addonCache[item.id]) {
          const cachedAddons = addonCache[item.id];

          setSelectedItemAddons(cachedAddons);

          if (openModal && cachedAddons.length > 0) {
            setAddonModalOpen(true);
          }

          return cachedAddons;
        }

        const addons = await fetchItemAddons(item.id);

        setAddonCache((prev) => ({
          ...prev,
          [item.id]: addons,
        }));
        setSelectedItemAddons(addons);

        if (openModal) {
          setAddonModalOpen(addons.length > 0);
        }

        return addons;
      } catch (error) {
        console.error("Failed to fetch item addons:", error);
        setSelectedItemAddons([]);
        if (openModal) {
          setAddonModalOpen(false);
        }
        return [];
      } finally {
        setLoadingAddons(false);
      }
    }
  );

  useMenuUpdates((payload) => {
    console.log("[menu-events][customer-frontend] menu.updated received:", payload);

    if (payload.entity === "category") {
      console.log("[menu-events][customer-frontend] Applying category change without refetch");

      let nextSelectedCategory = selectedCategoryRef.current;

      setCategories((prevCategories) => {
        const nextState = applyCategoryChange({
          categories: prevCategories,
          selectedCategory: selectedCategoryRef.current,
          change: payload,
        });

        nextSelectedCategory = nextState.selectedCategory;
        return nextState.categories;
      });

      if (nextSelectedCategory !== selectedCategoryRef.current) {
        skipNextSelectedCategoryFetchRef.current = true;
        setSelectedCategory(nextSelectedCategory);
        setItems([]);
      }

      return;
    }

    if (payload.entity === "item") {
      console.log("[menu-events][customer-frontend] Applying item change without refetch");

      const nextItemState = applyItemChange({
        items: itemsRef.current,
        selectedCategory: selectedCategoryRef.current,
        selectedItem: selectedItemRef.current,
        change: payload,
      });

      setItems(nextItemState.items);
      setSelectedItem(nextItemState.selectedItem);

      if (
        selectedItemRef.current &&
        Number(selectedItemRef.current.id) === Number(payload.entityId) &&
        (payload.action === "deleted" ||
          Number(payload.entityData?.is_active ?? 1) !== 1 ||
          Number(payload.entityData?.is_deleted ?? 0) !== 0)
      ) {
        setAddonModalOpen(false);
        setSelectedItemAddons([]);
      }

      return;
    }

    if (payload.entity === "addon") {
      console.log("[menu-events][customer-frontend] Applying addon change without refetch");

      const nextAddonState = applyAddonChange({
        addonCache: addonCacheRef.current,
        selectedItem: selectedItemRef.current,
        selectedItemAddons: selectedItemAddonsRef.current,
        change: payload,
      });

      setAddonCache(nextAddonState.addonCache);
      setSelectedItemAddons(nextAddonState.selectedItemAddons);
    }
  });

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setItems([]);
      return;
    }

    if (skipNextSelectedCategoryFetchRef.current) {
      skipNextSelectedCategoryFetchRef.current = false;
      return;
    }

    void loadItems(selectedCategory);
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

    const addons = await loadAddonsForItem(item, {
      useCache: true,
      openModal: false,
    });

    if (addons.length > 0) {
      setAddonModalOpen(true);
    } else {
      closeAddonModal();
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
