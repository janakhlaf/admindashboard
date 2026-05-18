import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, ShieldCheck } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 overflow-hidden relative">
      <div className="absolute w-[600px] h-[600px] bg-cyan-500/20 blur-[140px] rounded-full top-[-120px] left-[-120px]" />
      <div className="absolute w-[450px] h-[450px] bg-purple-500/20 blur-[140px] rounded-full bottom-[-120px] right-[-120px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md bg-[#050816]/90 border border-cyan-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,255,255,0.15)] backdrop-blur-xl text-center"
      >
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl flex items-center justify-center bg-cyan-500/10 border border-cyan-400/30 shadow-[0_0_30px_rgba(0,255,255,0.25)]">
          <ShieldCheck className="w-10 h-10 text-cyan-400" />
        </div>

        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Admin Access
        </h1>

        <p className="text-gray-400 mt-4 mb-8">
          Login to continue to the admin dashboard
        </p>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:scale-[1.02] transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
        >
          <LogIn className="w-5 h-5" />
          Login
        </button>
      </motion.div>
    </div>
  );
};

export default Home;