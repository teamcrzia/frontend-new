import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { useState, useEffect } from "react";
import "../styles/OrderSummary.css";

export default function OrderSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan || {
    name: "Go",
    price: "₹19",
    duration: "INR / day",
    desc: "Keep chatting with expanded access",
    features: [
      "Unlimited messages",
      "Disappearing messages on and off",
      "Overthinking AI",
    ],
  };
  const fromVideoCreate = location.state?.fromVideoCreate || false;

  // Extract numeric price safely
  const numericPrice = parseFloat(plan.price.replace(/[^0-9.]/g, "")) || 0;
  const tax = 0; 
  const taxAmount = (numericPrice * tax) / 100;
  const totalAmount = numericPrice + taxAmount;
  const [loading, setLoading] = useState(false);

  // Securely load the Razorpay checkout script on component lifecycle mount
  useEffect(() => {
    const scriptId = "razorpay-checkout-sdk-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onerror = () => console.error("Razorpay SDK compilation failed to download.");
      document.body.appendChild(script);
    }
  }, []);

  const handlePayment = async () => {
    if (loading) return;
    try {
      setLoading(true);

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setLoading(false);
        alert("Authentication context timed out. Please login again.");
        navigate("/login");
        return;
      }

      // Cryptographically force dynamic verification refresh tokens
      const token = await user.getIdToken(true);

      // 1. Initialize Order Context with FastAPI Backend Router
      const res = await fetch("http://127.0.0.1:8000/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: plan.name,
        }),
      });

      const order = await res.json();
      if (!res.ok || !order.success) {
        setLoading(false);
        alert(order.message || "Failed to establish authorization runtime session parameters.");
        return;
      }

      // 2. Formulate payment configuration tokens
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "SmartAI",
        description: `${plan.name} Plan Activation`,
        order_id: order.order_id,
        prefill: {
          name: user.displayName || "",
          email: user.email || "",
        },
        handler: async function (response) {
          try {
            // 3. Forward full cryptographically signed payloads to validation endpoints
            const verify = await fetch("http://127.0.0.1:8000/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                plan: plan.name,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const result = await verify.json();

            if (result.success) {
              setLoading(false);
              navigate("/payment-success", {
                state: {
                  plan,
                  fromVideoCreate,
                },
              });
            } else {
              setLoading(false);
              alert(result.message || "Payment verification declined by system security protocols.");
            }
          } catch (err) {
            console.error("Cryptographic signature response processing error: ", err);
            setLoading(false);
            alert("Verification layer interface timeout.");
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        theme: {
          color: "#6C63FF",
        },
      };

      if (!window.Razorpay) {
        alert("The Razorpay secure script layout engine isn't ready. Please wait a moment.");
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("Critical execution flow interrupt standard bounds: ", err);
      alert("Payment initialization error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page order-summary-wrapper">
      <div className="order-summary-container">
        <div className="order-header">
          <h1 className="order-title">Order Summary</h1>
          <button className="back-btn" onClick={() => navigate("/pricing")}>
            ← Back to Pricing
          </button>
        </div>

        <div className="order-content">
          <div className="order-section plan-details">
            <h2 className="section-title">Plan Details</h2>
            <div className="plan-card-summary">
              <h3 className="plan-name-summary">{plan.name} Plan</h3>
              <p className="plan-desc-summary">{plan.desc}</p>

              <div className="plan-header-info">
                <span className="price-summary">{plan.price}</span>
                <span className="duration-summary">{plan.duration}</span>
              </div>

              <div className="features-summary">
                <h4>Included Features:</h4>
                <ul>
                  {plan.features.map((feature, index) => (
                    <li key={index}>
                      <span className="feature-check">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="coupon-container">
              <input type="text" placeholder="Enter coupon code" className="coupon-input" />
              <button className="apply-btn">Apply</button>
            </div>
          </div>

          <div className="order-section order-details">
            <h2 className="section-title">Order Summary</h2>
            <div className="summary-table">
              <div className="summary-row">
                <span className="summary-label">{plan.name} Plan</span>
                <span className="summary-value">{plan.price}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Duration</span>
                <span className="summary-value">{plan.duration}</span>
              </div>
              <div className="summary-row summary-divider">
                <span className="summary-label">Subtotal</span>
                <span className="summary-value">{plan.price}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Tax ({tax}%)</span>
                <span className="summary-value">+₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="summary-row summary-total">
                <span className="summary-label">Total Amount</span>
                <span className="summary-value total-price">
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="proceed-section">
            <button
              className="proceed-btn"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? "Verifying Transaction..." : "Proceed to Payment"}
            </button>
            <p className="payment-info">
              Your payment is secure and encrypted. We accept all major payment methods.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}