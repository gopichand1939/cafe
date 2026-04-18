import { useEffect, useMemo, useState } from "react";
import { customerAuthStorage } from "../auth/customerAuthStorage";
import {
  changeCustomerPassword,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
} from "../services/customerAuthApi";
import {
  fetchCustomerProfile,
  updateCustomerProfile,
} from "../services/customerProfileApi";
import { fetchMyOrders } from "../services/orderApi";

const animationStyles = `
  @keyframes customerOverlayFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes customerDrawerSlideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
`;

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "18px",
  padding: "18px",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  try {
    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch (_error) {
    return value;
  }
};

function Notice({ tone = "success", message }) {
  if (!message) {
    return null;
  }

  const isSuccess = tone === "success";

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: "12px",
        background: isSuccess
          ? "rgba(34,197,94,0.14)"
          : "rgba(239,68,68,0.12)",
        border: isSuccess
          ? "1px solid rgba(34,197,94,0.24)"
          : "1px solid rgba(239,68,68,0.24)",
        color: isSuccess ? "#bbf7d0" : "#fecaca",
        fontSize: "13px",
      }}
    >
      {message}
    </div>
  );
}

function GuestView({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  const isLogin = mode === "login";

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const session = await loginCustomer(loginForm);
      customerAuthStorage.setSession({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        customer: session.customer,
      });
      onAuthenticated(session.customer);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const session = await registerCustomer(registerForm);
      customerAuthStorage.setSession({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        customer: session.customer,
      });
      onAuthenticated(session.customer);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={cardStyle}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
          {["login", "register"].map((tab) => {
            const active = tab === mode;

            return (
              <button
                key={tab}
                onClick={() => {
                  setMode(tab);
                  setErrorMessage("");
                }}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: active
                    ? "1px solid rgba(245,158,11,0.4)"
                    : "1px solid rgba(255,255,255,0.08)",
                  background: active
                    ? "linear-gradient(135deg, rgba(245,158,11,0.22), rgba(239,68,68,0.16))"
                    : "rgba(255,255,255,0.03)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                  textTransform: "capitalize",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <h3 style={{ margin: 0, color: "#fff", fontSize: "22px" }}>
          {isLogin ? "Sign in to continue" : "Create your customer account"}
        </h3>
        <p
          style={{
            margin: "8px 0 0",
            color: "rgba(255,255,255,0.58)",
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          Once signed in, this right-side panel will show your profile, my
          orders, my account, and address details.
        </p>

        <div style={{ marginTop: "16px" }}>
          <Notice tone="error" message={errorMessage} />
        </div>

        <form
          onSubmit={isLogin ? handleLogin : handleRegister}
          style={{
            marginTop: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {isLogin ? (
            <>
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="Email address"
                style={inputStyle}
                required
              />
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                placeholder="Password"
                style={inputStyle}
                required
              />
            </>
          ) : (
            <>
              <input
                type="text"
                value={registerForm.name}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Full name"
                style={inputStyle}
                required
              />
              <input
                type="email"
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                placeholder="Email address"
                style={inputStyle}
                required
              />
              <input
                type="tel"
                value={registerForm.phone}
                onChange={(event) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
                placeholder="Mobile number"
                style={inputStyle}
                required
              />
              <input
                type="password"
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                placeholder="Password"
                style={inputStyle}
                required
              />
              <input
                type="password"
                value={registerForm.confirm_password}
                onChange={(event) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    confirm_password: event.target.value,
                  }))
                }
                placeholder="Confirm password"
                style={inputStyle}
                required
              />
            </>
          )}

          <button type="submit" disabled={submitting} style={primaryButtonStyle}>
            {submitting
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
                ? "Sign In"
                : "Register"}
          </button>
        </form>
      </div>

      <div style={cardStyle}>
        <h4 style={{ margin: 0, color: "#fff", fontSize: "16px" }}>
          After sign in
        </h4>
        <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
          {[
            "My Profile with name, email, and phone",
            "My Orders area for customer-specific order history",
            "My Account section for password update",
            "Address section for delivery details",
          ].map((item) => (
            <div
              key={item}
              style={{
                padding: "12px 14px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.03)",
                color: "rgba(255,255,255,0.72)",
                fontSize: "13px",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const primaryButtonStyle = {
  width: "100%",
  padding: "13px 16px",
  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
  border: "none",
  borderRadius: "14px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};

function SignedInView({
  customer,
  onCustomerChange,
  initialTab = "profile",
  ordersRefreshKey = 0,
}) {
  const [activeTab, setActiveTab] = useState(initialTab || "profile");
  const [profileForm, setProfileForm] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    setActiveTab(initialTab || "profile");
  }, [initialTab]);

  useEffect(() => {
    setProfileForm({
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
    });
  }, [customer]);

  useEffect(() => {
    if (activeTab !== "orders") {
      return;
    }

    let cancelled = false;

    const loadOrders = async () => {
      setOrdersLoading(true);
      setOrdersError("");

      try {
        const accessToken = customerAuthStorage.getAccessToken();
        const result = await fetchMyOrders(accessToken, {
          page: 1,
          limit: 20,
        });

        if (!cancelled) {
          setOrders(result.data || []);
        }
      } catch (error) {
        if (!cancelled) {
          setOrders([]);
          setOrdersError(error.message);
        }
      } finally {
        if (!cancelled) {
          setOrdersLoading(false);
        }
      }
    };

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, [activeTab, ordersRefreshKey]);

  const tabs = useMemo(
    () => [
      { key: "profile", label: "My Profile" },
      { key: "orders", label: "My Orders" },
      { key: "account", label: "My Account" },
      { key: "address", label: "Address" },
    ],
    []
  );

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setMessage("");
    setErrorMessage("");

    try {
      const updatedCustomer = await updateCustomerProfile(
        profileForm,
        customerAuthStorage.getAccessToken()
      );
      customerAuthStorage.updateCustomer(updatedCustomer);
      onCustomerChange(updatedCustomer);
      setMessage("Profile updated successfully");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPasswordChange = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    setMessage("");
    setErrorMessage("");

    try {
      await changeCustomerPassword(
        passwordForm,
        customerAuthStorage.getAccessToken()
      );
      customerAuthStorage.clearSession();
      onCustomerChange(null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const signOut = async () => {
    try {
      const accessToken = customerAuthStorage.getAccessToken();
      if (accessToken) {
        await logoutCustomer(accessToken);
      }
    } catch (_error) {
      // Keep local logout smooth even if the request fails.
    } finally {
      customerAuthStorage.clearSession();
      onCustomerChange(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: "20px",
            }}
          >
            {(customer?.name || "C").slice(0, 1).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                color: "#fff",
                fontSize: "20px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {customer?.name || "Customer"}
            </h3>
            <p
              style={{
                margin: "6px 0 0",
                color: "rgba(255,255,255,0.55)",
                fontSize: "13px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {customer?.email}
            </p>
          </div>
        </div>

        <button
          onClick={signOut}
          style={{
            width: "100%",
            marginBottom: "14px",
            padding: "11px 14px",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.06)",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Logout
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "10px",
          }}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setMessage("");
                  setErrorMessage("");
                }}
                style={{
                  padding: "11px 12px",
                  borderRadius: "14px",
                  border: active
                    ? "1px solid rgba(245,158,11,0.4)"
                    : "1px solid rgba(255,255,255,0.08)",
                  background: active
                    ? "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.16))"
                    : "rgba(255,255,255,0.03)",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <Notice tone="success" message={message} />
      <Notice tone="error" message={errorMessage} />

      {activeTab === "profile" ? (
        <form onSubmit={saveProfile} style={cardStyle}>
          <h4 style={{ margin: 0, color: "#fff", fontSize: "18px" }}>
            My Profile
          </h4>
          <p
            style={{
              margin: "8px 0 0",
              color: "rgba(255,255,255,0.55)",
              fontSize: "13px",
            }}
          >
            These are your personal details from the customer account.
          </p>
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <input
              type="text"
              value={profileForm.name}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Full name"
              style={inputStyle}
              required
            />
            <input
              type="email"
              value={profileForm.email}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="Email address"
              style={inputStyle}
              required
            />
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
              }
              placeholder="Mobile number"
              style={inputStyle}
              required
            />
            <button
              type="submit"
              disabled={savingProfile}
              style={primaryButtonStyle}
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      ) : null}

      {activeTab === "orders" ? (
        <div style={cardStyle}>
          <h4 style={{ margin: 0, color: "#fff", fontSize: "18px" }}>
            My Orders
          </h4>
          <p
            style={{
              margin: "8px 0 0",
              color: "rgba(255,255,255,0.55)",
              fontSize: "13px",
            }}
          >
            These are the orders placed from this signed-in customer account.
          </p>

          {ordersError ? (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.24)",
                color: "#fecaca",
                fontSize: "13px",
              }}
            >
              {ordersError}
            </div>
          ) : null}

          <div style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
            {ordersLoading ? (
              <div
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.72)",
                  fontSize: "13px",
                }}
              >
                Loading your orders...
              </div>
            ) : null}

            {!ordersLoading && orders.length === 0 ? (
              <div
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.72)",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                No orders yet. Once you place an order from the cart, it will
                appear here for this customer account.
              </div>
            ) : null}

            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "grid",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}>
                      {order.order_number}
                    </div>
                    <div
                      style={{
                        marginTop: "4px",
                        color: "rgba(255,255,255,0.58)",
                        fontSize: "12px",
                      }}
                    >
                      {formatDateTime(order.created_at)}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background: "rgba(245,158,11,0.18)",
                      border: "1px solid rgba(245,158,11,0.28)",
                      color: "#fde68a",
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "capitalize",
                    }}
                  >
                    {String(order.order_status || "placed").replace(/_/g, " ")}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "10px",
                    color: "rgba(255,255,255,0.72)",
                    fontSize: "13px",
                  }}
                >
                  <div>Items: {order.item_count}</div>
                  <div>Total: Rs {Number(order.total_amount || 0).toFixed(2)}</div>
                  <div style={{ textTransform: "capitalize" }}>
                    Payment: {String(order.payment_status || "pending").replace(/_/g, " ")}
                  </div>
                  <div style={{ textTransform: "capitalize" }}>
                    Method: {String(order.payment_method || "-").replace(/_/g, " ")}
                  </div>
                </div>

                {order.order_notes ? (
                  <div
                    style={{
                      color: "rgba(255,255,255,0.68)",
                      fontSize: "12px",
                      lineHeight: 1.6,
                    }}
                  >
                    Note: {order.order_notes}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "account" ? (
        <>
          <form onSubmit={submitPasswordChange} style={cardStyle}>
            <h4 style={{ margin: 0, color: "#fff", fontSize: "18px" }}>
              My Account
            </h4>
            <p
              style={{
                margin: "8px 0 0",
                color: "rgba(255,255,255,0.55)",
                fontSize: "13px",
              }}
            >
              Update your password here. After password change, sign in again.
            </p>
            <div
              style={{
                marginTop: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    current_password: event.target.value,
                  }))
                }
                placeholder="Current password"
                style={inputStyle}
                required
              />
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    new_password: event.target.value,
                  }))
                }
                placeholder="New password"
                style={inputStyle}
                required
              />
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirm_password: event.target.value,
                  }))
                }
                placeholder="Confirm new password"
                style={inputStyle}
                required
              />
              <button
                type="submit"
                disabled={savingPassword}
                style={primaryButtonStyle}
              >
                {savingPassword ? "Updating..." : "Change Password"}
              </button>
            </div>
          </form>

          <div style={cardStyle}>
            <button onClick={signOut} style={primaryButtonStyle}>
              Logout
            </button>
          </div>
        </>
      ) : null}

      {activeTab === "address" ? (
        <div style={cardStyle}>
          <h4 style={{ margin: 0, color: "#fff", fontSize: "18px" }}>
            Address
          </h4>
          <p
            style={{
              margin: "8px 0 0",
              color: "rgba(255,255,255,0.55)",
              fontSize: "13px",
            }}
          >
            This section is kept ready for delivery address management.
          </p>
          <div
            style={{
              marginTop: "16px",
              padding: "14px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.72)",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            We can add house number, street, city, pincode, landmark, and
            default address actions here next without changing this drawer
            structure.
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CustomerDrawer({
  open,
  onClose,
  customer,
  onCustomerChange,
  initialTab = "profile",
  ordersRefreshKey = 0,
}) {
  if (!open) {
    return null;
  }

  const handleAuthenticated = async (sessionCustomer) => {
    onCustomerChange(sessionCustomer);

    try {
      const freshProfile = await fetchCustomerProfile(
        customerAuthStorage.getAccessToken()
      );
      customerAuthStorage.updateCustomer(freshProfile);
      onCustomerChange(freshProfile);
    } catch (_error) {
      onCustomerChange(sessionCustomer);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 220,
          animation: "customerOverlayFadeIn 0.2s ease",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(430px, 92vw)",
          background: "linear-gradient(180deg, #19162d 0%, #0f0c29 100%)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          zIndex: 221,
          display: "flex",
          flexDirection: "column",
          animation: "customerDrawerSlideIn 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: "#fff", fontSize: "22px" }}>
              {customer ? "Customer Panel" : "Customer Sign In"}
            </h2>
            <p
              style={{
                margin: "8px 0 0",
                color: "rgba(255,255,255,0.55)",
                fontSize: "13px",
              }}
            >
              {customer
                ? "Your personal area for profile, account, orders, and address."
                : "Sign in once and this right-side panel becomes your personal profile area."}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "12px",
              border: "none",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            x
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 20px 24px",
          }}
        >
          {customer ? (
            <SignedInView
              customer={customer}
              onCustomerChange={onCustomerChange}
              initialTab={initialTab}
              ordersRefreshKey={ordersRefreshKey}
            />
          ) : (
            <GuestView onAuthenticated={handleAuthenticated} />
          )}
        </div>
      </div>
      <style>{animationStyles}</style>
    </>
  );
}

export default CustomerDrawer;
