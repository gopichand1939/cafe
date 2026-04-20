import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import heroImage from "../../assets/cafeimageLoginpage.png";
import { ADMIN_REGISTER } from "../../Utils/Constant";
import { Button, Card, InputField } from "../../components/ui";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      setErrorMessage("Name, email, password and confirm password are required");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage("Password and confirm password must match");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(ADMIN_REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          confirm_password: form.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Registration failed");
      }

      toast.success("Admin registered successfully");
      navigate("/login", { replace: true });
    } catch (error) {
      setErrorMessage(error.message || "Registration failed");
      toast.error(error.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ui-auth-shell grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-emerald-950 lg:block">
        <img
          src={heroImage}
          alt="Cafe interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/70" />

        <div className="absolute bottom-10 left-10 right-10 max-w-lg space-y-3 text-orange-50">
          <p className="text-xs font-bold uppercase tracking-widest">First Admin Setup</p>
          <h1 className="text-5xl font-bold leading-tight">Launch the admin panel</h1>
          <p className="text-sm opacity-90">
            Create the first administrator account for your restaurant dashboard.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-10">
        <Card
          as="form"
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-4"
          padding="lg"
        >
          <div className="space-y-1 text-emerald-900">
            <p className="text-xs font-bold uppercase tracking-widest">Create Admin</p>
            <h2 className="text-3xl font-bold text-text-strong">Register</h2>
            <p className="text-sm text-text-muted">This works only for the first admin account.</p>
          </div>

          <InputField type="text" name="name" placeholder="Full name" value={form.name} onChange={handleChange} />

          <InputField type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} />

          <InputField type="text" name="phone" placeholder="Phone number" value={form.phone} onChange={handleChange} />

          <InputField type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} />

          <InputField type="password" name="confirmPassword" placeholder="Confirm password" value={form.confirmPassword} onChange={handleChange} />

          {errorMessage ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {errorMessage}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting} size="lg" fullWidth>
            {isSubmitting ? "Creating..." : "Create admin"}
          </Button>

          <p className="text-sm text-text-base">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-bold text-brand-700"
            >
              Login
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}

export default Register;
