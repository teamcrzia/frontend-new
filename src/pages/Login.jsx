import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Login.css";

import {
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";

const Login = () => {
  // 🎨 Keep theme consistent on page reload/refresh
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("appTheme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // 🔹 Handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setErrors({ ...errors, [e.target.name]: "" });
    setErrorMessage("");
  };

  // 🔹 Validation
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
      newErrors.password = "Password must be at least 6 characters";
    }

    return newErrors;
  };

  // 🔥 EMAIL LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setLoginLoading(true);
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        const token = await userCredential.user.getIdToken();

        // 🔥 CHECK USER IN MONGODB
        const res = await fetch("http://127.0.0.1:8000/check-user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data.exists) {
          // 🔥 Account exists, but only send to /chat if onboarding
          // (name/dob/role via /save-profile) was actually completed.
          navigate(data.onboarded ? "/chat" : "/onboarding");
        } else {
          // 🔥 User is valid in Firebase but has no Mongo record yet
          // (e.g. signup was interrupted before the DB write completed).
          // Create it here instead of bouncing them in a loop.
          const registerRes = await fetch("http://127.0.0.1:8000/register-user", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: formData.email }),
          });

          if (registerRes.ok) {
            navigate("/onboarding"); // 🔥 fresh record, always needs onboarding
          } else {
            setErrorMessage("Not registered. Please create an account");
            await auth.signOut();
            setTimeout(() => {
              navigate("/signup");
            }, 2000);
          }
        }

      } catch (error) {
        if (
          error.code === "auth/user-not-found" ||
          error.code === "auth/invalid-credential" ||
          error.code === "auth/wrong-password"
        ) {
          // Firebase intentionally collapses "no such account" and "wrong
          // password" into the same generic error to prevent email
          // enumeration. To tell them apart (as requested), we do a
          // separate lookup — this only works if "Email Enumeration
          // Protection" is disabled in the Firebase console, otherwise
          // it'll always report the email as existing.
          try {
            const methods = await fetchSignInMethodsForEmail(auth, formData.email);

            if (methods.length === 0) {
              setErrorMessage("Account not found. Please sign up");
            } else {
              setErrorMessage("Incorrect password");
            }
          } catch {
            setErrorMessage("Incorrect email or password");
          }
        } else {
          setErrorMessage("Something went wrong. Try again.");
        }
      } finally {
        setLoginLoading(false);
      }
    }
  };

  // 🔥 FORGOT PASSWORD
  const handleForgotPassword = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.email) {
      setErrors({ ...errors, email: "Enter your email to reset your password" });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({ ...errors, email: "Enter a valid email address" });
      return;
    }

    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setSuccessMessage(`Password reset link sent to ${formData.email}`);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setErrorMessage("No account found with that email.");
      } else if (err.code === "auth/too-many-requests") {
        setErrorMessage("Too many attempts. Please try again later.");
      } else {
        setErrorMessage("Couldn't send reset link. Please try again.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  // 🔥 GOOGLE LOGIN
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const token = await result.user.getIdToken();

      // 🔥 CHECK USER IN MONGODB
      const res = await fetch("http://127.0.0.1:8000/check-user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.exists) {
        navigate(data.onboarded ? "/chat" : "/onboarding");
      } else {
        // 🔥 Same self-heal as email login: register if missing instead of dead-ending.
        const registerRes = await fetch("http://127.0.0.1:8000/register-user", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: result.user.email }),
        });

        if (registerRes.ok) {
          navigate("/onboarding");
        } else {
          setErrorMessage("Not registered. Please create an account");
          await auth.signOut();
          setTimeout(() => {
            navigate("/signup");
          }, 2000);
        }
      }

    } catch (err) {
      setErrorMessage("Login failed. Try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Log in to unleash your SmartAI.</p>

        {/* Google Button */}
        <button 
          className={`google-btn ${googleLoading ? "loading" : ""}`} 
          onClick={handleGoogleSignIn}
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

        {/* FORM */}
        <form onSubmit={handleLogin}>
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

          <div className="forgot-password-row">
            <button
              type="button"
              className="forgot-password-link"
              onClick={handleForgotPassword}
              disabled={forgotLoading}
            >
              {forgotLoading ? "Sending..." : "Forgot password?"}
            </button>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loginLoading}>
            {loginLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="auth-footer">
          Don’t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>

      {/* 🔥 ERROR MODAL */}
      {errorMessage && (
        <div
          className="error-modal-overlay"
          onClick={() => setErrorMessage("")}
        >
          <div
            className="error-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Login Failed</h3>
            <p>{errorMessage}</p>
            <button
              onClick={() => {
                setErrorMessage("");
                // Only bounce to signup when there's genuinely no account —
                // wrong password / Google-only account shouldn't send them
                // to create a duplicate account.
                if (errorMessage.startsWith("Account not found")) {
                  navigate("/signup");
                }
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* 🔥 SUCCESS MODAL (forgot password) */}
      {successMessage && (
        <div
          className="success-modal-overlay"
          onClick={() => setSuccessMessage("")}
        >
          <div
            className="success-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Check your inbox</h3>
            <p>{successMessage}</p>
            <button onClick={() => setSuccessMessage("")}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;