import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CheckCircle2, X, Sun, Moon } from "lucide-react";
import { getAuth } from "firebase/auth";
import "../styles/PricingPage.css";

// Plans no longer carry a "level" field or bar indicator — just the
// plain plan details.
const plans = [
  {
    name: "Go",
    price: "₹19",
    duration: "INR / day",
    desc: "Keep chatting with expanded access",
    features: [
      "Unlimited messages",
      "Disappearing messages on and off",
      "Overthinking AI",
    ],
    button: "Upgrade to Go",
  },
  {
    name: "Plus",
    price: "₹349",
    duration: "INR / month",
    desc: "Unlock the full experience",
    features: [
      "Unlimited messages",
      "Disappearing messages on and off",
      "Overthinking AI",
    ],
    button: "Upgrade to Plus",
  },
  {
    name: "Pro",
    price: "₹999",
    duration: "INR / 6 month",
    desc: "Maximize your productivity",
    features: [
      "Unlimited messages",
      "Disappearing messages on and off",
      "Overthinking AI",
    ],
    button: "Upgrade to Pro",
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromVideoCreate = location.state?.fromVideoCreate || false;

  // Synced with the same "appTheme" key the rest of the app uses,
  // so switching theme here matches Settings / ChatWithAi.
  const [theme, setTheme] = useState(() => localStorage.getItem("appTheme") || "dark");
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("appTheme", theme);
  }, [theme]);

  // Real subscription status, pulled from the same /check-user
  // endpoint the sidebar and Settings page already use.
  const [isPremium, setIsPremium] = useState(false);
  const [currentPlanName, setCurrentPlanName] = useState("");
  const [showSubscribedModal, setShowSubscribedModal] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setIsPremium(false);
        setCurrentPlanName("");
        return;
      }
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch("http://127.0.0.1:8000/check-user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setIsPremium(Boolean(data?.premium));
        setCurrentPlanName(data?.plan || "");
      } catch (err) {
        console.error("Could not fetch subscription status:", err);
        setIsPremium(false);
        setCurrentPlanName("");
      }
    });
    return () => unsubscribe();
  }, []);

  const isCurrentPlan = (plan) =>
    isPremium && currentPlanName && plan.name.toLowerCase() === currentPlanName.toLowerCase();

  const handleUpgrade = (plan) => {
    if (isPremium) {
      setShowSubscribedModal(true);
      return;
    }
    navigate("/order-summary", { state: { plan, fromVideoCreate } });
  };

  return (
    <div className={`pricing-page-wrapper ${isDark ? "dark" : "light"}`}>
      <div className="pricing-grid-backdrop" aria-hidden="true" />

      <div className="pricing-page">
        <div className="pricing-header">
          <button className="back-nav-btn" onClick={() => navigate("/")} title="Back to Chat">
            <ArrowLeft size={22} />
          </button>

          <div className="pricing-header-text">
            <span className="pricing-eyebrow">PLAN LEVELS</span>
            <h1 className="pricing-title">Choose your plan</h1>
            <p className="pricing-subtitle">
              Every plan unlocks a different level of access. Pick what fits you.
            </p>
          </div>

          <button
            className="theme-toggle-btn"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            title="Toggle theme"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="pricing-container">
          {plans.map((plan, index) => {
            const currentPlan = isCurrentPlan(plan);

            return (
              <div
                key={index}
                className={`pricing-card ${currentPlan ? "is-current" : ""}`}
              >
                {currentPlan && <span className="tag tag-current">YOUR PLAN</span>}

                <h2 className="plan-name">{plan.name}</h2>

                <div className="price-block">
                  <span className="price">{plan.price}</span>
                  <span className="duration">{plan.duration}</span>
                </div>

                <p className="desc">{plan.desc}</p>

                <button
                  className={`buy-btn ${currentPlan ? "disabled current-plan-btn" : ""}`}
                  disabled={currentPlan}
                  onClick={() => handleUpgrade(plan)}
                >
                  {currentPlan ? (
                    <>
                      <CheckCircle2 size={16} /> Your Current Plan
                    </>
                  ) : (
                    plan.button
                  )}
                </button>

                <div className="features">
                  {plan.features.map((f, i) => (
                    <p key={i}>{f}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ALREADY SUBSCRIBED MODAL */}
      {showSubscribedModal && (
        <div
          className="subscribed-modal-overlay"
          onClick={() => setShowSubscribedModal(false)}
        >
          <div className="subscribed-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="subscribed-modal-close"
              onClick={() => setShowSubscribedModal(false)}
            >
              <X size={18} />
            </button>

            <div className="subscribed-modal-icon">
              <CheckCircle2 size={32} />
            </div>

            <h3>You're already subscribed</h3>
            <p>
              You're currently on the <strong>{currentPlanName || "Pro"}</strong> plan.
              To switch plans or manage your billing, head to your subscription settings.
            </p>

            <div className="subscribed-modal-actions">
              <button
                className="subscribed-modal-secondary"
                onClick={() => setShowSubscribedModal(false)}
              >
                Got it
              </button>
              <button
                className="subscribed-modal-primary"
                onClick={() => navigate("/settings")}
              >
                Manage Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}