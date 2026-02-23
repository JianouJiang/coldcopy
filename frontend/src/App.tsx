import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Landing from "./pages/Landing";
import Generate from "./pages/Generate";
import Output from "./pages/Output";
import Success from "./pages/Success";
import Cancel from "./pages/Cancel";
import { ToastContainer } from "./components/Toast";
import { I18nProvider, LanguageToggle } from "./lib/i18n";

// Agent Mode pages (lazy loaded)
const AgentLogin = lazy(() => import("./pages/agent/Login"));
const AgentRegister = lazy(() => import("./pages/agent/Register"));
const AgentDashboard = lazy(() => import("./pages/agent/Dashboard"));
const AgentCampaignNew = lazy(() => import("./pages/agent/CampaignNew"));
const AgentCampaignDetail = lazy(() => import("./pages/agent/CampaignDetail"));
const AgentSettings = lazy(() => import("./pages/agent/Settings"));
const AgentUpgrade = lazy(() => import("./pages/agent/Upgrade"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

function App() {
  return (
    <I18nProvider>
      <Router>
        <div className="dark min-h-screen">
          <LanguageToggle />
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <Routes>
              {/* Public routes (existing) */}
              <Route path="/" element={<Landing />} />
              <Route path="/generate" element={<Generate />} />
              <Route path="/output" element={<Output />} />
              <Route path="/success" element={<Success />} />
              <Route path="/cancel" element={<Cancel />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

              {/* Agent Mode routes */}
              <Route path="/agent/login" element={<AgentLogin />} />
              <Route path="/agent/register" element={<AgentRegister />} />
              <Route path="/agent/dashboard" element={<AgentDashboard />} />
              <Route path="/agent/campaigns/new" element={<AgentCampaignNew />} />
              <Route path="/agent/campaigns/:id" element={<AgentCampaignDetail />} />
              <Route path="/agent/settings" element={<AgentSettings />} />
              <Route path="/agent/upgrade" element={<AgentUpgrade />} />
            </Routes>
          </Suspense>
          <ToastContainer />
        </div>
      </Router>
    </I18nProvider>
  );
}

export default App;
