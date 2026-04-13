import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import heroImage from "../../assets/cafeimageLoginpage.png";
import { ADMIN_LOGIN } from "../../Utils/Constant";
import { setAuthSession } from "../../Utils/authStorage";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Email and password are required");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(ADMIN_LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Login failed");
      }

      setAuthSession({
        accessToken: data?.data?.access_token,
        refreshToken: data?.data?.refresh_token,
        admin: data?.data?.admin,
        persist: true,
      });

      toast.success("Login successful");
      navigate("/category", { replace: true });
    } catch (error) {
      setErrorMessage(error.message || "Login failed");
      toast.error(error.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-stone-950 lg:block">
        <img
          src={heroImage}
          alt="Cafe"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/70" />

        <div className="absolute bottom-10 left-10 right-10 max-w-lg space-y-3 text-orange-50">
          <p className="text-xs font-bold uppercase tracking-widest">Cafe Admin</p>
          <h1 className="text-5xl font-bold leading-tight">Welcome back</h1>
          <p className="text-sm opacity-90">
            Log in to manage categories, menu items, and the full restaurant dashboard.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-10">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-4 rounded-3xl border border-orange-200 bg-white/90 p-8 shadow-2xl backdrop-blur-sm"
        >
          <div className="space-y-1 text-orange-900">
            <p className="text-xs font-bold uppercase tracking-widest">Admin Access</p>
            <h2 className="text-3xl font-bold text-gray-900">Login</h2>
            <p className="text-sm">Use your admin email and password to continue.</p>
          </div>

          <input
            type="text"
            name="cafe_admin_email"
            placeholder="Email"
            autoComplete="off"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-14 w-full rounded-xl border border-orange-200 bg-orange-50 px-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />

          <input
            type="password"
            name="cafe_admin_password"
            placeholder="Password"
            autoComplete="off"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-14 w-full rounded-xl border border-orange-200 bg-orange-50 px-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />

          {errorMessage ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-14 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-700 font-bold text-white shadow-lg disabled:opacity-60"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>

          <p className="text-sm text-orange-900">
            Need to create the first admin?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="font-bold text-orange-700"
            >
              Register
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
