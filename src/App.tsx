import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";

// Routes are lazy-loaded so the initial bundle (and the public landing page)
// doesn't ship Recharts, the dashboard, and the rest of the authed app up front.
// Each route becomes its own chunk, fetched on navigation.
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const DashboardOverview = lazy(() => import("./pages/DashboardOverview"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AddTransaction = lazy(() => import("./pages/AddTransaction"));
const EditTransaction = lazy(() => import("./pages/EditTransaction"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
    <div
      className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary"
      role="status"
      aria-label="Loading"
    />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SpeedInsights />
        <BrowserRouter>
          <Navbar />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<DashboardOverview />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/add-transaction" element={<AddTransaction />} />
              <Route path="/transactions/:transactionId/edit" element={<EditTransaction />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
