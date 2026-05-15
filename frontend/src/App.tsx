import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { MotionConfig } from "framer-motion";

import { ROUTE_PATHS } from "@/lib/index";

import NexusLayout from "@/components/NexusLayout";

import Overview from "@/pages/Overview";
import Users from "@/pages/Users";
import Films from "@/pages/Films";
import Assets from "@/pages/Assets";

/* NEW PAGES */
import UploadAsset from "@/pages/UploadAsset";
import UploadFilm from "@/pages/UploadFilm";

const queryClient = new QueryClient();

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
              <Route element={<NexusLayout />}>
                
                {/* Dashboard */}
                <Route
                  path={ROUTE_PATHS.DASHBOARD}
                  element={<Overview />}
                />

                {/* Users */}
                <Route
                  path={ROUTE_PATHS.USERS}
                  element={<Users />}
                />

                {/* Films */}
                <Route
                  path={ROUTE_PATHS.FILMS}
                  element={<Films />}
                />

                {/* Assets */}
                <Route
                  path={ROUTE_PATHS.ASSETS}
                  element={<Assets />}
                />

                {/* NEW ADMIN UPLOAD PAGES */}

                <Route
                  path="/upload-asset"
                  element={<UploadAsset />}
                />

                <Route
                  path="/upload-film"
                  element={<UploadFilm />}
                />
              </Route>

              {/* Redirect */}
              <Route
                path="*"
                element={
                  <Navigate
                    to={ROUTE_PATHS.DASHBOARD}
                    replace
                  />
                }
              />
            </Routes>
          </HashRouter>
        </MotionConfig>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;