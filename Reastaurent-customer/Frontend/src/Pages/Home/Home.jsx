import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Header } from "../../components/common";
import { CategoryBar, ItemGrid } from "../../components/Menu";
import { CartDrawer } from "../../components/Cart";
import { AddonModal } from "../../components/Addons";
import { CustomerDrawer } from "../../components/customer";
import {
  fetchCategories,
  fetchItemAddons,
  fetchItemsByCategory,
} from "../../services/menuApi";
import {
  applyAddonChange,
  applyCategoryChange,
  applyItemChange,
} from "../../realtime/applyMenuChange";
import { useMenuUpdates } from "../../realtime/useMenuUpdates";
import { useCustomerRealtimeUpdates } from "../../realtime/useCustomerRealtimeUpdates";
import { customerAuthStorage } from "../../auth/customerAuthStorage";
import { fetchCustomerProfile } from "../../services/customerProfileApi";
import { fetchCustomerUnreadNotificationSummary } from "../../services/customerNotificationApi";
import {
  startCustomerNotificationAlert,
  stopCustomerNotificationAlert,
} from "../../Utils/notificationSound";

function Home() {
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
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const [customer, setCustomer] = useState(customerAuthStorage.getCustomer());
  const [customerDrawerTab, setCustomerDrawerTab] = useState("profile");
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);
  const [notificationsRefreshKey, setNotificationsRefreshKey] = useState(0);
  const [notificationSummary, setNotificationSummary] = useState({
    unreadCount: 0,
    notifications: [],
  });

  const selectedCategoryRef = useRef(selectedCategory);
  const selectedItemRef = useRef(selectedItem);
  const itemsRef = useRef(items);
  const addonCacheRef = useRef(addonCache);
  const selectedItemAddonsRef = useRef(selectedItemAddons);
  const skipNextSelectedCategoryFetchRef = useRef(false);
  const previousNotificationCountRef = useRef(0);
  const hasLoadedNotificationSummaryRef = useRef(false);

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

  const loadAddonsForItem = useEffectEvent(async (item, options = {}) => {
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
  });

  useMenuUpdates((payload) => {
    if (payload.entity === "category") {
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
    const accessToken = customerAuthStorage.getAccessToken();

    if (!accessToken) {
      return;
    }

    let isCancelled = false;

    const loadCustomerProfile = async () => {
      try {
        const profile = await fetchCustomerProfile(accessToken);

        if (!isCancelled) {
          customerAuthStorage.updateCustomer(profile);
          setCustomer(profile);
        }
      } catch (_error) {
        customerAuthStorage.clearSession();
        if (!isCancelled) {
          setCustomer(null);
        }
      }
    };

    void loadCustomerProfile();

    return () => {
      isCancelled = true;
    };
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

  useEffect(() => {
    const accessToken = customerAuthStorage.getAccessToken();

    if (!customer?.id || !accessToken) {
      previousNotificationCountRef.current = 0;
      hasLoadedNotificationSummaryRef.current = false;
      setNotificationSummary({
        unreadCount: 0,
        notifications: [],
      });
      return;
    }

    let isCancelled = false;

    const loadNotificationSummary = async () => {
      try {
        const summary = await fetchCustomerUnreadNotificationSummary(accessToken, 10);

        if (!isCancelled) {
          const nextUnreadCount = Number(summary?.unreadCount || 0);
          const previousUnreadCount = previousNotificationCountRef.current;

          if (
            hasLoadedNotificationSummaryRef.current &&
            nextUnreadCount > previousUnreadCount
          ) {
            startCustomerNotificationAlert();
          }

          previousNotificationCountRef.current = nextUnreadCount;
          hasLoadedNotificationSummaryRef.current = true;
          setNotificationSummary(summary);
        }
      } catch (_error) {
        if (!isCancelled) {
          previousNotificationCountRef.current = 0;
          hasLoadedNotificationSummaryRef.current = true;
          setNotificationSummary({
            unreadCount: 0,
            notifications: [],
          });
        }
      }
    };

    void loadNotificationSummary();

    return () => {
      isCancelled = true;
      stopCustomerNotificationAlert();
    };
  }, [customer?.id, notificationsRefreshKey]);

  useCustomerRealtimeUpdates({
    customer,
    onOrderUpdate: () => {
      setOrdersRefreshKey((prev) => prev + 1);
    },
    onNotificationUpdate: () => {
      setNotificationsRefreshKey((prev) => prev + 1);
    },
  });

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
    <div className="customer-shell">
      <Header
        cartCount={cartCount}
        customer={customer}
        notificationCount={notificationSummary.unreadCount}
        onCustomerClick={() => {
          setCartOpen(false);
          setCustomerDrawerTab("profile");
          setCustomerDrawerOpen(true);
        }}
        onNotificationClick={() => {
          setCartOpen(false);
          setCustomerDrawerTab("notifications");
          stopCustomerNotificationAlert();
          setCustomerDrawerOpen(true);
        }}
        onCartClick={() => {
          setCustomerDrawerOpen(false);
          setCartOpen(true);
        }}
      />
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
      {cartOpen ? (
        <CartDrawer
          cart={cart}
          customer={customer}
          onClose={() => setCartOpen(false)}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onClearCart={() => setCart([])}
          onRequireSignIn={() => {
            setCartOpen(false);
            setCustomerDrawerTab("profile");
            setCustomerDrawerOpen(true);
          }}
          onOrderPlaced={() => {
            setOrdersRefreshKey((prev) => prev + 1);
            setCartOpen(false);
            setCustomerDrawerTab("orders");
            setCustomerDrawerOpen(true);
          }}
        />
      ) : null}
      <CustomerDrawer
        open={customerDrawerOpen}
        onClose={() => setCustomerDrawerOpen(false)}
        customer={customer}
        onCustomerChange={setCustomer}
        initialTab={customerDrawerTab}
        ordersRefreshKey={ordersRefreshKey}
        notificationsRefreshKey={notificationsRefreshKey}
        notificationSummary={notificationSummary}
        onNotificationSummaryChange={setNotificationSummary}
      />
      {addonModalOpen && selectedItem ? (
        <AddonModal
          item={selectedItem}
          addons={selectedItemAddons}
          loading={loadingAddons}
          onClose={closeAddonModal}
          onConfirm={handleAddonConfirm}
        />
      ) : null}
    </div>
  );
}

export default Home;
