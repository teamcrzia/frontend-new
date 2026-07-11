import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import "../styles/Login.css";
import "../styles/VerifyEmail.css";

const RESEND_COOLDOWN_SECONDS = 45;
const MAX_RESENDS = 3;

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Email + password only ever live in router state (in-memory) — never
  // written to localStorage. If someone lands here directly (refresh,
  // bookmark, etc.) without that state, bounce them back to signup.
  const { email, password } = location.state || {};

  React.useEffect(() => {
    if (!email || !password) {
      navigate("/signup", { replace: true });
    }
  }, [email, password, navigate]);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("appTheme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendsLeft, setResendsLeft] = useState(MAX_RESENDS);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown for the resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/verify-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Incorrect code. Please try again.");
        // Ran out of attempts or code expired — no point staying here
        if (
          data.detail?.toLowerCase().includes("please sign up again")
        ) {
          setTimeout(() => navigate("/signup"), 2000);
        }
        return;
      }

      // ✅ Account now exists on the backend — sign in client-side to
      // establish the Firebase session, same as a normal login.
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/onboarding");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendsLeft <= 0) return;

    setResending(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/resend-signup-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Could not resend code.");
        if (data.detail?.toLowerCase().includes("please sign up again")) {
          setTimeout(() => navigate("/signup"), 2000);
        }
        return;
      }

      setResendsLeft(data.resendsLeft);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setCode("");
    } catch (err) {
      setError("Could not resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (!email || !password) return null;

  return (
    <div className="auth-page">
      <div className="auth-card verify-card">
        <h2>Check your inbox</h2>
        <p className="auth-subtitle">
          Enter the verification code we just sent to
          <br />
          <span className="verify-email-highlight">{email}</span>
        </p>

        <form onSubmit={handleVerify}>
          <div className="verify-code-field">
            <label>Code</label>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="••••••"
              autoComplete="one-time-code"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit-btn" disabled={verifying}>
            {verifying ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <p className="auth-footer">
          {resendsLeft <= 0 ? (
            "No resends left. Please sign up again."
          ) : cooldown > 0 ? (
            `Resend code in ${cooldown}s`
          ) : (
            <button
              type="button"
              className="resend-link-btn"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? "Sending..." : `Resend code (${resendsLeft} left)`}
            </button>
          )}
        </p>

        <p className="auth-footer">
          Wrong email? <Link to="/signup">Start over</Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
