import { useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Film,
  Box,
  Zap,
  Upload,
  Clapperboard,
  LogOut,
} from "lucide-react";
import { cn, ROUTE_PATHS } from "@/lib/index";

const navItems = [
  { path: ROUTE_PATHS.DASHBOARD, icon: LayoutDashboard },
  { path: ROUTE_PATHS.USERS, icon: Users },
  { path: ROUTE_PATHS.FILMS, icon: Film },
  { path: ROUTE_PATHS.ASSETS, icon: Box },
  { path: "/upload-asset", icon: Upload },
  { path: "/upload-film", icon: Clapperboard },
  { path: "/admin-slider", icon: Zap }, // 🟢 أضفناها عشان تبين بالسايدبار
];

const NexusLayout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_logged_in");
    localStorage.removeItem("admin_email");

    navigate("/home", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background relative">

      {/* 🟢 Background Grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.2 0.05 270 / 0.1) 1px, transparent 1px), linear-gradient(90deg, oklch(0.2 0.05 270 / 0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* 🟢 Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-16 z-50 bg-card/80 backdrop-blur-xl border-r border-border/40">
        <div className="flex flex-col h-full">

          {/* Logo */}
          <div className="h-20 flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.70 0.25 275), oklch(0.72 0.20 195))",
                boxShadow:
                  "0 0 20px oklch(0.7 0.25 270 / 0.4), 0 0 40px oklch(0.7 0.25 270 / 0.2)",
              }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-center h-12 w-full transition-all duration-200 relative",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full"
                        style={{ background: "oklch(0.70 0.25 275)" }}
                      />
                    )}

                    <item.icon className="w-5 h-5" />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="py-3 border-t border-border/40">
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="flex items-center justify-center h-12 w-full text-muted-foreground hover:text-red-400 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
            </button>

            <p className="text-xs text-muted-foreground text-center font-mono mt-2">
              v2
            </p>
          </div>
        </div>
      </aside>

      {/* 🟢 MAIN CONTENT (FIXED IMPORTANT PART) */}
      <main className="ml-16 min-h-screen relative z-10">
        
        {/* 🔥 هذا أهم تعديل */}
        <div className="p-6 w-full min-h-screen">
          <Outlet />
        </div>

      </main>
    </div>
  );
};

export default NexusLayout;