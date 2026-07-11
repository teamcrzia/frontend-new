import React, { useState } from "react";
import "../styles/Login.css";
import { Link, useNavigate } from "react-router-dom";

import {
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

import { auth } from "../firebase";

const Signup = () => {
  // 🎨 Keep theme consistent on page reload/refresh
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("appTheme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    agree: false,
  });

  const [errors, setErrors] = useState({});
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // 🔹 INPUT CHANGE
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    setErrors({ ...errors, [name]: "" });
  };

  // 🔹 VALIDATION
  const validate = () => {
    let newErrors = {};

    if (!formData.email) {
      newErrors.email = "Please enter your email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Please enter your password";
    } else if (formData.password.length < 6) {
      newErrors.password = "Minimum 6 characters required";
    }

    if (!formData.agree) {
      newErrors.agree = "Please accept the terms to continue";
    }

    return newErrors;
  };

  // 🔥 EMAIL SIGNUP — now just starts a pending signup + sends the code.
  // The actual Firebase account isn't created until the code is verified
  // on the /verify-email screen, so an unverified/fake email never
  // becomes a real account.
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setSubmitLoading(true);

      try {
        const res = await fetch("http://127.0.0.1:8000/start-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrors({ email: data.detail || "Something went wrong. Please try again." });
          return;
        }

        // Pass email + password along in memory only (router state) —
        // never persisted to localStorage. VerifyEmail.jsx needs the
        // password to sign the user in client-side once verification
        // succeeds on the backend.
        navigate("/verify-email", {
          state: { email: formData.email, password: formData.password },
        });
      } catch (err) {
        setErrors({ email: "Something went wrong. Please try again." });
      } finally {
        setSubmitLoading(false);
      }
    }
  };

  // 🔥 GOOGLE SIGNUP — unaffected. Google-verified emails are already
  // known-deliverable, so there's nothing to verify here.
  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const token = await result.user.getIdToken();

      const res = await fetch("http://127.0.0.1:8000/register-user", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: result.user.email }),
      });

      if (!res.ok) {
        throw new Error("Failed to save account. Please try again.");
      }

      navigate("/onboarding");

    } catch (err) {
      alert(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Welcome! Please fill in details to start.</p>

        {/* Google Authentication Trigger Button */}
        <button 
          className={`google-btn ${googleLoading ? "loading" : ""}`} 
          onClick={handleGoogleSignup}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <div className="spinner"></div>
          ) : (
            <>
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
              Continue with Google
            </>
          )}
        </button>

        <div className="auth-divider">
          <span></span>
          <p>or</p>
          <span></span>
        </div>

        {/* Form Elements */}
        <form onSubmit={handleSubmit}>
          <div className={`input-group ${errors.email ? "error" : ""}`}>
            <label>Email Address</label>
            <input
              className="auth-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <p className="auth-error">{errors.email}</p>}
          </div>

          <div className={`input-group ${errors.password ? "error" : ""}`}>
            <label>Password</label>
            <input
              className="auth-input"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <p className="auth-error">{errors.password}</p>}
          </div>

          <div className="auth-terms">
            <input
              type="checkbox"
              name="agree"
              checked={formData.agree}
              onChange={handleChange}
            />
            <span>
              I agree to the <a href="#">Terms</a> and <a href="#">Privacy</a>.
            </span>
          </div>
          {errors.agree && (
            <p className="auth-error" style={{ marginBottom: "16px", marginTop: "-12px" }}>
              {errors.agree}
            </p>
          )}

          <button type="submit" className="auth-submit-btn" disabled={submitLoading}>
            {submitLoading ? "Sending code..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;