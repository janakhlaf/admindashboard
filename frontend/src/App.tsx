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
                <Route path={ROUTE_PATHS.DASHBOARD} element={<Overview />} />
                <Route path={ROUTE_PATHS.USERS} element={<Users />} />
                <Route path={ROUTE_PATHS.FILMS} element={<Films />} />
                <Route path={ROUTE_PATHS.ASSETS} element={<Assets />} />
              </Route>
              <Route path="*" element={<Navigate to={ROUTE_PATHS.DASHBOARD} replace />} />
            </Routes>
          </HashRouter>
        </MotionConfig>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;