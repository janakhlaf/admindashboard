import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const API_URL = "http://127.0.0.1:8000";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Login failed"
        );
      }

      localStorage.setItem(
        "admin_logged_in",
        "true"
      );

      localStorage.setItem(
        "admin_email",
        data.email
      );

      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 overflow-hidden relative">

      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full top-[-100px] left-[-100px]" />

      <div className="absolute w-[400px] h-[400px] bg-purple-500/20 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.9,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{
          duration: 0.4,
        }}
        className="relative z-10 w-full max-w-md bg-[#050816]/90 border border-cyan-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,255,255,0.15)] backdrop-blur-xl"
      >

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Admin Login
          </h1>

          <p className="text-gray-400 mt-3">
            Secure access to dashboard
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          autoComplete="off"
          className="space-y-5"
        >

          {/* Fake Hidden Inputs */}
          <input
            type="text"
            name="fakeusernameremembered"
            style={{ display: "none" }}
          />

          <input
            type="password"
            name="fakepasswordremembered"
            style={{ display: "none" }}
          />

          {/* Email */}
          <div>
            <label className="text-gray-300 text-sm mb-2 block">
              Email
            </label>

            <input
              type="email"
              name="admin-email"
              autoComplete="off"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              className="w-full bg-black/40 border border-cyan-500/20 focus:border-cyan-400 outline-none rounded-xl px-4 py-3 text-white transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-300 text-sm mb-2 block">
              Password
            </label>

            <input
              type="password"
              name="admin-password"
              autoComplete="new-password"
              placeholder="Enter password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              className="w-full bg-black/40 border border-cyan-500/20 focus:border-cyan-400 outline-none rounded-xl px-4 py-3 text-white transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm">
              {error}
            </p>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:scale-[1.02] transition-all duration-300 shadow-lg disabled:opacity-50"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;