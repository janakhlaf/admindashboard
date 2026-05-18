import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { MotionConfig } from "framer-motion";

import { ROUTE_PATHS } from "@/lib/index";

import NexusLayout from "@/components/NexusLayout";

import Home from "@/pages/Home";
import Overview from "@/pages/Overview";
import Users from "@/pages/Users";
import Films from "@/pages/Films";
import Assets from "@/pages/Assets";
import UploadAsset from "@/pages/UploadAsset";
import UploadFilm from "@/pages/UploadFilm";
import AdminLogin from "@/pages/AdminLogin";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isLoggedIn =
    localStorage.getItem("admin_logged_in") === "true";

  if (!isLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

const App = () => {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MotionConfig reducedMotion="user">
          <Toaster />
          <Sonner />

          <HashRouter>
            <Routes>
              <Route path="/home" element={<Home />} />

              <Route path="/login" element={<AdminLogin />} />

              <Route
                element={
                  <ProtectedRoute>
                    <NexusLayout />
                  </ProtectedRoute>
                }
              >
                <Route
                  path={ROUTE_PATHS.DASHBOARD}
                  element={<Overview />}
                />

                <Route
                  path={ROUTE_PATHS.USERS}
                  element={<Users />}
                />

                <Route
                  path={ROUTE_PATHS.FILMS}
                  element={<Films />}
                />

                <Route
                  path={ROUTE_PATHS.ASSETS}
                  element={<Assets />}
                />

                <Route
                  path="/upload-asset"
                  element={<UploadAsset />}
                />

                <Route
                  path="/upload-film"
                  element={<UploadFilm />}
                />
              </Route>

              <Route
                path="*"
                element={<Navigate to="/home" replace />}
              />
            </Routes>
          </HashRouter>
        </MotionConfig>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;