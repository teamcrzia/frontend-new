import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  CheckCircle, Sparkles, Zap, FlaskConical, 
  Brain, FileText, Settings, ShieldCheck, ArrowRight
} from "lucide-react";
import "../styles/PaymentSuccess.css";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan || {
    name: "Plus",
    price: "₹349",
    duration: "INR / month"
  };
  const fromVideoCreate = location.state?.fromVideoCreate || false;

  // Real-time calculation based on plan duration properties
  const calculatedExpiryDate = new Date();
  const normalizedPlanName = plan.name ? plan.name.toLowerCase() : "plus";

  if (normalizedPlanName === "go") {
    calculatedExpiryDate.setDate(calculatedExpiryDate.getDate() + 1);
  } else if (normalizedPlanName === "pro") {
    calculatedExpiryDate.setDate(calculatedExpiryDate.getDate() + 180);
  } else {
    // Standard 'Plus' tier fallback rule
    calculatedExpiryDate.setDate(calculatedExpiryDate.getDate() + 30);
  }

  const formattedDate = calculatedExpiryDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="payment-success-wrapper">
      <div className="payment-success-container">
        {/* LOGO */}
        <div className="success-logo">
          <Sparkles className="logo-sparkle" size={24} />
          <span>SmartAI</span>
        </div>

        {/* SUCCESS ICON */}
        <div className="success-icon-container">
          <div className="success-icon-bg">
            <CheckCircle size={64} strokeWidth={1.5} />
          </div>
        </div>

        {/* WELCOME TEXT */}
        <h1 className="success-title">Welcome to SmartAI Premium</h1>
        <p className="success-subtitle">
          Your subscription is active. Get ready to experience the next dimension of digital intelligence.
        </p>

        {/* CARDS GRID */}
        <div className="success-cards-grid">
          {/* SUBSCRIPTION DETAILS */}
          <div className="success-card">
            <p className="card-label">SUBSCRIPTION DETAILS</p>
            <h2 className="plan-name">{plan.name} Plan</h2>
            <div className="plan-price">
              <span className="amount">{plan.price}</span>
              <span className="period">/{plan.duration.split('/').pop().trim()}</span>
            </div>
            <div className="next-billing">
              <FileText size={16} />
              <span>Access Until: {formattedDate}</span>
            </div>
          </div>

          {/* PRO ACCESS UNLOCKED */}
          <div className="success-card">
            <p className="card-label">PRO ACCESS UNLOCKED</p>
            <ul className="unlocked-features">
              <li>
                <div className="feature-icon"><Zap size={18} fill="currentColor" /></div>
                <span>Priority AI Processing</span>
              </li>
              <li>
                <div className="feature-icon"><FlaskConical size={18} /></div>
                <span>Exclusive Beta Access</span>
              </li>
              <li>
                <div className="feature-icon"><Brain size={18} /></div>
                <span>Advanced LLM Models</span>
              </li>
            </ul>
          </div>
        </div>

        {/* MAIN CTA */}
        <button className="start-pro-btn" onClick={() => navigate("/", { state: fromVideoCreate ? { activateVideoMode: true } : {} })}>
          {fromVideoCreate ? "Start Creating Your Video" : "Start Your First Pro Chat"}
          <ArrowRight size={18} />
        </button>

        {/* SECONDARY LINKS */}
        <div className="success-links">
          <button className="text-link">
            <FileText size={16} />
            View Receipt
          </button>
          <button className="text-link" onClick={() => navigate("/settings")}>
            <Settings size={16} />
            Manage Subscription
          </button>
        </div>

        {/* FOOTER STATUS */}
        <div className="success-footer">
          <span>SYSTEM STATUS: ALL MODELS OPERATIONAL</span>
          <span className="footer-dot">•</span>
          <span className="secure-text">
            <ShieldCheck size={14} />
            TRANSACTION SECURE
          </span>
        </div>
      </div>
    </div>
  );
}