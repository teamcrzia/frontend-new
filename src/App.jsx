import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PricingPage from "./pages/PricingPage.jsx";
import OrderSummary from "./pages/OrderSummary.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Signup from "./pages/Signup.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import Login from "./pages/Login.jsx";
import ChatWithAi from "./pages/ChatWithAi.jsx";
import Settings from "./pages/Settings.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import { LanguageProvider } from "./pages/LanguageContext.jsx";

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* 👇 BOTH of these will now correctly load your chat interface! */}
          <Route path="/" element={<ChatWithAi />} />
          <Route path="/chat" element={<ChatWithAi />} />

          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/order-summary" element={<OrderSummary />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;